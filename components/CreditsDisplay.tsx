"use client";

import { useEffect, useState } from "react";
import type { WalletBalance } from "@/lib/wallet";

interface CreditsDisplayProps {
  onUpdate?: () => void;
}

export function CreditsDisplay({ onUpdate }: CreditsDisplayProps) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/me/wallet");
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  // Expose refresh function via window for other components
  useEffect(() => {
    (window as any).refreshCredits = fetchBalance;
    return () => {
      delete (window as any).refreshCredits;
    };
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Credits: <span className="font-semibold">...</span>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Credits: <span className="font-semibold">--</span>
      </div>
    );
  }

  const total =
    balance.free_daily_credits_remaining +
    balance.subscription_credits_remaining +
    balance.topup_credits_remaining;

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Credits: <span className="font-semibold text-gray-900 dark:text-white">{total}</span>
        {balance.free_daily_credits_remaining > 0 && (
          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
            ({balance.free_daily_credits_remaining} free)
          </span>
        )}
      </div>
    </div>
  );
}
