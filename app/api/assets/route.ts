// GET /api/assets?projectId=...&kind=...
// Mevcut kullanicinin R2'ye/DB'ye kaydedilmis tum medya assetleri.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") || undefined;
  const kind = url.searchParams.get("kind") || undefined;
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 100)));

  const assets = await prisma.mediaAsset.findMany({
    where: {
      userId: user.id,
      ...(projectId ? { projectId } : {}),
      ...(kind ? { kind } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ assets });
}
