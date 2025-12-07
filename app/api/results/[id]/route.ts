import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminClient = createAdminClient();
    const resultId = params.id;

    // Get shared result from database
    const { data: result, error } = await adminClient
      .from("shared_results")
      .select("*")
      .eq("id", resultId)
      .eq("is_public", true)
      .single();

    if (error || !result) {
      return NextResponse.json(
        { error: "Result not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: result.id,
      mode: result.mode,
      data: result.result_data,
      created_at: result.created_at,
      title: result.title,
    });
  } catch (error: any) {
    console.error("Get result error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
