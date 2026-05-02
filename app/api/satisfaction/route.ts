// POST /api/satisfaction
// Body: { jobId?: string, rating: 1|2|3|4|5, comment?: string }
// Yuksek rating (4-5) icin +10 kredi (her job icin 1 kez).
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { earnCredits } from "@/lib/credits";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const rating = Number(body.rating);
  const jobId = body.jobId ? String(body.jobId) : undefined;
  const comment = body.comment ? String(body.comment).slice(0, 500) : undefined;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating 1-5 olmalı" }, { status: 400 });
  }

  // Daha once bu job icin yatirim olduysa tekrar verme
  let granted = 0;
  if (rating >= 4) {
    const existing = jobId
      ? await prisma.creditLedger.findFirst({
          where: { userId: user.id, reason: "satisfaction", refId: jobId },
        })
      : null;
    if (!existing) {
      await earnCredits({
        userId: user.id,
        amount: 10,
        reason: "satisfaction",
        refType: jobId ? "GenerationJob" : undefined,
        refId: jobId,
        metadata: { rating, comment },
      });
      granted = 10;
    }
  }
  return NextResponse.json({ ok: true, granted });
}
