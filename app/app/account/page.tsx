"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { WalletBalance } from "@/lib/wallet";
import { PLANS, TOPUP_PACKS } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [topupLoading, setTopupLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/me/wallet");
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (packId: "mini" | "standard" | "power") => {
    setTopupLoading(packId);
    try {
      const response = await fetch("/api/checkout/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      setTopupLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Failed to load account information</p>
      </div>
    );
  }

  const totalCredits =
    balance.free_daily_credits_remaining +
    balance.subscription_credits_remaining +
    balance.topup_credits_remaining;

  const currentPlan = PLANS[balance.subscription_plan];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Account & Billing
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your subscription and credit balance
        </p>
      </div>

      {/* Credit Balance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Credit Balance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Credits</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalCredits}
            </div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Free Daily</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {balance.free_daily_credits_remaining}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Resets daily
            </div>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subscription</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {balance.subscription_credits_remaining}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {currentPlan.name} plan
            </div>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Top-Up</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {balance.topup_credits_remaining}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Never expires
            </div>
          </div>
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Current Plan
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {currentPlan.name}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {currentPlan.price === 0 ? (
                "Free forever"
              ) : (
                <>
                  ${currentPlan.price}/month
                  {balance.subscription_renews_at && (
                    <span className="ml-2">
                      • Renews {new Date(balance.subscription_renews_at).toLocaleDateString()}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          {balance.subscription_plan !== "free" && (
            <Link
              href="/pricing"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Change Plan
            </Link>
          )}
          {balance.subscription_plan === "free" && (
            <Link
              href="/pricing"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* Top-Up Credits */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Buy More Credits
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Top-up credits never expire and can be used alongside your subscription credits
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(TOPUP_PACKS).map(([packId, pack]) => (
            <div
              key={packId}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="font-semibold text-gray-900 dark:text-white mb-2">
                {pack.name}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {pack.credits} credits
              </div>
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
                ${pack.price}
              </div>
              <button
                onClick={() => handleTopUp(packId as "mini" | "standard" | "power")}
                disabled={topupLoading === packId}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {topupLoading === packId ? "Loading..." : "Purchase"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
          How Credits Work
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Credits are deducted in order: Free Daily → Subscription → Top-Up</li>
          <li>• Free daily credits reset at midnight UTC</li>
          <li>• Subscription credits reset monthly on your renewal date</li>
          <li>• Top-up credits never expire</li>
        </ul>
      </div>
    </div>
  );
}
