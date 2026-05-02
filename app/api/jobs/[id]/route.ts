// GET /api/jobs/[id] -> tek job (metadata dahil)
// POST /api/jobs/[id]/retry -> failed job'i tekrar kuyruga koy
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enqueue } from "@/lib/queue";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const job = await prisma.generationJob.findFirst({ where: { id, userId: user.id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job });
}

// Retry: yeni jobId olusturur (bullmq idempotency icin) ve eskiyle iliski metadata.retryOf'a yazar.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const old = await prisma.generationJob.findFirst({ where: { id, userId: user.id } });
  if (!old) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (old.status !== "failed") {
    return NextResponse.json({ error: "Sadece başarısız job'lar tekrar denenebilir" }, { status: 400 });
  }
  const oldMeta = (old.metadata as any) || {};
  const dbJob = await prisma.generationJob.create({
    data: {
      userId: user.id,
      projectId: old.projectId,
      kind: old.kind,
      status: "queued",
      prompt: old.prompt,
      metadata: { ...oldMeta, retryOf: old.id },
    },
  });
  await enqueue({
    jobId: dbJob.id,
    userId: user.id,
    projectId: old.projectId || undefined,
    kind: old.kind as any,
    prompt: old.prompt,
    model: oldMeta.model,
    aspectRatio: oldMeta.aspectRatio,
    duration: oldMeta.duration,
    imageUrls: oldMeta.imageUrls,
    audioUrls: oldMeta.audioUrls,
    videoUrls: oldMeta.videoUrls,
    audioUrl: oldMeta.audioUrl,
  });
  return NextResponse.json({ jobId: dbJob.id }, { status: 202 });
}
