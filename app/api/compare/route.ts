import { NextRequest, NextResponse } from "next/server";
import { callOpenRouterChat, normalizeOpenRouterResponse } from "@/lib/openrouter";
import type { OpenRouterMessage } from "@/lib/openrouter";
import type { CompareResult } from "@/lib/types";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Compare API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
