import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chargeUser } from "@/lib/charge";
import type { Mode } from "@/lib/types";

export const runtime = "edge";

/**
 * Charge user credits for an action
 * Returns success/failure and updated balance
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { mode, modelCount = 1 } = body;

    if (!mode || !["miriam", "compare", "judge", "research"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode" },
        { status: 400 }
      );
    }

    const result = await chargeUser(user.id, mode as Mode, modelCount);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Insufficient credits",
          credits_needed: result.credits_needed,
          balance: result.balance,
        },
        { status: 402 } // 402 Payment Required
      );
    }

    return NextResponse.json({
      success: true,
      credits_deducted: result.credits_deducted,
      balance: result.balance,
    });
  } catch (error: any) {
    console.error("Charge API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
