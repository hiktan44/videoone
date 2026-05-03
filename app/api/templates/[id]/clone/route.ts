// POST /api/templates/[id]/clone -> public bir şablonu mevcut kullanıcının projesi olarak kopyalar
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const tpl = await prisma.project.findFirst({
    where: { id, isTemplate: true, isPublic: true },
    include: { clips: true, characters: true },
  });
  if (!tpl) return NextResponse.json({ error: "Şablon bulunamadı" }, { status: 404 });

  const settings = (tpl.settings as any) || {};
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: `${tpl.name} (kopya)`,
      gradient: tpl.gradient,
      isTemplate: false,
      isPublic: false,
      settings,
      thumbnailUrl: tpl.thumbnailUrl,
      clips: {
        create: tpl.clips.map((c) => ({
          trackId: c.trackId,
          label: c.label,
          startTime: c.startTime,
          duration: c.duration,
          sourceUrl: c.sourceUrl,
          gradient: c.gradient,
          text: c.text,
          transitionAfter: c.transitionAfter,
        })),
      },
    },
  });
  return NextResponse.json({ ok: true, projectId: project.id }, { status: 201 });
}
