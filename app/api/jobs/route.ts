// POST /api/jobs
// Body: { projectId?, kind: "video"|"image"|"voice"|"music"|"captions", prompt, model?, aspectRatio?, duration? }
// Doner: { jobId }
//
// Job DB'ye yazilir, BullMQ kuyruguna eklenir, worker tarafindan islenir.
// Frontend /api/jobs/[id]/stream ile SSE uzerinden ilerlemeyi dinler.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enqueue, type GenerationJobKind } from "@/lib/queue";
import { isRedisConfigured } from "@/lib/redis";

export const runtime = "nodejs";

const ALLOWED: GenerationJobKind[] = ["video", "image", "voice", "music", "captions"];

export async function POST(req: Request) {
  if (!isRedisConfigured()) {
    return NextResponse.json({ error: "REDIS_URL tanımlı değil — kuyruk devre dışı" }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const kind = String(body.kind || "") as GenerationJobKind;
  const prompt = String(body.prompt || "").trim();
  const projectId = body.projectId ? String(body.projectId) : undefined;

  if (!ALLOWED.includes(kind)) {
    return NextResponse.json({ error: "Geçersiz kind" }, { status: 400 });
  }
  if (!prompt && kind !== "captions") {
    return NextResponse.json({ error: "prompt gerekli" }, { status: 400 });
  }

  if (projectId) {
    const owns = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
    if (!owns) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
  }

  // 1. DB'ye job kaydı
  const dbJob = await prisma.generationJob.create({
    data: {
      userId: user.id,
      projectId,
      kind,
      status: "queued",
      prompt,
      metadata: {
        model: body.model,
        aspectRatio: body.aspectRatio,
        duration: body.duration,
        imageUrls: body.imageUrls || [],
        audioUrls: body.audioUrls || [],
        videoUrls: body.videoUrls || [],
        audioUrl: body.audioUrl,
      },
    },
  });

  // 2. BullMQ kuyruguna ekle
  await enqueue({
    jobId: dbJob.id,
    userId: user.id,
    projectId,
    kind,
    prompt,
    model: body.model,
    aspectRatio: body.aspectRatio,
    duration: body.duration,
    imageUrls: body.imageUrls,
    audioUrls: body.audioUrls,
    videoUrls: body.videoUrls,
    audioUrl: body.audioUrl,
  });

  return NextResponse.json({ jobId: dbJob.id }, { status: 202 });
}

// GET /api/jobs?projectId=... -> mevcut kullanicinin (veya proje icin) job'lari
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 20)));

  const jobs = await prisma.generationJob.findMany({
    where: {
      userId: user.id,
      ...(projectId ? { projectId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ jobs });
}
