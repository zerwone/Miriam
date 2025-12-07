"use client";

import { useState, useEffect } from "react";

export const dynamic = "force-dynamic";

interface AnalyticsData {
  period: number;
  summary: {
    totalCredits: number;
    totalTokensIn: number;
    totalTokensOut: number;
    activeUsers: number;
    totalActions: number;
  };
  modeUsage: Record<string, number>;
  topModels: Array<{ model: string; count: number }>;
  planDistribution: Record<string, number>;
  userCredits: Array<{ userId: string; credits: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/usage?period=${period}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Usage statistics and insights
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Credits</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.summary.totalCredits.toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Actions</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.summary.totalActions.toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Users</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.summary.activeUsers}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tokens In</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {(data.summary.totalTokensIn / 1000).toFixed(1)}K
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tokens Out</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {(data.summary.totalTokensOut / 1000).toFixed(1)}K
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mode Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Credits by Mode
          </h2>
          <div className="space-y-3">
            {Object.entries(data.modeUsage)
              .sort(([, a], [, b]) => b - a)
              .map(([mode, credits]) => (
                <div key={mode}>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700 dark:text-gray-300 capitalize">
                      {mode}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {credits.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(credits / data.summary.totalCredits) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top Models */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Top Models (by usage count)
          </h2>
          <div className="space-y-2">
            {data.topModels.map((item, idx) => (
              <div
                key={item.model}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    {idx + 1}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {item.model}
                  </span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Plan Distribution
          </h2>
          <div className="space-y-3">
            {Object.entries(data.planDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([plan, count]) => (
                <div key={plan} className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {plan}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {count} users
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Top Users (by credits used)
          </h2>
          <div className="space-y-2">
            {data.userCredits.slice(0, 10).map((item, idx) => (
              <div
                key={item.userId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold text-sm">
                    {idx + 1}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm font-mono">
                    {item.userId.substring(0, 8)}...
                  </span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {item.credits.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
