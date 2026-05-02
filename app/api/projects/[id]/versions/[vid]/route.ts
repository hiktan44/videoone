// GET /api/projects/[id]/versions/[vid] -> tek versiyonun snapshot'ı (karşılaştırma için)
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; vid: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, vid } = await params;
  const owns = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const v = await prisma.projectVersion.findFirst({ where: { id: vid, projectId: id } });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ version: v });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; vid: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, vid } = await params;
  const owns = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!owns) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.projectVersion.deleteMany({ where: { id: vid, projectId: id } });
  return NextResponse.json({ ok: true });
}
