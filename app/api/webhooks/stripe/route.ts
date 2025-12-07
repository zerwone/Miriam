import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, TOPUP_PACKS } from "@/lib/stripe";

export const runtime = "edge";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.body;
    if (!body) {
      return NextResponse.json(
        { error: "No body" },
        { status: 400 }
      );
    }

    // Get the signature from the request headers
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    // Parse the webhook event
    const stripe = getStripe();
    let event;
    try {
      // For edge runtime, we need to read the body as text first
      const text = await request.text();
      event = stripe.webhooks.constructEvent(text, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.client_reference_id || session.metadata?.userId;

        if (!userId) {
          console.error("No user ID in session");
          break;
        }

        // Handle subscription creation
        if (session.mode === "subscription") {
          const planId = session.metadata?.plan;
          if (planId && (planId === "starter" || planId === "pro")) {
            const plan = PLANS[planId as "starter" | "pro"];
            const subscriptionId = session.subscription as string;

            // Get subscription details
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

            // Update user wallet
            await adminClient.from("user_wallet").update({
              subscription_plan: planId,
              subscription_credits_remaining: plan.monthlyCredits,
              subscription_renews_at: currentPeriodEnd.toISOString(),
            }).eq("user_id", userId);

            // Log subscription event
            await adminClient.from("subscription_events").insert({
              user_id: userId,
              event_type: "start",
              plan: planId,
              credits_added: plan.monthlyCredits,
              metadata: {
                subscription_id: subscriptionId,
                session_id: session.id,
              },
            });
          }
        }

        // Handle one-time payment (top-up)
        if (session.mode === "payment") {
          const packType = session.metadata?.packType;
          const credits = parseInt(session.metadata?.credits || "0");

          if (packType && credits > 0) {
            // Get current wallet
            const { data: wallet } = await adminClient
              .from("user_wallet")
              .select("topup_credits_remaining")
              .eq("user_id", userId)
              .single();

            const currentTopup = wallet?.topup_credits_remaining || 0;

            // Add credits to wallet
            await adminClient.from("user_wallet").update({
              topup_credits_remaining: currentTopup + credits,
            }).eq("user_id", userId);

            // Log top-up purchase
            await adminClient.from("topup_purchases").insert({
              user_id: userId,
              pack_type: packType,
              credits_added: credits,
              amount_paid_cents: session.amount_total || 0,
              payment_provider: "stripe",
              payment_id: session.payment_intent,
            });
          }
        }

        break;
      }

      case "customer.subscription.updated":
      case "invoice.payment_succeeded": {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;

        if (subscription.status === "active" && userId) {
          // Find the plan from subscription items
          const priceId = subscription.items.data[0]?.price.id;
          let planId: "starter" | "pro" | null = null;

          if (priceId === PLANS.starter.stripePriceId) {
            planId = "starter";
          } else if (priceId === PLANS.pro.stripePriceId) {
            planId = "pro";
          }

          if (planId) {
            const plan = PLANS[planId];
            const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

            // Reset subscription credits on renewal
            await adminClient.from("user_wallet").update({
              subscription_plan: planId,
              subscription_credits_remaining: plan.monthlyCredits,
              subscription_renews_at: currentPeriodEnd.toISOString(),
            }).eq("user_id", userId);

            // Log renewal
            await adminClient.from("subscription_events").insert({
              user_id: userId,
              event_type: "renew",
              plan: planId,
              credits_added: plan.monthlyCredits,
              metadata: {
                subscription_id: subscription.id,
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;

        if (userId) {
          // Downgrade to free plan
          await adminClient.from("user_wallet").update({
            subscription_plan: "free",
            subscription_credits_remaining: 0,
            subscription_renews_at: null,
          }).eq("user_id", userId);

          // Log cancellation
          await adminClient.from("subscription_events").insert({
            user_id: userId,
            event_type: "cancel",
            plan: "free",
            metadata: {
              subscription_id: subscription.id,
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}
