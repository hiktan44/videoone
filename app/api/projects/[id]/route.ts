// GET    /api/projects/[id] -> tek proje + tum iliskili veriler (clips, characters, chatMessages)
// PUT    /api/projects/[id] -> proje guncelle (name, settings, clips/characters/messages full replace)
// DELETE /api/projects/[id] -> proje sil

import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

async function getOwnedProject(userId: string, projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
  });
}

export async function GET(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: {
      clips: { orderBy: [{ trackId: "asc" }, { startTime: "asc" }] },
      characters: { orderBy: { createdAt: "asc" } },
      chatMessages: { orderBy: { createdAt: "asc" } },
      mediaItems: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PUT(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const owned = await getOwnedProject(user.id, id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { name, gradient, settings, clips, characters, chatMessages, isPublic, thumbnailUrl } = body;

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const proj = await tx.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).slice(0, 120) }),
        ...(gradient !== undefined && { gradient }),
        ...(settings !== undefined && { settings }),
        ...(isPublic !== undefined && { isPublic: !!isPublic }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      },
    });

    // clips/characters/messages tam degisim yapildiginda: sil + ekle
    if (Array.isArray(clips)) {
      await tx.clip.deleteMany({ where: { projectId: id } });
      if (clips.length > 0) {
        await tx.clip.createMany({
          data: clips.map((c: any, i: number) => ({
            projectId: id,
            trackId: String(c.trackId || "video"),
            label: String(c.label || "Klip"),
            startTime: Number(c.startTime ?? 0),
            duration: Number(c.duration ?? 3),
            sourceUrl: c.sourceUrl ?? null,
            thumbnailUrl: c.thumbnailUrl ?? null,
            text: c.text ?? null,
            gradient: c.gradient ?? null,
            transitionAfter: c.transitionAfter ?? null,
            effects: c.effects ?? [],
            characterId: c.characterId ?? null,
            orderIndex: i,
          })),
        });
      }
    }

    if (Array.isArray(characters)) {
      await tx.character.deleteMany({ where: { projectId: id } });
      if (characters.length > 0) {
        await tx.character.createMany({
          data: characters.map((c: any) => ({
            projectId: id,
            name: String(c.name || "Karakter"),
            description: String(c.description || ""),
            voiceModel: String(c.voiceModel || "InWorld 1.5 Max"),
            avatarUrl: c.avatarUrl ?? null,
            visualPrompt: c.visualPrompt ?? null,
            initials: c.initials ?? null,
            color: c.color ?? null,
          })),
        });
      }
    }

    if (Array.isArray(chatMessages)) {
      await tx.chatMessage.deleteMany({ where: { projectId: id } });
      if (chatMessages.length > 0) {
        await tx.chatMessage.createMany({
          data: chatMessages.map((m: any) => ({
            projectId: id,
            role: String(m.role || "user"),
            content: String(m.content || ""),
            meta: m.meta ?? null,
            toolName: m.toolName ?? null,
            toolArgs: m.toolArgs ?? null,
          })),
        });
      }
    }

    return proj;
  });

  return NextResponse.json({ project: updated });
}

export async function DELETE(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const owned = await getOwnedProject(user.id, id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
