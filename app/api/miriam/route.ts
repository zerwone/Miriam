import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat, normalizeOpenRouterResponse } from "@/lib/openrouter";
import type { OpenRouterMessage } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chargeUser } from "@/lib/charge";
import { hasEnoughCredits } from "@/lib/credits";
import { MIRIAM_SYSTEM_PROMPT } from "@/lib/miriamPrompt";

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
    const { messages, model = "qwen/qwen-2.5-7b-instruct:free", temperature = 0.7, max_tokens } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Step 1: Check if user has enough credits (read-only check)
    const creditCheck = await hasEnoughCredits(user.id, "miriam");
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

    // Step 2: Convert messages to OpenRouter format and inject Miriam persona
    const openRouterMessages: OpenRouterMessage[] = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Inject Miriam persona system prompt if no system message exists
    const hasSystemMessage = openRouterMessages.some((m) => m.role === "system");
    if (!hasSystemMessage) {
      openRouterMessages.unshift({
        role: "system",
        content: MIRIAM_SYSTEM_PROMPT,
      });
    }

    // Step 3: Call OpenRouter
    const startTime = Date.now();
    let response;
    let normalized;
    let time_ms = 0;

    try {
      response = await callOpenRouterChat({
        model,
        messages: openRouterMessages,
        temperature,
        max_tokens,
      });
      time_ms = Date.now() - startTime;
      normalized = normalizeOpenRouterResponse(response);
    } catch (error: any) {
      // If OpenRouter call fails, do NOT charge credits
      console.error("OpenRouter call failed:", error);
      return NextResponse.json(
        { error: error.message || "LLM call failed" },
        { status: 500 }
      );
    }

    // Step 4: Only on success, charge credits
    const chargeResult = await chargeUser(user.id, "miriam");
    if (!chargeResult.success) {
      // Edge case: credits consumed between check and charge
      console.error("Failed to charge credits after successful LLM call:", chargeResult.error);
      // Still return the result, but log the issue
    }

    // Step 5: Log usage
    const adminClient = createAdminClient();
    await adminClient.from("usage_log").insert({
      user_id: user.id,
      mode: "miriam",
      credits_spent: 1,
      model_ids_used: [model],
      tokens_in: normalized.usage.input_tokens,
      tokens_out: normalized.usage.output_tokens,
      meta: {},
    });

    return NextResponse.json({
      text: normalized.outputText,
      model: normalized.rawModelId,
      usage: {
        prompt_tokens: normalized.usage.input_tokens,
        completion_tokens: normalized.usage.output_tokens,
        total_tokens: normalized.usage.total_tokens,
      },
      time_ms,
    });
  } catch (error: any) {
    console.error("Miriam API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
