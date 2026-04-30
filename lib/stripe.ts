// Stripe client + plan tanımları.
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY tanimli degil");
  _stripe = new Stripe(key, { apiVersion: "2024-11-20.acacia" as any });
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// Plan tanımları — Stripe dashboard'da Products oluşturduktan sonra Price ID'leri buraya gelir.
export type PlanId = "free" | "pro" | "max";

export const PLANS: Record<
  PlanId,
  { name: string; monthlyCredits: number; priceUsd: number; stripePriceId?: string }
> = {
  free: { name: "Free", monthlyCredits: 100, priceUsd: 0 },
  pro: {
    name: "Pro",
    monthlyCredits: 5000,
    priceUsd: 19,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  max: {
    name: "Max",
    monthlyCredits: 15000,
    priceUsd: 49,
    stripePriceId: process.env.STRIPE_PRICE_MAX,
  },
};

export function getPlanByPriceId(priceId: string | undefined | null): PlanId | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_MAX) return "max";
  return null;
}
