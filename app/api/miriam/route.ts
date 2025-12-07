import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat, normalizeOpenRouterResponse } from "@/lib/openrouter";
import type { OpenRouterMessage } from "@/lib/openrouter";
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
    const { messages, model = "qwen/qwen-2.5-7b-instruct:free", temperature = 0.7, max_tokens } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Charge credits before making the API call
    const chargeResult = await chargeUser(user.id, "miriam", 1);

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

    // Convert messages to OpenRouter format
    const openRouterMessages: OpenRouterMessage[] = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

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
      // If OpenRouter call fails, we should refund credits
      // For now, we'll just log the error
      console.error("OpenRouter call failed after charging:", error);
      throw error;
    }

    // Log usage
    const adminClient = createAdminClient();
    await adminClient.from("usage_log").insert({
      user_id: user.id,
      mode: "miriam",
      credits_spent: 1,
      model_ids_used: [model],
      tokens_in: normalized.usage.prompt_tokens,
      tokens_out: normalized.usage.completion_tokens,
    });

    return NextResponse.json({
      ...normalized,
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
