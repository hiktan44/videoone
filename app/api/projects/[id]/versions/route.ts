// GET  /api/projects/[id]/versions       -> versiyon listesi
// POST /api/projects/[id]/versions       -> snapshot kaydet (body: { label?, snapshot })
// PUT  /api/projects/[id]/versions       -> versiyona geri dön (body: { versionId })
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const MAX_VERSIONS = 30; // proje başına en fazla 30 versiyon

async function ownsProject(userId: string, projectId: string) {
  const p = await prisma.project.findFirst({ where: { id: projectId, userId } });
  return !!p;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await ownsProject(user.id, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const versions = await prisma.projectVersion.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, createdAt: true, createdBy: true },
    take: MAX_VERSIONS,
  });
  return NextResponse.json({ versions });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await ownsProject(user.id, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const label = body.label ? String(body.label).slice(0, 120) : null;
  const snapshot = body.snapshot;
  if (!snapshot || typeof snapshot !== "object") {
    return NextResponse.json({ error: "snapshot gerekli" }, { status: 400 });
  }
  const v = await prisma.projectVersion.create({
    data: { projectId: id, label, snapshot, createdBy: user.id },
  });
  // Eski versiyonları temizle (tutar son MAX_VERSIONS)
  const all = await prisma.projectVersion.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (all.length > MAX_VERSIONS) {
    const toDelete = all.slice(MAX_VERSIONS).map((x) => x.id);
    await prisma.projectVersion.deleteMany({ where: { id: { in: toDelete } } });
  }
  return NextResponse.json({ version: v }, { status: 201 });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await ownsProject(user.id, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const versionId = String(body.versionId || "");
  if (!versionId) return NextResponse.json({ error: "versionId gerekli" }, { status: 400 });
  const v = await prisma.projectVersion.findFirst({ where: { id: versionId, projectId: id } });
  if (!v) return NextResponse.json({ error: "Versiyon bulunamadı" }, { status: 404 });
  return NextResponse.json({ snapshot: v.snapshot, label: v.label, createdAt: v.createdAt });
}
