// Export Worker — FFmpeg ile timeline'i tek mp4'e concat eder, R2'ye yukler.
// Coolify'da AYRI bir resource olarak deploy edilir (Dockerfile.export-worker).

import { Worker } from "bullmq";
import { spawn } from "child_process";
import { mkdir, writeFile, readFile, unlink, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { getRedisConnectionOpts, getRedisClient } from "../lib/redis";
import { prisma } from "../lib/db";
import { publishProgress } from "../lib/queue";
import { uploadObject, isConfigured as isR2Configured, buildKey, publicUrlFor } from "../lib/r2";

const QUEUE = "exports";

type ClipSpec = {
  id: string;
  sourceUrl: string;
  duration: number;
  startTime: number;
  text?: string;
  transitionAfter?: string;
};
type SubtitleSpec = { start: number; end: number; text: string };

type ExportJob = {
  jobId: string;
  userId: string;
  projectId: string;
  resolution: "720p" | "1080p" | "4K";
  aspectRatio: string;
};

function aspectToWH(resolution: string, ratio: string): { w: number; h: number } {
  const heightMap: Record<string, number> = { "720p": 720, "1080p": 1080, "4K": 2160 };
  const h = heightMap[resolution] || 1080;
  if (ratio === "1:1") return { w: h, h };
  if (ratio === "9:16") return { w: Math.round((h * 9) / 16), h };
  if (ratio === "4:3") return { w: Math.round((h * 4) / 3), h };
  // 16:9
  return { w: Math.round((h * 16) / 9), h };
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download fail ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-1500)}`));
    });
    proc.on("error", reject);
  });
}

function srtFromSubs(subs: SubtitleSpec[]): string {
  return subs
    .map((s, i) => {
      const ts = (sec: number) => {
        const ms = Math.floor((sec - Math.floor(sec)) * 1000);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const ss = Math.floor(sec % 60);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
      };
      return `${i + 1}\n${ts(s.start)} --> ${ts(s.end)}\n${s.text}\n`;
    })
    .join("\n");
}

const worker = new Worker<ExportJob>(
  QUEUE,
  async (job) => {
    const { jobId, projectId, userId, resolution, aspectRatio } = job.data;
    console.log(`[export] start jobId=${jobId}`);

    const dbJob = await prisma.generationJob.findUnique({ where: { id: jobId } });
    if (!dbJob) throw new Error("DB job bulunamadi");

    const meta = (dbJob.metadata as any) || {};
    const clips: ClipSpec[] = meta.clips || [];
    const subs: SubtitleSpec[] = meta.subtitles || [];
    const { w, h } = aspectToWH(resolution, aspectRatio);

    const updateProgress = async (progress: number, status: "running" | "succeeded" | "failed" = "running") => {
      await prisma.generationJob.update({ where: { id: jobId }, data: { progress, status } });
      await publishProgress(jobId, { status, progress });
    };

    await updateProgress(2);

    // 1. Geçici dizin
    const work = path.join(tmpdir(), `export-${jobId}`);
    await mkdir(work, { recursive: true });

    try {
      // 2. Tüm klipleri indir + her birini hedef boyut/codec'e standardize et
      const segmentPaths: string[] = [];
      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];
        const src = path.join(work, `src${i}.mp4`);
        const norm = path.join(work, `norm${i}.mp4`);
        await downloadFile(c.sourceUrl, src);
        // Standardize: scale + pad to WxH, set codec H264, AAC audio
        await runFfmpeg([
          "-y",
          "-i",
          src,
          "-t",
          String(c.duration),
          "-vf",
          `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`,
          "-c:v",
          "libx264",
          "-preset",
          "fast",
          "-crf",
          "23",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-ar",
          "44100",
          "-r",
          "30",
          "-shortest",
          norm,
        ]);
        segmentPaths.push(norm);
        const pct = 5 + Math.round(((i + 1) / clips.length) * 60);
        await updateProgress(pct);
      }

      // 3. Concat list dosyası
      const listPath = path.join(work, "list.txt");
      const listContent = segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
      await writeFile(listPath, listContent);

      // 4. SRT (varsa)
      let srtPath: string | null = null;
      if (subs.length > 0) {
        srtPath = path.join(work, "subs.srt");
        await writeFile(srtPath, srtFromSubs(subs));
      }

      // 5. Concat — varsa subtitle filtresi de uygula
      const outPath = path.join(work, "output.mp4");
      const concatArgs = [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listPath,
      ];
      if (srtPath) {
        // re-encode + burn subtitles
        concatArgs.push(
          "-vf",
          `subtitles=${srtPath}:force_style='Fontsize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=2,Shadow=0'`,
          "-c:v",
          "libx264",
          "-preset",
          "fast",
          "-crf",
          "21",
          "-c:a",
          "aac",
          outPath
        );
      } else {
        concatArgs.push("-c", "copy", outPath);
      }
      await runFfmpeg(concatArgs);
      await updateProgress(75);

      // 6. R2'ye yükle
      if (!isR2Configured()) {
        throw new Error("R2 yapılandırılmamış (R2_* env vars eksik)");
      }
      const buf = await readFile(outPath);
      const key = buildKey(userId, "exports", "mp4");
      await uploadObject(key, buf, "video/mp4");
      const url = publicUrlFor(key);
      await updateProgress(95);

      // 7. DB ve MediaAsset
      await prisma.mediaAsset.create({
        data: {
          userId,
          projectId,
          kind: "video",
          title: `${dbJob.prompt} — Export`,
          url: url || "",
          storageKey: key,
          sizeBytes: buf.length,
        },
      });
      await prisma.generationJob.update({
        where: { id: jobId },
        data: { status: "succeeded", progress: 100, resultUrl: url },
      });
      await publishProgress(jobId, { status: "succeeded", progress: 100, resultUrl: url || undefined });

      console.log(`[export] ✓ ${jobId} → ${url}`);
      return { resultUrl: url };
    } catch (e) {
      const error = e instanceof Error ? e.message : "Export hata";
      console.error(`[export] ✗ ${jobId}: ${error}`);
      await prisma.generationJob.update({
        where: { id: jobId },
        data: { status: "failed", error },
      });
      await publishProgress(jobId, { status: "failed", error });
      throw e;
    } finally {
      // Cleanup
      try {
        await rm(work, { recursive: true, force: true });
      } catch {}
    }
  },
  {
    connection: getRedisConnectionOpts(),
    concurrency: Number(process.env.EXPORT_CONCURRENCY || 1), // FFmpeg agir, dusuk concurrency
  }
);

worker.on("completed", (job) => console.log(`[export] ✓ ${job.id}`));
worker.on("failed", (job, err) => console.error(`[export] ✗ ${job?.id} ${err?.message}`));

console.log("[export-worker] started, queue:", QUEUE);

process.on("SIGTERM", async () => {
  console.log("[export-worker] SIGTERM");
  await worker.close();
  await getRedisClient().quit();
  process.exit(0);
});
