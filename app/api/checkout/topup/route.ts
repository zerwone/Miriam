import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, TOPUP_PACKS } from "@/lib/stripe";

export const runtime = "edge";

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
    const { packId } = body;

    if (!packId || !["mini", "standard", "power"].includes(packId)) {
      return NextResponse.json(
        { error: "Invalid pack ID" },
        { status: 400 }
      );
    }

    const pack = TOPUP_PACKS[packId as keyof typeof TOPUP_PACKS];
    if (!pack.stripePriceId) {
      return NextResponse.json(
        { error: "Pack not configured" },
        { status: 500 }
      );
    }

    // Create Stripe checkout session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: pack.stripePriceId,
          quantity: 1,
        },
      ],
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        packType: packId,
        credits: pack.credits.toString(),
      },
      success_url: `${request.nextUrl.origin}/app/account?success=true`,
      cancel_url: `${request.nextUrl.origin}/app/account?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Top-up checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
