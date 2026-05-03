// GET /api/templates/public -> public şablonlar (admin tarafından promote edilmiş projeler)
// Her kullanıcı görebilir; auth gerekmez (login optional).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const templates = await prisma.project.findMany({
    where: { isTemplate: true, isPublic: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      gradient: true,
      templateCategory: true,
      thumbnailUrl: true,
      settings: true,
      createdAt: true,
      _count: { select: { clips: true } },
    },
    take: 60,
  });
  return NextResponse.json({ templates });
}

// POST /api/templates/public/[id]/clone -> bu route'u ayrı dosyada handle ediyoruz
