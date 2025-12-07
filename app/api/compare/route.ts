import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat, normalizeOpenRouterResponse } from "@/lib/openrouter";
import type { OpenRouterMessage } from "@/lib/openrouter";
import type { CompareResult } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chargeUser } from "@/lib/charge";
import { hasEnoughCredits } from "@/lib/credits";
import type { Mode } from "@/lib/types";

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
      models = ["qwen/qwen-2.5-7b-instruct:free"],
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

    if (!Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: "Models array is required" },
        { status: 400 }
      );
    }

    if (models.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 models allowed" },
        { status: 400 }
      );
    }

    // Get user's plan to enforce model limits
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

    // Enforce plan-based model limits
    const maxModels = wallet.subscription_plan === "free" ? 3 : 5;
    if (models.length > maxModels) {
      return NextResponse.json(
        {
          error: `Free plan is limited to 3 models. Upgrade to compare up to 5 models.`,
          code: "PLAN_LIMIT_EXCEEDED",
        },
        { status: 403 }
      );
    }

    // Determine credit mode based on model count
    const creditMode: Mode = models.length <= 3 ? "compare3" : "compare5";

    // Step 1: Check if user has enough credits (read-only check)
    const creditCheck = await hasEnoughCredits(user.id, creditMode);
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

    // Step 2: Build messages array
    const messages: OpenRouterMessage[] = [];
    if (system) {
      messages.push({ role: "system", content: system });
    }
    messages.push({ role: "user", content: prompt });

    // Step 3: Call OpenRouter for all models in parallel
    const promises = models.map(async (model: string): Promise<CompareResult> => {
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
          output: normalized.outputText,
          time_ms,
          usage: {
            prompt_tokens: normalized.usage.input_tokens,
            completion_tokens: normalized.usage.output_tokens,
            total_tokens: normalized.usage.total_tokens,
          },
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

    const results = await Promise.all(promises);

    // Check if all models failed
    const successfulResults = results.filter((r) => !r.error);
    if (successfulResults.length === 0) {
      // All models failed, do NOT charge credits
      return NextResponse.json(
        { error: "All models failed to respond" },
        { status: 500 }
      );
    }

    // Step 4: Only on success, charge credits
    const chargeResult = await chargeUser(user.id, creditMode);
    if (!chargeResult.success) {
      // Edge case: credits consumed between check and charge
      console.error("Failed to charge credits after successful LLM calls:", chargeResult.error);
      // Still return results, but log the issue
    }

    // Step 5: Log usage
    const creditsSpent = models.length <= 3 ? 3 : 5;
    const totalTokensIn = results.reduce((sum, r) => sum + r.usage.prompt_tokens, 0);
    const totalTokensOut = results.reduce((sum, r) => sum + r.usage.completion_tokens, 0);

    await adminClient.from("usage_log").insert({
      user_id: user.id,
      mode: "compare",
      credits_spent: creditsSpent,
      model_ids_used: models,
      tokens_in: totalTokensIn,
      tokens_out: totalTokensOut,
      meta: {
        model_count: models.length,
        successful_count: successfulResults.length,
        failed_count: results.length - successfulResults.length,
      },
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Compare API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
