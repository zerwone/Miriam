import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat, normalizeOpenRouterResponse } from "@/lib/openrouter";
import type { OpenRouterMessage } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chargeUser } from "@/lib/charge";
import type { CompareResult, JudgeResult } from "@/lib/types";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      prompt,
      candidateModels = ["qwen/qwen-2.5-7b-instruct:free", "deepseek/deepseek-chat:free", "meta-llama/llama-3.2-3b-instruct:free"],
      judgeModel = "deepseek/deepseek-chat:free",
      system,
      temperature = 0.7,
      max_tokens,
    } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(candidateModels) || candidateModels.length === 0) {
      return NextResponse.json(
        { error: "Candidate models array is required" },
        { status: 400 }
      );
    }

    if (candidateModels.length > 3) {
      return NextResponse.json(
        { error: "Maximum 3 candidate models allowed" },
        { status: 400 }
      );
    }

    // Charge credits before making API calls
    const chargeResult = await chargeUser(user.id, "judge", candidateModels.length);

    if (!chargeResult.success) {
      return NextResponse.json(
        {
          error: chargeResult.error || "Insufficient credits",
          credits_needed: chargeResult.credits_needed,
          balance: chargeResult.balance,
        },
        { status: 402 }
      );
    }

    // Step 1: Get responses from candidate models
    const messages: OpenRouterMessage[] = [];
    if (system) {
      messages.push({ role: "system", content: system });
    }
    messages.push({ role: "user", content: prompt });

    const candidatePromises = candidateModels.map(async (model: string): Promise<CompareResult> => {
      const startTime = Date.now();
      try {
        const response = await callOpenRouterChat({
          model,
          messages,
          temperature,
          max_tokens,
        });
        const time_ms = Date.now() - startTime;
        const normalized = normalizeOpenRouterResponse(response);

        return {
          model,
          output: normalized.text,
          time_ms,
          usage: normalized.usage,
        };
      } catch (error: any) {
        const time_ms = Date.now() - startTime;
        return {
          model,
          output: "",
          time_ms,
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
          error: error.message || "Unknown error",
        };
      }
    });

    const candidates = await Promise.all(candidatePromises);

    // Filter out failed candidates for judge evaluation
    const successfulCandidates = candidates.filter((c) => !c.error);

    if (successfulCandidates.length === 0) {
      return NextResponse.json(
        { error: "All candidate models failed" },
        { status: 500 }
      );
    }

    // Step 2: Build judge prompt
    const judgePrompt = `You are an expert AI evaluator. Your task is to rank and critique the following AI model responses to the same user prompt.

USER PROMPT:
${prompt}

${system ? `SYSTEM INSTRUCTION: ${system}\n` : ""}

CANDIDATE RESPONSES:
${successfulCandidates
  .map(
    (c, idx) => `
${idx + 1}. Model: ${c.model}
Response:
${c.output}
`
  )
  .join("\n")}

Please evaluate and rank these responses. Provide your analysis in the following JSON format:
{
  "ranking": [
    {
      "model": "model_name",
      "rank": 1,
      "score": 0.95,
      "comment": "Brief explanation of why this response is ranked here"
    }
  ],
  "summary": "Overall summary comparing all responses"
}

Rank them from best (rank 1) to worst. Consider factors like:
- Accuracy and correctness
- Completeness
- Clarity and coherence
- Relevance to the prompt
- Quality of reasoning (if applicable)

Return ONLY the JSON, no additional text.`;

    // Step 3: Call judge model
    let judgeResponse;
    try {
      const judgeApiResponse = await callOpenRouterChat({
        model: judgeModel,
        messages: [
          {
            role: "system",
            content: "You are an expert AI evaluator. Always respond with valid JSON only.",
          },
          { role: "user", content: judgePrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent evaluation
        max_tokens: max_tokens || 2000,
      });

      const normalized = normalizeOpenRouterResponse(judgeApiResponse);
      judgeResponse = normalized.text;
    } catch (error: any) {
      console.error("Judge model error:", error);
      return NextResponse.json(
        { error: `Judge model failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Parse judge response
    let judgeResult;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = judgeResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        judgeResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in judge response");
      }
    } catch (parseError) {
      console.error("Failed to parse judge response:", judgeResponse);
      // Fallback: create a simple ranking based on order
      judgeResult = {
        ranking: successfulCandidates.map((c, idx) => ({
          model: c.model,
          rank: idx + 1,
          score: 0.5,
          comment: "Automatic ranking (judge response parsing failed)",
        })),
        summary: "Judge evaluation completed, but response parsing failed.",
      };
    }

    // Ensure all candidates are in the ranking
    const rankedModels = new Set(judgeResult.ranking.map((r: any) => r.model));
    successfulCandidates.forEach((c) => {
      if (!rankedModels.has(c.model)) {
        judgeResult.ranking.push({
          model: c.model,
          rank: judgeResult.ranking.length + 1,
          score: 0.0,
          comment: "Not evaluated by judge",
        });
      }
    });

    const result: JudgeResult = {
      candidates,
      judge_result: judgeResult,
    };

    // Log usage
    const adminClient = createAdminClient();
    const allModels = [...candidateModels, judgeModel];
    const totalTokensIn = candidates.reduce((sum, c) => sum + c.usage.prompt_tokens, 0);
    const totalTokensOut = candidates.reduce((sum, c) => sum + c.usage.completion_tokens, 0);

    await adminClient.from("usage_log").insert({
      user_id: user.id,
      mode: "judge",
      credits_spent: 6,
      model_ids_used: allModels,
      tokens_in: totalTokensIn,
      tokens_out: totalTokensOut,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Judge API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
