/**
 * Stripe configuration and utilities
 */

import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// Export getter function instead of instance to avoid build-time evaluation
export const stripe = getStripe;

// Plan configurations
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    monthlyCredits: 0,
    stripePriceId: undefined,
    features: [
      "10 free daily credits",
      "Miriam chat",
      "Compare (up to 3 models)",
      "Limited history (10 sessions)",
    ],
  },
  starter: {
    name: "Starter",
    price: 7,
    monthlyCredits: 1000,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    features: [
      "10 free daily credits",
      "1,000 subscription credits/month",
      "All modes unlocked",
      "Medium history (200 sessions)",
      "Save prompt templates",
    ],
  },
  pro: {
    name: "Pro",
    price: 15,
    monthlyCredits: 3000,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      "10 free daily credits",
      "3,000 subscription credits/month",
      "All modes unlocked",
      "Deep history (1,000 sessions)",
      "Shareable links",
      "Team-ready (coming soon)",
    ],
  },
} as const;

// Top-up credit pack configurations
export const TOPUP_PACKS = {
  mini: {
    name: "Mini Pack",
    credits: 200,
    price: 4,
    stripePriceId: process.env.STRIPE_TOPUP_MINI_PRICE_ID,
  },
  standard: {
    name: "Standard Pack",
    credits: 1000,
    price: 12,
    stripePriceId: process.env.STRIPE_TOPUP_STANDARD_PRICE_ID,
  },
  power: {
    name: "Power Pack",
    credits: 5000,
    price: 40,
    stripePriceId: process.env.STRIPE_TOPUP_POWER_PRICE_ID,
  },
} as const;
