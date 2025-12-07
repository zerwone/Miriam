"use client";

import { useState } from "react";
import type { ResearchResult } from "@/lib/types";
import { ShareButton } from "@/components/ShareButton";

export const dynamic = "force-dynamic";

export default function ResearchPage() {
  const [question, setQuestion] = useState("");
  const [selectedExperts, setSelectedExperts] = useState<string[]>([
    "qwen/qwen-2.5-7b-instruct:free",
    "deepseek/deepseek-chat:free",
  ]);
  const [synthesizerModel, setSynthesizerModel] = useState("deepseek/deepseek-chat:free");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedExpert, setExpandedExpert] = useState<string | null>(null);

  const availableModels = [
    { value: "qwen/qwen-2.5-7b-instruct:free", label: "Qwen 2.5 7B (Free)" },
    { value: "deepseek/deepseek-chat:free", label: "DeepSeek Chat (Free)" },
    { value: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B (Free)" },
    { value: "google/gemini-pro-1.5", label: "Gemini Pro 1.5" },
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  ];

  const synthesizerModels = [
    { value: "deepseek/deepseek-chat:free", label: "DeepSeek Chat (Free)" },
    { value: "qwen/qwen-2.5-7b-instruct:free", label: "Qwen 2.5 7B (Free)" },
    { value: "google/gemini-pro-1.5", label: "Gemini Pro 1.5" },
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  ];

  const toggleExpert = (model: string) => {
    setSelectedExperts((prev) => {
      if (prev.includes(model)) {
        return prev.filter((m) => m !== model);
      } else {
        return [...prev, model];
      }
    });
  };

  const handleResearch = async () => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);
    setExpandedExpert(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          expertModels: selectedExperts,
          synthesizerModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          alert(`Insufficient credits. You need ${errorData.credits_needed || 10} credits for Research Panel.`);
        } else {
          alert(`Error: ${errorData.error || "Failed to run research"}`);
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
          Research Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Multiple expert models analyze your question, then a synthesizer merges their insights
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Research Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your research question here..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expert Models (select 2-4)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {availableModels.map((model) => (
              <label
                key={model.value}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedExperts.includes(model.value)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedExperts.includes(model.value)}
                  onChange={() => toggleExpert(model.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {model.label}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Each expert will analyze from a different perspective (technical, creative, critical)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Synthesizer Model
          </label>
          <select
            value={synthesizerModel}
            onChange={(e) => setSynthesizerModel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {synthesizerModels.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            This model will merge all expert reports into a final synthesis
          </p>
        </div>

        <button
          onClick={handleResearch}
          disabled={isLoading || !question.trim() || selectedExperts.length < 2}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? "Researching..." : `Run Research Panel (10 credits)`}
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Synthesized Report */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-lg p-6 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Synthesized Report
                </h2>
              </div>
              <ShareButton mode="research" results={result} />
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {result.synthesized_report.content}
              </p>
            </div>

            {result.synthesized_report.follow_up_questions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Follow-up Questions
                </h3>
                <ul className="space-y-2">
                  {result.synthesized_report.follow_up_questions.map((q, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Expert Reports */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Expert Reports
            </h2>
            <div className="space-y-4">
              {result.expert_reports.map((expert, idx) => {
                const isExpanded = expandedExpert === expert.model;
                const expertRoles = [
                  "Technical Expert",
                  "Creative Strategist",
                  "Critical Analyst",
                ];
                const role = expertRoles[idx % expertRoles.length];

                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedExpert(isExpanded ? null : expert.model)
                      }
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                          {idx + 1}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {expert.model}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {role}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {expert.usage.total_tokens} tokens
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {expert.report || "No report available"}
                          </p>
                        </div>
                        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
                          Tokens: {expert.usage.total_tokens} (in: {expert.usage.prompt_tokens}, out: {expert.usage.completion_tokens})
                        </div>
                      </div>
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
