// POST /api/clerk/webhook
// Clerk Dashboard → Webhooks → user.created/user.deleted/user.updated → bu URL.
// CLERK_WEBHOOK_SECRET ile Svix imzasi dogrulanir.
// user.created'da DB'ye user yaratir + signup_bonus + welcome email.
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { earnCredits } from "@/lib/credits";

export const runtime = "nodejs";

const SIGNUP_BONUS = Number(process.env.SIGNUP_BONUS_CREDITS || 50);

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET yok" }, { status: 503 });

  const svixId = req.headers.get("svix-id") || "";
  const svixTs = req.headers.get("svix-timestamp") || "";
  const svixSig = req.headers.get("svix-signature") || "";
  if (!svixId || !svixTs || !svixSig) {
    return NextResponse.json({ error: "Eksik svix header" }, { status: 400 });
  }
  const body = await req.text();
  let evt: any;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTs,
      "svix-signature": svixSig,
    });
  } catch (e) {
    return NextResponse.json({ error: "İmza doğrulanamadı" }, { status: 401 });
  }

  const type = evt?.type as string;
  const data = evt?.data;

  if (type === "user.created") {
    const clerkId = data?.id;
    const email = data?.email_addresses?.[0]?.email_address || null;
    const name =
      [data?.first_name, data?.last_name].filter(Boolean).join(" ") ||
      data?.username ||
      null;

    if (clerkId) {
      // DB'de user yarat (idempotent)
      const user = await prisma.user.upsert({
        where: { clerkId },
        create: { clerkId, email, name, creditBalance: 0 },
        update: { email, name },
      });
      // Signup bonusu
      try {
        if (SIGNUP_BONUS > 0) {
          const existing = await prisma.creditLedger.findFirst({
            where: { userId: user.id, reason: "signup_bonus" },
          });
          if (!existing) {
            await earnCredits({
              userId: user.id,
              amount: SIGNUP_BONUS,
              reason: "signup_bonus",
            });
          }
        }
      } catch (e) {
        console.error("[clerk webhook] bonus error:", e);
      }
      // Welcome email
      if (email) {
        try { await sendWelcomeEmail(email, name); }
        catch (e) { console.error("[clerk webhook] email error:", e); }
      }
    }
  }

  if (type === "user.updated") {
    const clerkId = data?.id;
    const email = data?.email_addresses?.[0]?.email_address || null;
    const name =
      [data?.first_name, data?.last_name].filter(Boolean).join(" ") ||
      data?.username ||
      null;
    if (clerkId) {
      await prisma.user.updateMany({ where: { clerkId }, data: { email, name } });
    }
  }

  return NextResponse.json({ ok: true });
}
