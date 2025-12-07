/**
 * Wallet management utilities
 * Handles credit calculations, deductions, and balance checks
 */

import type { Mode } from "./types";

export interface WalletBalance {
  free_daily_credits_remaining: number;
  subscription_credits_remaining: number;
  topup_credits_remaining: number;
  subscription_plan: "free" | "starter" | "pro";
  subscription_renews_at: string | null;
}

/**
 * Calculate credits needed for a given mode and model count
 */
export function calculateCreditsNeeded(
  mode: Mode,
  modelCount: number = 1
): number {
  switch (mode) {
    case "miriam":
      return 1;
    case "compare":
      // 3 credits for up to 3 models, 5 credits for up to 5 models
      return modelCount <= 3 ? 3 : 5;
    case "judge":
      // 3 candidate models + 1 judge model
      return 6;
    case "research":
      // Multiple experts + synthesizer
      return 10;
    default:
      return 0;
  }
}

/**
 * Check if user has enough credits
 */
export function hasEnoughCredits(
  balance: WalletBalance,
  creditsNeeded: number
): boolean {
  const total =
    balance.free_daily_credits_remaining +
    balance.subscription_credits_remaining +
    balance.topup_credits_remaining;
  return total >= creditsNeeded;
}

/**
 * Determine which credits to deduct (in order: free daily -> subscription -> top-up)
 */
export function calculateDeduction(
  balance: WalletBalance,
  creditsNeeded: number
): {
  free_daily: number;
  subscription: number;
  topup: number;
} {
  let remaining = creditsNeeded;
  const deduction = {
    free_daily: 0,
    subscription: 0,
    topup: 0,
  };

  // Step 1: Deduct from free daily credits
  if (remaining > 0 && balance.free_daily_credits_remaining > 0) {
    deduction.free_daily = Math.min(
      remaining,
      balance.free_daily_credits_remaining
    );
    remaining -= deduction.free_daily;
  }

  // Step 2: Deduct from subscription credits
  if (remaining > 0 && balance.subscription_credits_remaining > 0) {
    deduction.subscription = Math.min(
      remaining,
      balance.subscription_credits_remaining
    );
    remaining -= deduction.subscription;
  }

  // Step 3: Deduct from top-up credits
  if (remaining > 0 && balance.topup_credits_remaining > 0) {
    deduction.topup = Math.min(remaining, balance.topup_credits_remaining);
    remaining -= deduction.topup;
  }

  return deduction;
}
