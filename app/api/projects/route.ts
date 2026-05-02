// GET /api/projects -> mevcut kullanicinin tum projelerini listeler
// POST /api/projects -> yeni proje olusturur

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { clips: true } },
      },
    });
    return NextResponse.json({ projects });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sunucu hatası";
    console.error("[/api/projects GET]", msg, e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "İsimsiz Vibe").slice(0, 120);
    const gradient = String(body.gradient || "from-purple-500 via-pink-500 to-orange-400");
    const incomingSettings = body.settings || {};

    // Brand kit defaultlarini settings'e uygula (kullanici override etmediyse).
    const u = await prisma.user.findUnique({
      where: { id: user.id },
      select: { brandKit: true },
    });
    const kit = (u?.brandKit as Record<string, unknown>) || {};
    const settings = {
      aspectRatio: kit.defaultAspect ?? "16:9",
      videoResolution: kit.defaultResolution ?? "720p",
      globalStyle: kit.globalStyle ?? "",
      globalStyleEnabled: !!kit.globalStyle,
      ...(kit.voicePreference ? { voiceModel: kit.voicePreference } : {}),
      brandKit: kit,
      ...incomingSettings, // kullanicinin verdikleri en son uygulanir
    };

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name,
        gradient,
        settings,
      },
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sunucu hatası";
    console.error("[/api/projects POST]", msg, e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
