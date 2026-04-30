// POST /api/stripe/checkout
// Body: { plan: "pro"|"max" }
// Doner: { url } — kullanici Stripe Checkout sayfasina yonlendirilir.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured, PLANS, type PlanId } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY tanımlı değil" }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const planId = String(body.plan || "") as PlanId;
  if (planId !== "pro" && planId !== "max") {
    return NextResponse.json({ error: "Geçersiz plan" }, { status: 400 });
  }
  const plan = PLANS[planId];
  if (!plan.stripePriceId) {
    return NextResponse.json(
      { error: `STRIPE_PRICE_${planId.toUpperCase()} tanımlı değil` },
      { status: 503 }
    );
  }

  // Mevcut Stripe customer'ı bul/oluştur
  const existingSub = await prisma.subscription.findFirst({ where: { userId: user.id } });
  let customerId = existingSub?.stripeCustomerId || undefined;
  const stripe = getStripe();

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
  }

  // Çıkış URL'leri
  const origin = req.headers.get("origin") || new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancel`,
    metadata: { userId: user.id, plan: planId },
    subscription_data: { metadata: { userId: user.id, plan: planId } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
