/**
 * Credit charging utilities
 * Shared logic for charging users credits
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateCreditsNeeded,
  hasEnoughCredits,
  calculateDeduction,
  type WalletBalance,
} from "@/lib/wallet";
import type { Mode } from "@/lib/types";

export interface ChargeResult {
  success: boolean;
  error?: string;
  credits_deducted?: number;
  balance?: WalletBalance;
  credits_needed?: number;
}

/**
 * Charge user credits for an action
 * Returns success/failure and updated balance
 */
export async function chargeUser(
  userId: string,
  mode: Mode,
  modelCount: number = 1
): Promise<ChargeResult> {
  try {
    const creditsNeeded = calculateCreditsNeeded(mode, modelCount);

    // Get current wallet balance using admin client
    const adminClient = createAdminClient();
    const { data: wallet, error: walletError } = await adminClient
      .from("user_wallet")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      return {
        success: false,
        error: "Wallet not found",
      };
    }

    // Check if daily credits need reset
    const lastReset = new Date(wallet.last_daily_reset);
    const now = new Date();
    const daysSinceReset = Math.floor(
      (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceReset > 0) {
      // Reset daily credits first
      await adminClient
        .from("user_wallet")
        .update({
          free_daily_credits_remaining: 10,
          last_daily_reset: now.toISOString(),
        })
        .eq("user_id", userId);

      wallet.free_daily_credits_remaining = 10;
      wallet.last_daily_reset = now.toISOString();
    }

    const balance: WalletBalance = {
      free_daily_credits_remaining: wallet.free_daily_credits_remaining,
      subscription_credits_remaining: wallet.subscription_credits_remaining,
      topup_credits_remaining: wallet.topup_credits_remaining,
      subscription_plan: wallet.subscription_plan as "free" | "starter" | "pro",
      subscription_renews_at: wallet.subscription_renews_at,
    };

    // Check if user has enough credits
    if (!hasEnoughCredits(balance, creditsNeeded)) {
      return {
        success: false,
        error: "Insufficient credits",
        credits_needed: creditsNeeded,
        balance,
      };
    }

    // Calculate deduction
    const deduction = calculateDeduction(balance, creditsNeeded);

    // Deduct credits
    const { data: updatedWallet, error: updateError } = await adminClient
      .from("user_wallet")
      .update({
        free_daily_credits_remaining:
          wallet.free_daily_credits_remaining - deduction.free_daily,
        subscription_credits_remaining:
          wallet.subscription_credits_remaining - deduction.subscription,
        topup_credits_remaining:
          wallet.topup_credits_remaining - deduction.topup,
        updated_at: now.toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error deducting credits:", updateError);
      return {
        success: false,
        error: "Failed to deduct credits",
      };
    }

    const updatedBalance: WalletBalance = {
      free_daily_credits_remaining: updatedWallet.free_daily_credits_remaining,
      subscription_credits_remaining: updatedWallet.subscription_credits_remaining,
      topup_credits_remaining: updatedWallet.topup_credits_remaining,
      subscription_plan: updatedWallet.subscription_plan as "free" | "starter" | "pro",
      subscription_renews_at: updatedWallet.subscription_renews_at,
    };

    return {
      success: true,
      credits_deducted: creditsNeeded,
      balance: updatedBalance,
    };
  } catch (error: any) {
    console.error("Charge error:", error);
    return {
      success: false,
      error: error.message || "Internal server error",
    };
  }
}
