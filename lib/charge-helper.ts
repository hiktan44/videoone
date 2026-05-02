// Generation route'lari icin kredi dusurme + iade helper'i.

import { chargeCredits, estimateCost } from "./credits";
import { prisma } from "./db";
import { getCurrentUser } from "./auth";

export type ChargeContext = {
  userId: string | null;
  amount: number;
  refund: () => Promise<void>;
};

/**
 * Kullanici login ise kredi dusurur. Yetersizse exception (402'ye dönüştürmek caller'in sorumlulugu).
 * Doner: { userId, amount, refund } — fail durumunda refund() çağrılır.
 */
export async function chargeForGeneration(opts: {
  kind: "image" | "video" | "voice" | "music" | "captions";
  durationSec?: number;
  modelDisplayName?: string;
  resolution?: string;
}): Promise<ChargeContext> {
  const user = await getCurrentUser();
  if (!user) {
    return { userId: null, amount: 0, refund: async () => {} };
  }
  const tier = (user.plan as "fast" | "pro" | "max") || "pro";
  const amount = estimateCost(opts.kind, opts.durationSec || 5, tier, opts.resolution);
  await chargeCredits({
    userId: user.id,
    amount,
    reason: "generation_charge",
    metadata: { kind: opts.kind, model: opts.modelDisplayName },
  });
  return {
    userId: user.id,
    amount,
    refund: async () => {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { creditBalance: { increment: amount } },
        });
        await prisma.creditLedger.create({
          data: {
            userId: user.id,
            delta: amount,
            reason: "refund",
            metadata: { kind: opts.kind, model: opts.modelDisplayName },
          },
        });
      } catch {}
    },
  };
}
