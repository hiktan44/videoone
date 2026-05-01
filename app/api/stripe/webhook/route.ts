// POST /api/stripe/webhook
// Stripe events: customer.subscription.{created,updated,deleted}, invoice.paid

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, getPlanByPriceId, PLANS } from "@/lib/stripe";
import { earnCredits } from "@/lib/credits";
import { sendSubscriptionConfirmEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata.userId as string) || (await findUserIdByCustomer(sub.customer as string));
        if (!userId) break;
        const priceId = sub.items.data[0]?.price?.id;
        const planId = getPlanByPriceId(priceId) || "free";

        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: sub.id },
          create: {
            userId,
            stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId,
            plan: planId,
            status: sub.status,
            currentPeriodStart: new Date((sub as any).current_period_start * 1000),
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          update: {
            stripePriceId: priceId,
            plan: planId,
            status: sub.status,
            currentPeriodStart: new Date((sub as any).current_period_start * 1000),
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });

        // User'ın plan'ını güncelle
        await prisma.user.update({
          where: { id: userId },
          data: { plan: planId },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata.userId as string) || (await findUserIdByCustomer(sub.customer as string));
        if (!userId) break;
        await prisma.subscription.update({
          where: { stripeSubscriptionId: sub.id },
          data: { status: "canceled" },
        });
        await prisma.user.update({ where: { id: userId }, data: { plan: "free" } });
        break;
      }

      case "invoice.paid": {
        // Subscription başarıyla ödendi → aylık krediyi yatır
        const inv = event.data.object as Stripe.Invoice;
        const subId = (inv as any).subscription as string | null;
        if (!subId) break;
        const sub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subId },
        });
        if (!sub) break;
        const planMeta = PLANS[sub.plan as keyof typeof PLANS];
        if (!planMeta) break;
        await earnCredits({
          userId: sub.userId,
          amount: planMeta.monthlyCredits,
          reason: "subscription",
          refType: "Subscription",
          refId: sub.id,
          metadata: { invoiceId: inv.id },
        });

        // Confirm email
        const userRecord = await prisma.user.findUnique({ where: { id: sub.userId } });
        if (userRecord?.email) {
          void sendSubscriptionConfirmEmail(
            userRecord.email,
            planMeta.name,
            planMeta.monthlyCredits
          ).catch(() => {});
        }
        break;
      }
    }
  } catch (e) {
    console.error("[stripe webhook]", event.type, e);
    return NextResponse.json({ received: true, error: "handler error" });
  }

  return NextResponse.json({ received: true });
}

async function findUserIdByCustomer(customerId: string): Promise<string | null> {
  const sub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });
  return sub?.userId ?? null;
}
