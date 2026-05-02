// BullMQ Worker — generation kuyruguna giren is'leri Kie.ai'ya gonderir,
// polling ile sonucu bekler, progress'i Redis pub/sub ile yayinlar,
// final sonucu Postgres GenerationJob'a yazar.
//
// Coolify'da AYRI bir resource olarak deploy edilir (Dockerfile.worker).

import { Worker } from "bullmq";
import { getRedisClient, getRedisConnectionOpts } from "../lib/redis";
import { prisma } from "../lib/db";
import { publishProgress, QUEUE_NAME, type GenerationJobPayload } from "../lib/queue";

const KIE_BASE = "https://api.kie.ai";

function parseSttSegments(result: unknown): Array<{ start: number; end: number; text: string }> {
  if (!result) return [];
  let parsed: any = result;
  if (typeof result === "string") {
    try { parsed = JSON.parse(result); } catch { return [{ start: 0, end: 0, text: result }]; }
  }
  if (Array.isArray(parsed?.segments)) {
    return parsed.segments.map((s: any) => ({
      start: Number(s.start || 0),
      end: Number(s.end || 0),
      text: String(s.text || "").trim(),
    }));
  }
  if (Array.isArray(parsed?.words)) {
    const groups: Array<{ start: number; end: number; text: string }> = [];
    let cur = { start: 0, end: 0, text: "" };
    for (const w of parsed.words) {
      const wStart = Number(w.start || 0);
      const wEnd = Number(w.end || 0);
      const wText = String(w.text || w.word || "");
      if (cur.text === "") cur.start = wStart;
      cur.text += (cur.text ? " " : "") + wText;
      cur.end = wEnd;
      if (cur.end - cur.start > 5) { groups.push(cur); cur = { start: 0, end: 0, text: "" }; }
    }
    if (cur.text) groups.push(cur);
    return groups;
  }
  if (typeof parsed?.text === "string") return [{ start: 0, end: 0, text: parsed.text }];
  return [];
}
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 240; // 20 dk

type CreateResult = {
  taskId: string;
  family: string;
};

/** Kie.ai endpoint'lerinden uygun olani secer ve task olusturur. */
async function createKieTask(p: GenerationJobPayload): Promise<CreateResult> {
  const headers = {
    Authorization: `Bearer ${process.env.KIE_API_KEY}`,
    "Content-Type": "application/json",
  };

  if (p.kind === "image") {
    const res = await fetch(`${KIE_BASE}/api/v1/jobs/createTask`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: p.model || "seedream/4.5-text-to-image",
        input: { prompt: p.prompt, aspect_ratio: p.aspectRatio || "16:9" },
      }),
    });
    if (!res.ok) throw new Error(`Kie image ${res.status}`);
    const data = await res.json();
    return { taskId: data?.data?.taskId || data?.taskId, family: "jobs" };
  }

  if (p.kind === "video") {
    // Veo3 ozel endpoint
    if ((p.model || "").toLowerCase().includes("veo")) {
      const res = await fetch(`${KIE_BASE}/api/v1/veo/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "veo3_fast",
          prompt: p.prompt,
          aspect_ratio: p.aspectRatio || "16:9",
          duration: p.duration || 5,
        }),
      });
      if (!res.ok) throw new Error(`Veo ${res.status}`);
      const data = await res.json();
      return { taskId: data?.data?.taskId || data?.taskId, family: "veo" };
    }
    // Generic jobs
    const res = await fetch(`${KIE_BASE}/api/v1/jobs/createTask`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: p.model || "kling-3.0",
        input: {
          prompt: p.prompt,
          aspect_ratio: p.aspectRatio || "16:9",
          duration: p.duration || 5,
        },
      }),
    });
    if (!res.ok) throw new Error(`Kie video ${res.status}`);
    const data = await res.json();
    return { taskId: data?.data?.taskId || data?.taskId, family: "jobs" };
  }

  if (p.kind === "voice") {
    const res = await fetch(`${KIE_BASE}/api/v1/jobs/createTask`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: p.model || "elevenlabs/text-to-speech-multilingual-v2",
        input: { text: p.prompt },
      }),
    });
    if (!res.ok) throw new Error(`Kie voice ${res.status}`);
    const data = await res.json();
    return { taskId: data?.data?.taskId || data?.taskId, family: "jobs" };
  }

  if (p.kind === "music") {
    const res = await fetch(`${KIE_BASE}/api/v1/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "V4_5PLUS",
        input: { prompt: p.prompt },
      }),
    });
    if (!res.ok) throw new Error(`Kie music ${res.status}`);
    const data = await res.json();
    return { taskId: data?.data?.taskId || data?.taskId, family: "suno" };
  }

  if (p.kind === "captions") {
    const res = await fetch(`${KIE_BASE}/api/v1/jobs/createTask`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "elevenlabs/speech-to-text",
        input: { audio: p.audioUrl, language: "tr" },
      }),
    });
    if (!res.ok) throw new Error(`Kie captions ${res.status}`);
    const data = await res.json();
    return { taskId: data?.data?.taskId || data?.taskId, family: "jobs" };
  }

  throw new Error(`Bilinmeyen kind: ${p.kind}`);
}

