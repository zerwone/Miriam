/**
 * Shared types for Miriam Lab
 */

export type Mode = "miriam" | "compare" | "judge" | "research";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
}

export interface CompareResult {
  model: string;
  output: string;
  time_ms: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

export interface JudgeResult {
  candidates: CompareResult[];
  judge_result: {
    ranking: Array<{
      model: string;
      rank: number;
      score: number;
      comment: string;
    }>;
    summary: string;
  };
}

export interface ResearchResult {
  expert_reports: Array<{
    model: string;
    report: string;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }>;
  synthesized_report: {
    content: string;
    follow_up_questions: string[];
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
}
