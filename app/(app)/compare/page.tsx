"use client";

import { useState, useEffect } from "react";
import type { CompareResult } from "@/lib/types";
import { ShareButton } from "@/components/ShareButton";
import { TemplateSelector } from "@/components/TemplateSelector";
import type { Template } from "@/lib/templates";

export const dynamic = "force-dynamic";

export default function ComparePage() {
  const [prompt, setPrompt] = useState("");
  const [system, setSystem] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "qwen/qwen-2.5-7b-instruct:free",
  ]);
  const [results, setResults] = useState<CompareResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const availableModels = [
    { value: "qwen/qwen-2.5-7b-instruct:free", label: "Qwen 2.5 7B (Free)" },
    { value: "deepseek/deepseek-chat:free", label: "DeepSeek Chat (Free)" },
    { value: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B (Free)" },
    { value: "google/gemini-pro-1.5", label: "Gemini Pro 1.5" },
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  ];

  const [userPlan, setUserPlan] = useState<"free" | "starter" | "pro" | null>(null);

  useEffect(() => {
    // Fetch user plan to enforce frontend limits
    fetch("/api/me/wallet")
      .then((res) => res.json())
      .then((data) => {
        if (data.balance) {
          setUserPlan(data.balance.subscription_plan);
        }
      })
      .catch(console.error);
  }, []);

  const maxModels = userPlan === "free" ? 3 : 5;

  const toggleModel = (model: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(model)) {
        return prev.filter((m) => m !== model);
      } else if (prev.length < maxModels) {
        return [...prev, model];
      }
      return prev;
    });
  };

  const handleCompare = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setResults([]);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          models: selectedModels,
          system: system || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          // Insufficient credits
          alert(`Insufficient credits. You need ${errorData.credits_needed || 3} credit(s) to compare ${selectedModels.length} model(s).`);
        } else {
          alert(`Error: ${errorData.error || "Failed to compare models"}`);
        }
        return;
      }

      const data = await response.json();
      setResults(data.results);
      
      // Refresh credits display
      if ((window as any).refreshCredits) {
        (window as any).refreshCredits();
      }
      
      // Store result for sharing
      (window as any).lastCompareResult = data.results;
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
          Compare Models
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test the same prompt across multiple models side-by-side
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div className="flex justify-end">
          <TemplateSelector
            mode="compare"
            onSelect={(template: Template) => {
              setPrompt(template.prompt);
              if (template.system) setSystem(template.system);
              if (template.defaultModels) setSelectedModels(template.defaultModels);
            }}
          />
        </div>
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
            Select Models (up to {maxModels})
            {userPlan === "free" && (
              <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                (Free plan limited to 3 models)
              </span>
            )}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {availableModels.map((model) => (
              <label
                key={model.value}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedModels.includes(model.value)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model.value)}
                  onChange={() => toggleModel(model.value)}
                  disabled={!selectedModels.includes(model.value) && selectedModels.length >= maxModels}
                  className="mr-2"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {model.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={isLoading || !prompt.trim() || selectedModels.length === 0}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? "Comparing..." : `Compare (${selectedModels.length} model${selectedModels.length !== 1 ? "s" : ""})`}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Results
            </h2>
            <ShareButton mode="compare" results={results} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {result.model}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {result.time_ms}ms
                  </div>
                </div>
                {result.error ? (
                  <div className="text-red-600 dark:text-red-400 text-sm">
                    Error: {result.error}
                  </div>
                ) : (
                  <>
                    <div className="prose dark:prose-invert max-w-none mb-3">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {result.output}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                      Tokens: {result.usage.total_tokens} (in: {result.usage.prompt_tokens}, out: {result.usage.completion_tokens})
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
