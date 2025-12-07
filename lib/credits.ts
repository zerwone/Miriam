/**
 * Credit checking utilities (read-only)
 * Used to check if user has enough credits before making LLM calls
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { calculateCreditsNeeded, hasEnoughCredits as checkEnoughCredits, type WalletBalance } from "@/lib/wallet";
import type { Mode } from "@/lib/types";

/**
 * Check if user has enough credits for an action (read-only check)
 * This does NOT deduct credits, only checks availability
 */
export async function hasEnoughCredits(
  userId: string,
  mode: Mode
): Promise<{ hasEnough: boolean; balance: WalletBalance | null; creditsNeeded: number }> {
  try {
    const creditsNeeded = calculateCreditsNeeded(mode);

    // Get current wallet balance using admin client
    const adminClient = createAdminClient();
    const { data: wallet, error: walletError } = await adminClient
      .from("user_wallet")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      return {
        hasEnough: false,
        balance: null,
        creditsNeeded,
      };
    }

    // Check if daily credits need reset (read-only check)
    const lastReset = new Date(wallet.last_daily_reset);
    const now = new Date();
    const daysSinceReset = Math.floor(
      (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Use reset value if needed, but don't write
    const freeDailyCredits = daysSinceReset > 0 ? 10 : wallet.free_daily_credits_remaining;

    const balance: WalletBalance = {
      free_daily_credits_remaining: freeDailyCredits,
      subscription_credits_remaining: wallet.subscription_credits_remaining,
      topup_credits_remaining: wallet.topup_credits_remaining,
      subscription_plan: wallet.subscription_plan as "free" | "starter" | "pro",
      subscription_renews_at: wallet.subscription_renews_at,
    };

    const hasEnough = checkEnoughCredits(balance, creditsNeeded);

    return {
      hasEnough,
      balance,
      creditsNeeded,
    };
  } catch (error: any) {
    console.error("hasEnoughCredits error:", error);
    return {
      hasEnough: false,
      balance: null,
      creditsNeeded: 0,
    };
  }
}
