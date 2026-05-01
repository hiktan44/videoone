// POST /api/referral
// Body: { code: string }  (ref kullanicinin referralCode'u)
//
// Yeni kullanici (cookie veya manuel) referans kodunu submit eder.
// 1. Kod geçerliyse Referral kaydi olusturulur (status: pending)
// 2. Hem yeni kullaniciya hem refere veren kullaniciya 200 kredi yatirilir.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { earnCredits } from "@/lib/credits";
import { sendReferralRewardEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REFERRER_REWARD = 200;
const REFEREE_REWARD = 100;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim();
    if (!code) return NextResponse.json({ error: "Kod boş" }, { status: 400 });

    // Kendi kodunu vermesin
    if (code === user.referralCode) {
      return NextResponse.json({ error: "Kendi kodun" }, { status: 400 });
    }

    // Referans veren kullanici var mi?
    const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!referrer) return NextResponse.json({ error: "Geçersiz kod" }, { status: 404 });

    // Bu kullanici daha önce referans ile gelmis mi?
    const existing = await prisma.referral.findUnique({ where: { refereeUserId: user.id } });
    if (existing) {
      return NextResponse.json({ error: "Zaten kullanıldı" }, { status: 400 });
    }

    // Referral kaydi + iki taraf da kredi al
    const referral = await prisma.referral.create({
      data: {
        referrerUserId: referrer.id,
        refereeUserId: user.id,
        status: "rewarded",
        creditAwarded: REFERRER_REWARD,
        rewardedAt: new Date(),
      },
    });

    await earnCredits({
      userId: referrer.id,
      amount: REFERRER_REWARD,
      reason: "referral",
      refType: "Referral",
      refId: referral.id,
    });
    await earnCredits({
      userId: user.id,
      amount: REFEREE_REWARD,
      reason: "referee_reward",
      refType: "Referral",
      refId: referral.id,
    });

    // Referans veren kullaniciya bildirim emaili
    if (referrer.email) {
      void sendReferralRewardEmail(referrer.email, user.email, REFERRER_REWARD).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      referrerCredited: REFERRER_REWARD,
      youCredited: REFEREE_REWARD,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sunucu hatası" },
      { status: 500 }
    );
  }
}
