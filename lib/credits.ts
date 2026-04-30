// Kredi yönetimi — atomik DB transaction, ledger entry'si oluşturur, User.creditBalance günceller.

import { prisma } from "./db";

export type CreditReason =
  | "signup_bonus"
  | "subscription"
  | "subscription_refresh"
  | "topup"
  | "referral"
  | "referee_reward"
  | "satisfaction"
  | "generation_charge"
  | "refund"
  | "admin_adjust";

export type ChargeOptions = {
  userId: string;
  amount: number; // pozitif sayı — düşürülecek miktar
  reason: CreditReason;
  refType?: string;
  refId?: string;
  metadata?: Record<string, unknown>;
};

export type EarnOptions = ChargeOptions; // amount yine pozitif — eklenecek miktar

/**
 * Krediyi düşür (atomik). Bakiye yetersizse hata fırlatır.
 * Hem User.creditBalance günceller hem de CreditLedger entry'si oluşturur.
 */
export async function chargeCredits(opts: ChargeOptions): Promise<{ newBalance: number }> {
  if (opts.amount <= 0) throw new Error("amount pozitif olmalı");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: opts.userId } });
    if (!user) throw new Error("User bulunamadı");
    if (user.creditBalance < opts.amount) {
      throw new Error("Yetersiz kredi");
    }
    const updated = await tx.user.update({
      where: { id: opts.userId },
      data: { creditBalance: { decrement: opts.amount } },
    });
    await tx.creditLedger.create({
      data: {
        userId: opts.userId,
        delta: -opts.amount,
        reason: opts.reason,
        refType: opts.refType,
        refId: opts.refId,
        metadata: (opts.metadata as any) || {},
      },
    });
    return { newBalance: updated.creditBalance };
  });
}

/** Krediye ekle (signup bonus, subscription, refund, vb.) */
export async function earnCredits(opts: EarnOptions): Promise<{ newBalance: number }> {
  if (opts.amount <= 0) throw new Error("amount pozitif olmalı");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: opts.userId },
      data: { creditBalance: { increment: opts.amount } },
    });
    await tx.creditLedger.create({
      data: {
        userId: opts.userId,
        delta: opts.amount,
        reason: opts.reason,
        refType: opts.refType,
        refId: opts.refId,
        metadata: (opts.metadata as any) || {},
      },
    });
    return { newBalance: updated.creditBalance };
  });
}

/** İade — başarısız job'ın kredisini geri yatırır. */
export async function refundCredits(
  userId: string,
  amount: number,
  jobId: string
): Promise<{ newBalance: number }> {
  return earnCredits({
    userId,
    amount,
    reason: "refund",
    refType: "GenerationJob",
    refId: jobId,
  });
}

/**
 * Üretim tipi + süre + plan tier'a göre maliyet hesabı.
 * PRD'de:
 *  Fast: ~18 kredi/dk
 *  Pro:  ~190 kredi/dk
 *  Max:  ~600 kredi/dk
 */
export function estimateCost(
  kind: "video" | "image" | "voice" | "music" | "captions",
  durationSec: number = 5,
  tier: "fast" | "pro" | "max" = "pro"
): number {
  const perMinute: Record<string, Record<string, number>> = {
    video: { fast: 18, pro: 190, max: 600 },
    image: { fast: 5, pro: 15, max: 40 },
    voice: { fast: 8, pro: 25, max: 60 },
    music: { fast: 30, pro: 80, max: 200 },
    captions: { fast: 5, pro: 5, max: 5 },
  };
  const rate = perMinute[kind]?.[tier] ?? 50;
  const minutes = Math.max(0.1, durationSec / 60);
  return Math.ceil(rate * minutes);
}
