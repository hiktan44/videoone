import { NextResponse } from "next/server";
import { getTaskStatus } from "@/lib/kie";
import { getCurrentUser } from "@/lib/auth";
import { isConfigured as isR2Configured, copyFromUrl, buildKey } from "@/lib/r2";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Hangi taskId'ler kopyalandi — same-process tekrari engelle
const mirroredTasks = new Set<string>();

async function mirrorToR2InBackground(opts: {
  taskId: string;
  resultUrl: string;
  userId: string;
  family?: string;
}) {
  if (mirroredTasks.has(opts.taskId)) return;
  mirroredTasks.add(opts.taskId);
  try {
    // Dosya uzantisi tahmini
    const lower = opts.resultUrl.toLowerCase();
    let ext = "mp4";
    let kind: "video" | "image" | "audio" = "video";
    if (lower.match(/\.(jpg|jpeg|png|webp)/)) {
      ext = lower.match(/\.(jpg|jpeg|png|webp)/)![1];
      kind = "image";
    } else if (lower.match(/\.(mp3|wav|m4a|ogg)/)) {
      ext = lower.match(/\.(mp3|wav|m4a|ogg)/)![1];
      kind = "audio";
    } else if (lower.match(/\.(mp4|mov|webm)/)) {
      ext = lower.match(/\.(mp4|mov|webm)/)![1];
      kind = "video";
    }
    const key = buildKey(opts.userId, kind, ext);
    const result = await copyFromUrl(opts.resultUrl, key);
    if (result.url) {
      await prisma.mediaAsset.create({
        data: {
          userId: opts.userId,
          kind,
          title: `Kie ${opts.family || ""} ${opts.taskId.slice(0, 8)}`,
          url: result.url,
          storageKey: key,
          sizeBytes: result.sizeBytes,
        },
      });
    }
  } catch (e) {
    console.warn("[kie/poll] R2 mirror fail:", e instanceof Error ? e.message : e);
    mirroredTasks.delete(opts.taskId); // sonra tekrar denenebilir
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = (searchParams.get("taskId") ?? "").trim();
  const family = (searchParams.get("family") ?? "").trim() || undefined;

  if (!taskId) {
    return NextResponse.json({ error: "taskId parametresi gerekli." }, { status: 400 });
  }

  const task = await getTaskStatus(taskId, family);

  // R2 mirror — succeeded olunca async kopyala (response'u beklemez)
  if (task.status === "succeeded" && task.resultUrl && isR2Configured()) {
    const user = await getCurrentUser();
    if (user) {
      void mirrorToR2InBackground({
        taskId,
        resultUrl: task.resultUrl,
        userId: user.id,
        family: task.family || family,
      });
    }
  }

  return NextResponse.json(task, {
    headers: { "Cache-Control": "no-store" },
  });
}