/** Task durumunu sorgular, succeeded/failed/running doner. */
async function pollKieTask(taskId: string, family: string) {
  const headers = { Authorization: `Bearer ${process.env.KIE_API_KEY}` };
  let url: string;
  if (family === "veo") {
    url = `${KIE_BASE}/api/v1/veo/recordInfo?taskId=${encodeURIComponent(taskId)}`;
  } else {
    url = `${KIE_BASE}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`;
  }
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) return { state: "running" as const };
  const data = await res.json();
  const state = data?.data?.state;
  const result = data?.data?.resultJson || data?.data?.result;
  let resultUrl: string | undefined;
  if (state === "success") {
    if (typeof result === "string") {
      try {
        const parsed = JSON.parse(result);
        resultUrl =
          parsed?.video_url ||
          parsed?.audio_url ||
          parsed?.image_url ||
          parsed?.url ||
          parsed?.output ||
          (Array.isArray(parsed?.images) ? parsed.images[0] : undefined) ||
          (Array.isArray(parsed?.videos) ? parsed.videos[0] : undefined);
      } catch {
        resultUrl = result;
      }
    } else if (result && typeof result === "object") {
      resultUrl =
        (result as any).video_url ||
        (result as any).audio_url ||
        (result as any).image_url ||
        (result as any).url ||
        (result as any).output;
    }
    return { state: "succeeded" as const, resultUrl };
  }
  if (state === "fail" || state === "failed") {
    return { state: "failed" as const, error: data?.data?.failMsg || "Kie failed" };
  }
  return { state: "running" as const };
}

const worker = new Worker<GenerationJobPayload>(
  QUEUE_NAME,
  async (job) => {
    const p = job.data;
    console.log(`[worker] job=${p.jobId} kind=${p.kind}`);

    await prisma.generationJob.update({
      where: { id: p.jobId },
      data: { status: "running", progress: 5 },
    });
    await publishProgress(p.jobId, { status: "running", progress: 5 });

    // 1. Kie.ai'ya gonder
    let task: CreateResult;
    try {
      task = await createKieTask(p);
    } catch (e) {
      const error = e instanceof Error ? e.message : "Kie create hata";
      await prisma.generationJob.update({
        where: { id: p.jobId },
        data: { status: "failed", error },
      });
      await publishProgress(p.jobId, { status: "failed", error });
      throw e;
    }

    await prisma.generationJob.update({
      where: { id: p.jobId },
      data: { taskId: task.taskId, family: task.family, progress: 15 },
    });
    await publishProgress(p.jobId, { status: "running", progress: 15, taskId: task.taskId });

    // 2. Polling
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const status = await pollKieTask(task.taskId, task.family);
      const progress = Math.min(95, 15 + Math.round((i / MAX_POLL_ATTEMPTS) * 80));
      if (status.state === "running") {
        await prisma.generationJob.update({ where: { id: p.jobId }, data: { progress } });
        await publishProgress(p.jobId, { status: "running", progress });
        continue;
      }
      if (status.state === "succeeded") {
        // Captions ise sonucu segmentlere parse edip metadata'ya yaz.
        let extraMeta: any = undefined;
        if (p.kind === "captions") {
          try {
            const cleanRes = await pollKieTask(task.taskId, task.family);
            // resultUrl asagida zaten ayristirildi; ham veriyi tekrar al:
            const headers = { Authorization: `Bearer ${process.env.KIE_API_KEY}` };
            const r = await fetch(
              `${KIE_BASE}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(task.taskId)}`,
              { headers, cache: "no-store" }
            );
            const d = await r.json().catch(() => ({}));
            const raw = d?.data?.resultJson || d?.data?.result;
            const segments = parseSttSegments(raw);
            extraMeta = { captions: segments };
            void cleanRes;
          } catch {}
        }
        await prisma.generationJob.update({
          where: { id: p.jobId },
          data: {
            status: "succeeded",
            progress: 100,
            resultUrl: status.resultUrl,
            ...(extraMeta ? { metadata: { ...(p as any).metadata, ...extraMeta } } : {}),
          },
        });
        await publishProgress(p.jobId, {
          status: "succeeded",
          progress: 100,
          resultUrl: status.resultUrl,
        });
        return { resultUrl: status.resultUrl };
      }
      if (status.state === "failed") {
        await prisma.generationJob.update({
          where: { id: p.jobId },
          data: { status: "failed", error: status.error },
        });
        await publishProgress(p.jobId, { status: "failed", error: status.error });
        throw new Error(status.error);
      }
    }

    const timeoutErr = "Polling zaman aşımı (20 dk)";
    await prisma.generationJob.update({
      where: { id: p.jobId },
      data: { status: "failed", error: timeoutErr },
    });
    await publishProgress(p.jobId, { status: "failed", error: timeoutErr });
    throw new Error(timeoutErr);
  },
  {
    connection: getRedisConnectionOpts(),
    concurrency: Number(process.env.WORKER_CONCURRENCY || 5),
  }
);

worker.on("completed", (job) => {
  console.log(`[worker] ✓ ${job.id}`);
});
worker.on("failed", (job, err) => {
  console.error(`[worker] ✗ ${job?.id} ${err?.message}`);
});
worker.on("error", (err) => {
  console.error(`[worker] error ${err?.message}`);
});

console.log("[worker] BullMQ worker started, listening to queue:", QUEUE_NAME);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[worker] SIGTERM received");
  await worker.close();
  await getRedisClient().quit();
  process.exit(0);
});
