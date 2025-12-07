import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
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

    // Check if user is admin (for now, allow all authenticated users)
    // In production, add proper admin role check

    const adminClient = createAdminClient();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days

    // Get usage statistics
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(period));

    // Mode usage statistics
    const { data: modeStats } = await adminClient
      .from("usage_log")
      .select("mode, credits_spent")
      .gte("created_at", cutoffDate.toISOString());

    const modeUsage = modeStats?.reduce((acc: any, log: any) => {
      acc[log.mode] = (acc[log.mode] || 0) + log.credits_spent;
      return acc;
    }, {}) || {};

    // Model usage statistics
    const { data: allLogs } = await adminClient
      .from("usage_log")
      .select("model_ids_used, credits_spent")
      .gte("created_at", cutoffDate.toISOString());

    const modelUsage: Record<string, number> = {};
    allLogs?.forEach((log: any) => {
      if (log.model_ids_used && Array.isArray(log.model_ids_used)) {
        log.model_ids_used.forEach((model: string) => {
          modelUsage[model] = (modelUsage[model] || 0) + 1;
        });
      }
    });

    // Top models by usage count
    const topModels = Object.entries(modelUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([model, count]) => ({ model, count }));

    // Total credits spent
    const totalCredits = allLogs?.reduce((sum: number, log: any) => sum + (log.credits_spent || 0), 0) || 0;

    // Total tokens
    const totalTokensIn = allLogs?.reduce((sum: number, log: any) => sum + (log.tokens_in || 0), 0) || 0;
    const totalTokensOut = allLogs?.reduce((sum: number, log: any) => sum + (log.tokens_out || 0), 0) || 0;

    // User statistics
    const { data: userStats } = await adminClient
      .from("usage_log")
      .select("user_id, credits_spent")
      .gte("created_at", cutoffDate.toISOString());

    const userCredits: Record<string, number> = {};
    userStats?.forEach((log: any) => {
      userCredits[log.user_id] = (userCredits[log.user_id] || 0) + (log.credits_spent || 0);
    });

    const activeUsers = Object.keys(userCredits).length;

    // Plan distribution
    const { data: wallets } = await adminClient
      .from("user_wallet")
      .select("subscription_plan");

    const planDistribution = wallets?.reduce((acc: any, wallet: any) => {
      acc[wallet.subscription_plan] = (acc[wallet.subscription_plan] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      period: parseInt(period),
      summary: {
        totalCredits,
        totalTokensIn,
        totalTokensOut,
        activeUsers,
        totalActions: allLogs?.length || 0,
      },
      modeUsage,
      topModels,
      planDistribution,
      userCredits: Object.entries(userCredits)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 20)
        .map(([userId, credits]) => ({ userId, credits })),
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
