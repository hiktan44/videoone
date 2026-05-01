// POST /api/projects/[id]/publish
// Body: { isPublic: boolean }
// Yayinlanan projeyi /u/[slug] uzerinden herkes goruntuleyebilir.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const isPublic = !!body.isPublic;

  // Channel yoksa olustur (kullaniciya kanal slug'i lazim)
  let channel = await prisma.channel.findUnique({ where: { userId: user.id } });
  if (!channel && isPublic) {
    const baseSlug = (user.name || user.email.split("@")[0])
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || `user-${user.id.slice(0, 6)}`;
    let slug = baseSlug;
    let suffix = 0;
    // unique slug
    while (await prisma.channel.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
    channel = await prisma.channel.create({
      data: { userId: user.id, slug, bio: null },
    });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: { isPublic },
  });

  return NextResponse.json({
    project: { id: updated.id, isPublic: updated.isPublic },
    channel: channel ? { slug: channel.slug } : null,
    publicUrl: channel?.slug ? `/u/${channel.slug}/${id}` : null,
  });
}
