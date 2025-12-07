import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { WalletBalance } from "@/lib/wallet";

export const runtime = "edge";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from("user_wallet")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (walletError) {
      // Wallet doesn't exist, create it
      const { data: newWallet, error: createError } = await supabase
        .from("user_wallet")
        .insert({
          user_id: user.id,
          free_daily_credits_remaining: 10,
          subscription_plan: "free",
          subscription_credits_remaining: 0,
          topup_credits_remaining: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating wallet:", createError);
        return NextResponse.json(
          { error: "Failed to create wallet" },
          { status: 500 }
        );
      }

      const balance: WalletBalance = {
        free_daily_credits_remaining: newWallet.free_daily_credits_remaining,
        subscription_credits_remaining: newWallet.subscription_credits_remaining,
        topup_credits_remaining: newWallet.topup_credits_remaining,
        subscription_plan: newWallet.subscription_plan as "free" | "starter" | "pro",
        subscription_renews_at: newWallet.subscription_renews_at,
      };

      return NextResponse.json({ balance });
    }

    // Check if daily credits need reset
    const lastReset = new Date(wallet.last_daily_reset);
    const now = new Date();
    const daysSinceReset = Math.floor(
      (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceReset > 0) {
      // Reset daily credits
      const { data: updatedWallet, error: updateError } = await supabase
        .from("user_wallet")
        .update({
          free_daily_credits_remaining: 10,
          last_daily_reset: now.toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error resetting daily credits:", updateError);
      } else {
        wallet.free_daily_credits_remaining = updatedWallet.free_daily_credits_remaining;
        wallet.last_daily_reset = updatedWallet.last_daily_reset;
      }
    }

    const balance: WalletBalance = {
      free_daily_credits_remaining: wallet.free_daily_credits_remaining,
      subscription_credits_remaining: wallet.subscription_credits_remaining,
      topup_credits_remaining: wallet.topup_credits_remaining,
      subscription_plan: wallet.subscription_plan as "free" | "starter" | "pro",
      subscription_renews_at: wallet.subscription_renews_at,
    };

    return NextResponse.json({ balance });
  } catch (error: any) {
    console.error("Wallet API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
