import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS } from "@/lib/planLimits";
import type { Plan } from "@/lib/planLimits";

export const runtime = "edge";

export async function GET(request: NextRequest) {
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

    // Get user's plan
    const adminClient = createAdminClient();
    const { data: wallet } = await adminClient
      .from("user_wallet")
      .select("subscription_plan")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    const plan = wallet.subscription_plan as Plan;
    const limits = PLAN_LIMITS[plan];

    // Get sessions with plan-based limit
    const { data: sessions, error } = await adminClient
      .from("user_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limits.maxHistorySessions);

    if (error) {
      console.error("Error fetching sessions:", error);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessions: sessions || [],
      limit: limits.maxHistorySessions,
      plan,
    });
  } catch (error: any) {
    console.error("Sessions API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { mode, title, metadata } = body;

    if (!mode || !["miriam", "compare", "judge", "research"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode" },
        { status: 400 }
      );
    }

    // Get user's plan to enforce limits
    const adminClient = createAdminClient();
    const { data: wallet } = await adminClient
      .from("user_wallet")
      .select("subscription_plan")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    const plan = wallet.subscription_plan as Plan;
    const limits = PLAN_LIMITS[plan];

    // Check current session count
    const { count } = await adminClient
      .from("user_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // If at limit, delete oldest session
    if (count && count >= limits.maxHistorySessions) {
      const { data: oldestSession } = await adminClient
        .from("user_sessions")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (oldestSession) {
        await adminClient
          .from("user_sessions")
          .delete()
          .eq("id", oldestSession.id);
      }
    }

    // Create new session
    const { data: session, error } = await adminClient
      .from("user_sessions")
      .insert({
        user_id: user.id,
        mode,
        title: title || `${mode} session`,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error: any) {
    console.error("Sessions API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
