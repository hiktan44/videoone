// GET /api/cron/credit-reset
// Coolify/Vercel cron tarafindan gunluk cagrilir.
// currentPeriodEnd geride kalmis aktif aboneliklere planlarinin aylik kredisini yatirir.
// Authorization: Bearer ${CRON_SECRET} bekler.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { earnCredits } from "@/lib/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAN_CREDITS: Record<string, number> = {
  free: 50,
  fast: 500,
  pro: 2000,
  max: 8000,
};

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dueSubs = await prisma.subscription.findMany({
    where: {
      status: "active",
      currentPeriodEnd: { lte: now },
    },
  });

  let granted = 0;
  let skipped = 0;
  for (const sub of dueSubs) {
    const credits = PLAN_CREDITS[sub.plan] ?? 0;
    if (credits <= 0) { skipped++; continue; }
    // Bu donem icin daha once yatirildi mi? (idempotency)
    const refId = `${sub.id}-${now.toISOString().slice(0, 7)}`;
    const existing = await prisma.creditLedger.findFirst({
      where: { userId: sub.userId, reason: "subscription_refresh", refId },
    });
    if (existing) { skipped++; continue; }
    await earnCredits({
      userId: sub.userId,
      amount: credits,
      reason: "subscription_refresh",
      refType: "Subscription",
      refId,
      metadata: { plan: sub.plan, periodEnd: sub.currentPeriodEnd },
    });
    // Period'u +1 ay ileri al
    const next = new Date(sub.currentPeriodEnd || now);
    next.setMonth(next.getMonth() + 1);
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { currentPeriodStart: now, currentPeriodEnd: next },
    });
    granted++;
  }

  return NextResponse.json({ ok: true, granted, skipped, totalChecked: dueSubs.length });
}
