import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

/**
 * Daily reset cron job endpoint
 * Resets free_daily_credits_remaining to 10 for all users
 * 
 * This endpoint should be called by:
 * - Vercel Cron (configure in vercel.json)
 * - Or external cron service
 * 
 * Security: Should be protected with a secret token
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (if using Vercel Cron, this is automatically verified)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();

    // Reset daily credits for all users where last_daily_reset < today
    const { data, error } = await adminClient.rpc("reset_daily_credits");

    if (error) {
      console.error("Error resetting daily credits:", error);
      return NextResponse.json(
        { error: error.message || "Failed to reset daily credits" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Daily credits reset completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Daily reset cron error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
