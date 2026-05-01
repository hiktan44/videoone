// POST /api/projects/[id]/export
// Body: { resolution?: "720p"|"1080p", aspectRatio?: string }
// Doner: { jobId } — frontend SSE ile /api/jobs/[jobId]/stream dinler.
//
// Export job'i ayri export-worker'a gider, FFmpeg ile birlestirir, R2'ye yukler.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isRedisConfigured } from "@/lib/redis";
import { Queue } from "bullmq";
import { getRedisConnectionOpts } from "@/lib/redis";

export const runtime = "nodejs";

const EXPORT_QUEUE = "exports";

let _q: Queue | null = null;
function exportQueue() {
  if (!_q) _q = new Queue(EXPORT_QUEUE, { connection: getRedisConnectionOpts() });
  return _q;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isRedisConfigured()) {
    return NextResponse.json({ error: "REDIS_URL tanımlı değil" }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: {
      clips: { orderBy: [{ trackId: "asc" }, { startTime: "asc" }] },
    },
  });
  if (!project) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });

  const videoClips = project.clips
    .filter((c) => c.trackId === "video" && c.sourceUrl)
    .sort((a, b) => a.startTime - b.startTime);
  if (videoClips.length === 0) {
    return NextResponse.json(
      { error: "Export için en az 1 video klip gerekli (sourceUrl ile)" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const resolution = String(body.resolution || "1080p");
  const aspectRatio = String(body.aspectRatio || "16:9");

  // GenerationJob tablosunda export tipinde kayit
  const job = await prisma.generationJob.create({
    data: {
      userId: user.id,
      projectId: id,
      kind: "export",
      status: "queued",
      prompt: project.name,
      metadata: {
        resolution,
        aspectRatio,
        clips: videoClips.map((c) => ({
          id: c.id,
          sourceUrl: c.sourceUrl,
          duration: c.duration,
          startTime: c.startTime,
          text: c.text,
          transitionAfter: c.transitionAfter,
        })),
        subtitles: project.clips
          .filter((c) => c.trackId === "subtitle" && c.text)
          .map((c) => ({ start: c.startTime, end: c.startTime + c.duration, text: c.text })),
      },
    },
  });

  await exportQueue().add(
    "export",
    {
      jobId: job.id,
      userId: user.id,
      projectId: id,
      resolution,
      aspectRatio,
    },
    {
      jobId: job.id,
      removeOnComplete: { age: 24 * 3600 },
      removeOnFail: { age: 7 * 24 * 3600 },
      attempts: 1,
    }
  );

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
