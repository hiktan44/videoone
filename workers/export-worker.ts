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
  effects?: string[];
};

// Clip.effects[] -> ffmpeg -vf filter chain parcalari
function effectsToFilters(effects: string[] = []): string[] {
  const f: string[] = [];
  for (const e of effects) {
    switch (e) {
      case "color-grade-warm":
        f.push("eq=saturation=1.2:gamma=1.05,colorbalance=rs=0.15:gs=0.05:bs=-0.1");
        break;
      case "color-grade-cool":
        f.push("eq=saturation=1.1,colorbalance=rs=-0.1:bs=0.15");
        break;
      case "vignette":
        f.push("vignette=PI/4");
        break;
      case "film-grain":
        f.push("noise=alls=12:allf=t");
        break;
      case "shake":
        // hafif sarsinti — crop+random translate yerine basit zoompan
        f.push("crop=in_w-10:in_h-10");
        break;
      case "zoom-in":
        f.push("zoompan=z='min(zoom+0.0015,1.1)':d=1:s=hd1080");
        break;
    }
  }
  return f;
}

// transition adi -> xfade filter type
function transitionToXfade(t?: string): string | null {
  if (!t) return null;
  const map: Record<string, string> = {
    "fade-to-black": "fadeblack",
    "smooth-fade": "fade",
    "dissolve": "dissolve",
    "zoom-blur": "zoomin",
    "slide-left": "slideleft",
    "slide-right": "slideright",
  };
  return map[t] ?? "fade";
}

const XFADE_DURATION = 0.5;
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
    let clips: ClipSpec[] = meta.clips || [];
    const subs: SubtitleSpec[] = meta.subtitles || [];
    const { w, h } = aspectToWH(resolution, aspectRatio);

    // Brand kit (intro/outro) — kullanıcı brandKit'inden al ve clip listesine ekle.
    let brandKit: any = meta.brandKit;
    if (!brandKit) {
      try {
        const owner = await prisma.user.findUnique({ where: { id: userId }, select: { brandKit: true } });
        brandKit = owner?.brandKit || {};
      } catch { brandKit = {}; }
    }
    if (brandKit?.intro) {
      clips = [{ id: "intro", sourceUrl: brandKit.intro, duration: 5, startTime: 0 } as ClipSpec, ...clips];
    }
    if (brandKit?.outro) {
      clips = [...clips, { id: "outro", sourceUrl: brandKit.outro, duration: 5, startTime: 0 } as ClipSpec];
    }

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
        // Standardize: scale + pad to WxH, efektler, codec H264, AAC audio
        const baseVf = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`;
        const effectFilters = effectsToFilters(c.effects);
        const vfChain = [baseVf, ...effectFilters].join(",");
        const isImage = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(c.sourceUrl);
        // Watermark: brand kit'te logo varsa ve aktifse - ek input olarak ekle
        const hasWatermark = brandKit?.watermark && brandKit?.logoUrl && c.id !== "intro" && c.id !== "outro";
        let logoLocal: string | null = null;
        if (hasWatermark) {
          try {
            logoLocal = path.join(work, `logo${i}.png`);
            await downloadFile(brandKit.logoUrl, logoLocal);
          } catch { logoLocal = null; }
        }
        const baseInputs = isImage
          ? ["-loop", "1", "-i", src, "-f", "lavfi", "-t", String(c.duration), "-i", "anullsrc=cl=stereo:r=44100"]
          : ["-i", src, "-t", String(c.duration)];
        const inputArgs = logoLocal ? [...baseInputs, "-i", logoLocal] : baseInputs;
        // Watermark icin filter_complex (logo overlay)
        const wmIdx = isImage ? 2 : 1; // logo input index
        const posMap: Record<string, string> = { tl: "10:10", tr: "W-w-10:10", bl: "10:H-h-10", br: "W-w-10:H-h-10" };
        const wmPos = posMap[brandKit?.watermarkPosition || "br"];
        const filterArgs = logoLocal
          ? ["-filter_complex", `[0:v]${vfChain}[bg];[${wmIdx}:v]scale=iw*0.15:-1[wm];[bg][wm]overlay=${wmPos}[v]`, "-map", "[v]", "-map", isImage ? "1:a" : "0:a?"]
          : ["-vf", vfChain];
        await runFfmpeg([
          "-y",
          ...inputArgs,
          ...filterArgs,
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

      // 3. SRT (varsa)
      let srtPath: string | null = null;
      if (subs.length > 0) {
        srtPath = path.join(work, "subs.srt");
        await writeFile(srtPath, srtFromSubs(subs));
      }

      // 4. Birlestirme: transitionAfter olan klipler arasinda xfade,
      // yoksa basit concat demuxer.
      const outPath = path.join(work, "output.mp4");
      const hasTransitions = clips.some((c, i) => i < clips.length - 1 && transitionToXfade(c.transitionAfter));

      if (hasTransitions && segmentPaths.length > 1) {
        // filter_complex ile xfade zinciri
        const inputArgs: string[] = [];
        for (const p of segmentPaths) {
          inputArgs.push("-i", p);
        }
        const fcParts: string[] = [];
        let prevV = "0:v";
        let prevA = "0:a";
        let cumOffset = 0;
        for (let i = 1; i < segmentPaths.length; i++) {
          const prevClip = clips[i - 1];
          const xf = transitionToXfade(prevClip.transitionAfter);
          const prevDur = prevClip.duration;
          // offset = onceki klip bitis - xfade suresi
          cumOffset += prevDur - (xf ? XFADE_DURATION : 0);
          const vOut = `v${i}`;
          const aOut = `a${i}`;
          if (xf) {
            fcParts.push(
              `[${prevV}][${i}:v]xfade=transition=${xf}:duration=${XFADE_DURATION}:offset=${cumOffset.toFixed(3)}[${vOut}]`
            );
            fcParts.push(
              `[${prevA}][${i}:a]acrossfade=d=${XFADE_DURATION}[${aOut}]`
            );
          } else {
            // gecisi yok — concat
            fcParts.push(`[${prevV}][${prevA}][${i}:v][${i}:a]concat=n=2:v=1:a=1[${vOut}][${aOut}]`);
          }
          prevV = vOut;
          prevA = aOut;
        }
        let finalV = prevV;
        if (srtPath) {
          fcParts.push(
            `[${prevV}]subtitles=${srtPath}:force_style='Fontsize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=2,Shadow=0'[vsub]`
          );
          finalV = "vsub";
        }
        await runFfmpeg([
          "-y",
          ...inputArgs,
          "-filter_complex",
          fcParts.join(";"),
          "-map",
          `[${finalV}]`,
          "-map",
          `[${prevA}]`,
          "-c:v",
          "libx264",
          "-preset",
          "fast",
          "-crf",
          "21",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          outPath,
        ]);
      } else {
        // Basit concat
        const listPath = path.join(work, "list.txt");
        const listContent = segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
        await writeFile(listPath, listContent);
        const concatArgs = ["-y", "-f", "concat", "-safe", "0", "-i", listPath];
        if (srtPath) {
          concatArgs.push(
            "-vf",
            `subtitles=${srtPath}:force_style='Fontsize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=2,Shadow=0'`,
            "-c:v", "libx264", "-preset", "fast", "-crf", "21",
            "-c:a", "aac",
            outPath
          );
        } else {
          concatArgs.push("-c", "copy", outPath);
        }
        await runFfmpeg(concatArgs);
      }
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
