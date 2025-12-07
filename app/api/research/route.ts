import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat, normalizeOpenRouterResponse } from "@/lib/openrouter";
import type { OpenRouterMessage } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chargeUser } from "@/lib/charge";
import { hasEnoughCredits } from "@/lib/credits";
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

    // Get user's plan to enforce Research Panel lock for free users
    const adminClient = createAdminClient();
    const { data: wallet } = await adminClient
      .from("user_wallet")
      .select("subscription_plan")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Lock Research Panel for free users
    if (wallet.subscription_plan === "free") {
      return NextResponse.json(
        {
          error: "Research Panel is only available for Starter and Pro plans",
          code: "PLAN_TOO_LOW",
        },
        { status: 403 }
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

    // Step 1: Check if user has enough credits (read-only check)
    const creditCheck = await hasEnoughCredits(user.id, "research");
    if (!creditCheck.hasEnough) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          credits_needed: creditCheck.creditsNeeded,
          balance: creditCheck.balance,
        },
        { status: 402 }
      );
    }

    // Step 2: Get expert reports with different system prompts
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
          report: normalized.outputText,
          usage: {
            prompt_tokens: normalized.usage.input_tokens,
            completion_tokens: normalized.usage.output_tokens,
            total_tokens: normalized.usage.total_tokens,
          },
          error: undefined,
        } as {
          model: string;
          report: string;
          usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
          error?: string;
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
      // All experts failed, do NOT charge credits
      return NextResponse.json(
        { error: "All expert models failed" },
        { status: 500 }
      );
    }

    // Step 3: Synthesize reports
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

    let synthesizedReport: { content: string; follow_up_questions: string[] };
    let synthesisUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };
    
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
      synthesisUsage = {
        prompt_tokens: normalized.usage.input_tokens,
        completion_tokens: normalized.usage.output_tokens,
        total_tokens: normalized.usage.total_tokens,
      };
      const jsonMatch = normalized.outputText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        synthesizedReport = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in synthesis response");
      }
    } catch (error: any) {
      console.error("Synthesis error:", error);
      // If synthesis fails, do NOT charge credits
      return NextResponse.json(
        { error: `Synthesis failed: ${error.message}` },
        { status: 500 }
      );
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
          prompt_tokens: synthesisUsage.prompt_tokens,
          completion_tokens: synthesisUsage.completion_tokens,
          total_tokens: synthesisUsage.total_tokens,
        },
      },
    };

    // Step 4: Only on success, charge credits
    const chargeResult = await chargeUser(user.id, "research");
    if (!chargeResult.success) {
      // Edge case: credits consumed between check and charge
      console.error("Failed to charge credits after successful research:", chargeResult.error);
      // Still return results, but log the issue
    }

    // Step 5: Log usage
    const allModels = [...expertModels, synthesizerModel];
    const totalTokensIn = expertReports.reduce((sum, r) => sum + r.usage.prompt_tokens, 0) + synthesisUsage.prompt_tokens;
    const totalTokensOut = expertReports.reduce((sum, r) => sum + r.usage.completion_tokens, 0) + synthesisUsage.completion_tokens;

    await adminClient.from("usage_log").insert({
      user_id: user.id,
      mode: "research",
      credits_spent: 10,
      model_ids_used: allModels,
      tokens_in: totalTokensIn,
      tokens_out: totalTokensOut,
      meta: {
        expert_count: expertModels.length,
        successful_experts: successfulReports.length,
      },
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
