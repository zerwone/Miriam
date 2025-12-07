"use client";

import { useState } from "react";
import type { JudgeResult } from "@/lib/types";
import { ShareButton } from "@/components/ShareButton";

export const dynamic = "force-dynamic";

export default function JudgePage() {
  const [prompt, setPrompt] = useState("");
  const [system, setSystem] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([
    "qwen/qwen-2.5-7b-instruct:free",
    "deepseek/deepseek-chat:free",
  ]);
  const [judgeModel, setJudgeModel] = useState("deepseek/deepseek-chat:free");
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const availableModels = [
    { value: "qwen/qwen-2.5-7b-instruct:free", label: "Qwen 2.5 7B (Free)" },
    { value: "deepseek/deepseek-chat:free", label: "DeepSeek Chat (Free)" },
    { value: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B (Free)" },
    { value: "google/gemini-pro-1.5", label: "Gemini Pro 1.5" },
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  ];

  const judgeModels = [
    { value: "deepseek/deepseek-chat:free", label: "DeepSeek Chat (Free)" },
    { value: "qwen/qwen-2.5-7b-instruct:free", label: "Qwen 2.5 7B (Free)" },
    { value: "google/gemini-pro-1.5", label: "Gemini Pro 1.5" },
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  ];

  const toggleCandidate = (model: string) => {
    setSelectedCandidates((prev) => {
      if (prev.includes(model)) {
        return prev.filter((m) => m !== model);
      } else if (prev.length < 3) {
        return [...prev, model];
      }
      return prev;
    });
  };

  const handleJudge = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          candidateModels: selectedCandidates,
          judgeModel,
          system: system || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          alert(`Insufficient credits. You need ${errorData.credits_needed || 6} credits for Judge mode.`);
        } else {
          alert(`Error: ${errorData.error || "Failed to run judge"}`);
        }
        return;
      }

      const data = await response.json();
      setResult(data);

      // Refresh credits display
      if ((window as any).refreshCredits) {
        (window as any).refreshCredits();
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Judge Mode
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Let an AI judge rank and critique multiple model responses
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            System Prompt (optional)
          </label>
          <textarea
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            placeholder="You are a helpful assistant..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            User Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Candidate Models (up to 3)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {availableModels.map((model) => (
              <label
                key={model.value}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedCandidates.includes(model.value)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCandidates.includes(model.value)}
                  onChange={() => toggleCandidate(model.value)}
                  disabled={!selectedCandidates.includes(model.value) && selectedCandidates.length >= 3}
                  className="mr-2"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {model.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Judge Model
          </label>
          <select
            value={judgeModel}
            onChange={(e) => setJudgeModel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {judgeModels.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleJudge}
          disabled={isLoading || !prompt.trim() || selectedCandidates.length === 0}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? "Judging..." : `Run Judge (6 credits)`}
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Judge Results
            </h2>
            <ShareButton mode="judge" results={result} />
          </div>

          {/* Ranking Display */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ranking
              </h3>
              <div className="space-y-3">
                {result.judge_result.ranking
                  .sort((a, b) => a.rank - b.rank)
                  .map((rank, idx) => {
                    const candidate = result.candidates.find(
                      (c) => c.model === rank.model
                    );
                    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";
                    return (
                      <div
                        key={rank.model}
                        className={`p-4 rounded-lg border-2 ${
                          idx === 0
                            ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                            : idx === 1
                            ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                            : idx === 2
                            ? "border-amber-600 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{medal}</span>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                Rank #{rank.rank}: {rank.model}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Score: {(rank.score * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          {candidate && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {candidate.time_ms}ms
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                          {rank.comment}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Judge Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Judge Summary
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {result.judge_result.summary}
              </p>
            </div>

            {/* Candidate Responses */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Candidate Responses
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {result.candidates.map((candidate, idx) => {
                  const ranking = result.judge_result.ranking.find(
                    (r) => r.model === candidate.model
                  );
                  return (
                    <div
                      key={idx}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {candidate.model}
                          </h4>
                          {ranking && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Rank #{ranking.rank} • Score: {(ranking.score * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {candidate.time_ms}ms
                        </div>
                      </div>
                      {candidate.error ? (
                        <div className="text-red-600 dark:text-red-400 text-sm">
                          Error: {candidate.error}
                        </div>
                      ) : (
                        <>
                          <div className="prose dark:prose-invert max-w-none mb-3">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {candidate.output}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                            Tokens: {candidate.usage.total_tokens} (in: {candidate.usage.prompt_tokens}, out: {candidate.usage.completion_tokens})
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
      )}
    </div>
  );
}
