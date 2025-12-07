import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat, normalizeOpenRouterResponse } from "@/lib/openrouter";
import type { OpenRouterMessage } from "@/lib/openrouter";
import type { CompareResult } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chargeUser } from "@/lib/charge";

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

    // Charge credits before making API calls
    const chargeResult = await chargeUser(user.id, "compare", models.length);

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

    // Build messages array
    const messages: OpenRouterMessage[] = [];
    if (system) {
      messages.push({ role: "system", content: system });
    }
    messages.push({ role: "user", content: prompt });

    // Run all models in parallel
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

    const results = await Promise.all(promises);

    // Log usage
    const adminClient = createAdminClient();
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
