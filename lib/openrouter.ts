/**
 * OpenRouter API client utility
 * Handles all interactions with OpenRouter API
 */

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code?: number;
  };
}

/**
 * Calls OpenRouter chat completion API
 */
export async function callOpenRouterChat(
  request: OpenRouterRequest
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "https://miriam-lab.com",
      "X-Title": process.env.OPENROUTER_X_TITLE || "Miriam Lab",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData: OpenRouterError = await response.json().catch(() => ({
      error: {
        message: `HTTP ${response.status}: ${response.statusText}`,
        type: "http_error",
        code: response.status,
      },
    }));

    // Handle rate limiting
    if (response.status === 429) {
      throw new Error(
        `Rate limit exceeded: ${errorData.error.message}. Please try again later.`
      );
    }

    throw new Error(
      `OpenRouter API error: ${errorData.error.message || response.statusText}`
    );
  }

  const data: OpenRouterResponse = await response.json();
  return data;
}

/**
 * Normalized OpenRouter response type
 * Uses consistent internal naming (can differ from spec but must be consistent)
 */
export interface NormalizedOpenRouterResponse {
  outputText: string;
  rawModelId: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

/**
 * Normalizes OpenRouter response to a consistent internal format
 */
export function normalizeOpenRouterResponse(
  response: OpenRouterResponse
): NormalizedOpenRouterResponse {
  const message = response.choices[0]?.message?.content || "";
  return {
    outputText: message,
    rawModelId: response.model,
    usage: {
      input_tokens: response.usage.prompt_tokens,
      output_tokens: response.usage.completion_tokens,
      total_tokens: response.usage.total_tokens,
    },
  };
}
