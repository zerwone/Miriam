"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { CompareResult, JudgeResult, ResearchResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function SharedResultPage() {
  const params = useParams();
  const resultId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const response = await fetch(`/api/results/${resultId}`);
      if (!response.ok) {
        throw new Error("Result not found");
      }
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to load result");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Result Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{error || "This result may have been deleted or is private."}</p>
        </div>
      </div>
    );
  }

  const renderCompareResult = (data: CompareResult[]) => {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Compare Results
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                {item.model}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {item.output}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderJudgeResult = (data: JudgeResult) => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Judge Results
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ranking
          </h3>
          <div className="space-y-3">
            {data.judge_result.ranking
              .sort((a, b) => a.rank - b.rank)
              .map((rank, idx) => (
                <div
                  key={rank.model}
                  className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700"
                >
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Rank #{rank.rank}: {rank.model}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Score: {(rank.score * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {rank.comment}
                  </p>
                </div>
              ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Summary
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {data.judge_result.summary}
          </p>
        </div>
      </div>
    );
  };

  const renderResearchResult = (data: ResearchResult) => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Research Results
        </h2>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-lg p-6 border-2 border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Synthesized Report
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {data.synthesized_report.content}
          </p>
          {data.synthesized_report.follow_up_questions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Follow-up Questions
              </h4>
              <ul className="space-y-2">
                {data.synthesized_report.follow_up_questions.map((q, idx) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-300">
                    • {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {result.title || `${result.mode} Result`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Shared {new Date(result.created_at).toLocaleDateString()}
          </p>
        </div>

        {result.mode === "compare" && renderCompareResult(result.data)}
        {result.mode === "judge" && renderJudgeResult(result.data)}
        {result.mode === "research" && renderResearchResult(result.data)}
      </div>
    </div>
  );
}
