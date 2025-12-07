import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

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
    const { mode, title, resultData } = body;

    if (!mode || !["compare", "judge", "research"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode" },
        { status: 400 }
      );
    }

    if (!resultData) {
      return NextResponse.json(
        { error: "Result data is required" },
        { status: 400 }
      );
    }

    // Save shared result
    const adminClient = createAdminClient();
    const { data: sharedResult, error } = await adminClient
      .from("shared_results")
      .insert({
        user_id: user.id,
        mode,
        title: title || `${mode} result`,
        result_data: resultData,
        is_public: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating shared result:", error);
      return NextResponse.json(
        { error: "Failed to create shared result" },
        { status: 500 }
      );
    }

    const shareUrl = `${request.nextUrl.origin}/results/${sharedResult.id}`;

    return NextResponse.json({
      id: sharedResult.id,
      url: shareUrl,
    });
  } catch (error: any) {
    console.error("Share API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
