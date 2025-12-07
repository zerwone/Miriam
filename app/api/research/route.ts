import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat, normalizeOpenRouterResponse } from "@/lib/openrouter";
import type { OpenRouterMessage } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chargeUser } from "@/lib/charge";
import type { ResearchResult } from "@/lib/types";

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
      question,
      expertModels = ["qwen/qwen-2.5-7b-instruct:free", "deepseek/deepseek-chat:free"],
      synthesizerModel = "deepseek/deepseek-chat:free",
      temperature = 0.7,
      max_tokens,
    } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(expertModels) || expertModels.length === 0) {
      return NextResponse.json(
        { error: "Expert models array is required" },
        { status: 400 }
      );
    }

    // Charge credits before making API calls
    const chargeResult = await chargeUser(user.id, "research", expertModels.length);

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

    // Step 1: Get expert reports with different system prompts
    const expertSystemPrompts = [
      "You are a technical expert. Provide a detailed, technical analysis focusing on facts, data, and implementation details.",
      "You are a creative strategist. Provide innovative ideas, alternative perspectives, and strategic recommendations.",
      "You are a critical analyst. Provide a balanced evaluation, identify potential issues, and suggest improvements.",
    ];

    const expertPromises = expertModels.map(async (model: string, idx: number) => {
      const systemPrompt = expertSystemPrompts[idx % expertSystemPrompts.length];
      const messages: OpenRouterMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ];

      const startTime = Date.now();
      try {
        const response = await callOpenRouterChat({
          model,
          messages,
          temperature,
          max_tokens: max_tokens || 2000,
        });
        const time_ms = Date.now() - startTime;
        const normalized = normalizeOpenRouterResponse(response);

        return {
          model,
          report: normalized.text,
          usage: normalized.usage,
          error: undefined,
        };
      } catch (error: any) {
        const time_ms = Date.now() - startTime;
        return {
          model,
          report: "",
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
          error: error.message || "Unknown error",
        };
      }
    });

    const expertReports = await Promise.all(expertPromises);

    // Filter out failed experts
    const successfulReports = expertReports.filter((r) => !r.error);

    if (successfulReports.length === 0) {
      return NextResponse.json(
        { error: "All expert models failed" },
        { status: 500 }
      );
    }

    // Step 2: Synthesize reports
    const synthesisPrompt = `You are a research synthesizer. Your task is to merge and synthesize multiple expert reports on the same question.

RESEARCH QUESTION:
${question}

EXPERT REPORTS:
${successfulReports
  .map(
    (r, idx) => `
Expert ${idx + 1} (${r.model}):
${r.report}
`
  )
  .join("\n---\n")}

Please synthesize these reports into a comprehensive final report. Your synthesis should:
1. Identify common themes and agreements
2. Highlight unique insights from each expert
3. Resolve any contradictions or conflicts
4. Provide a cohesive, well-structured summary
5. Suggest 3-5 follow-up questions for deeper exploration

Format your response as JSON:
{
  "content": "Your synthesized report here...",
  "follow_up_questions": ["Question 1", "Question 2", "Question 3"]
}

Return ONLY the JSON, no additional text.`;

    let synthesizedReport;
    try {
      const synthesisResponse = await callOpenRouterChat({
        model: synthesizerModel,
        messages: [
          {
            role: "system",
            content: "You are a research synthesizer. Always respond with valid JSON only.",
          },
          { role: "user", content: synthesisPrompt },
        ],
        temperature: 0.5,
        max_tokens: max_tokens || 3000,
      });

      const normalized = normalizeOpenRouterResponse(synthesisResponse);
      const jsonMatch = normalized.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        synthesizedReport = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in synthesis response");
      }
    } catch (error: any) {
      console.error("Synthesis error:", error);
      // Fallback synthesis
      synthesizedReport = {
        content: successfulReports
          .map((r, idx) => `Expert ${idx + 1} (${r.model}):\n${r.report}`)
          .join("\n\n---\n\n"),
        follow_up_questions: [
          "What are the key implications of these findings?",
          "How can these insights be applied in practice?",
          "What are the potential limitations or risks?",
        ],
      };
    }

    const result: ResearchResult = {
      expert_reports: expertReports.map((r) => ({
        model: r.model,
        report: r.report,
        usage: r.usage,
      })),
      synthesized_report: {
        content: synthesizedReport.content || "Synthesis failed",
        follow_up_questions: synthesizedReport.follow_up_questions || [],
        usage: {
          prompt_tokens: 0, // Will be calculated from synthesis call
          completion_tokens: 0,
          total_tokens: 0,
        },
      },
    };

    // Log usage
    const adminClient = createAdminClient();
    const allModels = [...expertModels, synthesizerModel];
    const totalTokensIn = expertReports.reduce((sum, r) => sum + r.usage.prompt_tokens, 0);
    const totalTokensOut = expertReports.reduce((sum, r) => sum + r.usage.completion_tokens, 0);

    await adminClient.from("usage_log").insert({
      user_id: user.id,
      mode: "research",
      credits_spent: 10,
      model_ids_used: allModels,
      tokens_in: totalTokensIn,
      tokens_out: totalTokensOut,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Research API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
