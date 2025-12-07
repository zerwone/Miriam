import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat, normalizeOpenRouterResponse } from "@/lib/openrouter";
import type { OpenRouterMessage } from "@/lib/openrouter";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model = "qwen/qwen-2.5-7b-instruct:free", temperature = 0.7, max_tokens } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Convert messages to OpenRouter format
    const openRouterMessages: OpenRouterMessage[] = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    const startTime = Date.now();
    const response = await callOpenRouterChat({
      model,
      messages: openRouterMessages,
      temperature,
      max_tokens,
    });
    const time_ms = Date.now() - startTime;

    const normalized = normalizeOpenRouterResponse(response);

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
