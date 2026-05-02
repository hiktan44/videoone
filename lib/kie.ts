// Kie.ai entegrasyonu - GERCEK ENDPOINT'LER (Faz 2 hotfix).
// Belgeleme: https://docs.kie.ai
// Endpoint cesitleri:
//   - POST  /api/v1/jobs/createTask        (birlesik, body: { model, input })
//   - GET   /api/v1/jobs/recordInfo        (birlesik durum sorgu, query: taskId)
//   - POST  /api/v1/veo/generate           (Veo 3.1 ozel)
//   - GET   /api/v1/veo/record-info        (Veo durum sorgu)
//   - POST  /api/v1/gpt4o-image/generate   (GPT 4o/Image 2 ozel)
//   - GET   /api/v1/gpt4o-image/record-info(GPT image durum sorgu)
// Tum endpoint'ler Authorization: Bearer <KIE_API_KEY> bekler.

import { getMapping } from "./models";

const KIE_BASE = "https://api.kie.ai";

export type KieStatus = "pending" | "running" | "succeeded" | "failed";

export type KieTask = {
  taskId: string;
  status: KieStatus;
  resultUrl?: string;
  error?: string;
  mock?: boolean;
  family?: string;
};

function hasKey() {
  return Boolean(process.env.KIE_API_KEY);
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.KIE_API_KEY ?? ""}`,
  };
}

function turkceHata(status: number, fallback?: string): string {
  if (status === 401) return "API anahtarı geçersiz veya yetkiniz yok.";
  if (status === 402) return "Yetersiz kredi. Plan yükselt veya bakiye ekle.";
  if (status === 404) return "AI sağlayıcı endpoint bulunamadı (model adı veya yol hatalı olabilir).";
  if (status === 429) return "Çok fazla istek. Birkaç saniye bekleyip tekrar deneyin.";
  if (status >= 500) return "AI sağlayıcı sunucu hatası. Birkaç dakika sonra tekrar deneyin.";
  return fallback || `Beklenmeyen hata (HTTP ${status})`;
}

function mockResponse(prefix: string, prompt: string, family?: string): KieTask {
  const id = `mock-${prefix}-${Date.now()}`;
  return {
    taskId: id,
    status: "succeeded",
    resultUrl: `https://placehold.co/1280x720/0a0a0a/a855f7?text=${encodeURIComponent(
      (prompt || "Vibe Studio").slice(0, 40)
    )}`,
    mock: true,
    family,
  };
}

function normalizeStatus(raw: unknown): KieStatus {
  // Kie sayisal:  0=running, 1=success, 2=failed, 3=failed
  if (raw === 0 || raw === "0") return "running";
  if (raw === 1 || raw === "1") return "succeeded";
  if (raw === 2 || raw === 3 || raw === "2" || raw === "3") return "failed";
  // Kie string state alanı: "success" | "fail" | "queuing" | "generating" | "running" | "pending"
  if (typeof raw === "string") {
    const s = raw.toLowerCase();
    if (s === "success" || s === "succeeded" || s === "completed" || s === "done") return "succeeded";
    if (s === "fail" || s === "failed" || s === "error") return "failed";
    if (s === "pending" || s === "queuing" || s === "queued" || s === "waiting") return "pending";
    if (s === "running" || s === "generating" || s === "processing" || s === "in_progress") return "running";
  }
  return "running";
}

function extractResultUrl(data: any): string | undefined {
  if (!data) return undefined;
  // 1) Birlesik market formati: data.resultJson STRING JSON {"resultUrls": [...]}
  //    Bu en yaygın olan, jobs/createTask sonrası recordInfo donen format.
  if (typeof data.resultJson === "string" && data.resultJson.trim()) {
    try {
      const parsed = JSON.parse(data.resultJson);
      if (Array.isArray(parsed?.resultUrls) && parsed.resultUrls.length) {
        return String(parsed.resultUrls[0]);
      }
      if (typeof parsed?.resultUrl === "string") return parsed.resultUrl;
      if (typeof parsed?.imageUrl === "string") return parsed.imageUrl;
      if (typeof parsed?.videoUrl === "string") return parsed.videoUrl;
      if (typeof parsed?.audioUrl === "string") return parsed.audioUrl;
      if (Array.isArray(parsed?.images) && parsed.images.length) {
        const f = parsed.images[0];
        return typeof f === "string" ? f : f?.url;
      }
      if (Array.isArray(parsed?.videos) && parsed.videos.length) {
        const f = parsed.videos[0];
        return typeof f === "string" ? f : f?.url;
      }
    } catch {
      // resultJson parse edilemezse digerleri denenir.
    }
  }
  // 2) Dogrudan URL alanlari
  if (typeof data.resultUrl === "string") return data.resultUrl;
  if (typeof data.resultImageUrl === "string") return data.resultImageUrl;
  if (typeof data.audioWavUrl === "string") return data.audioWavUrl;
  if (typeof data.url === "string") return data.url;
  // 3) Iç response objesi (veo, wav, suno gibi)
  if (data.response) {
    if (Array.isArray(data.response.resultUrls) && data.response.resultUrls.length)
      return data.response.resultUrls[0];
    if (Array.isArray(data.response.fullResultUrls) && data.response.fullResultUrls.length)
      return data.response.fullResultUrls[0];
    if (typeof data.response.resultImageUrl === "string") return data.response.resultImageUrl;
    if (typeof data.response.audioWavUrl === "string") return data.response.audioWavUrl;
    if (typeof data.response.resultUrl === "string") return data.response.resultUrl;
  }
  // 4) output[] / outputs[] arrayleri
  if (Array.isArray(data.output) && data.output.length) {
    const first = data.output[0];
    if (typeof first === "string") return first;
    if (first && typeof first.url === "string") return first.url;
  }
  if (Array.isArray(data.outputs) && data.outputs.length) {
    const first = data.outputs[0];
    if (typeof first === "string") return first;
    if (first && typeof first.url === "string") return first.url;
  }
  // 5) Dogrudan resultUrls array
  if (Array.isArray(data.resultUrls) && data.resultUrls.length) {
    return String(data.resultUrls[0]);
  }
  return undefined;
}

function extractTaskId(data: any): string | null {
  if (!data) return null;
  if (typeof data.taskId === "string") return data.taskId;
  if (typeof data.task_id === "string") return data.task_id;
  if (typeof data.id === "string") return data.id;
  if (typeof data.task?.id === "string") return data.task.id;
  if (typeof data.task?.taskId === "string") return data.task.taskId;
  if (typeof data.taskID === "string") return data.taskID;
  if (typeof data.requestId === "string") return data.requestId;
  if (typeof data.jobId === "string") return data.jobId;
  return null;
}

// Kie response code'unu defansif kontrol et — HTTP 200 gelse bile body code != 200 olabilir.
function checkKieCode(data: any): { ok: boolean; message?: string } {
  if (!data || typeof data !== "object") return { ok: false, message: "Boş yanıt" };
  // code alanı yoksa OK kabul et (bazı endpoint'ler code göndermez)
  if (data.code === undefined || data.code === null) return { ok: true };
  const code = Number(data.code);
  if (code === 200 || code === 0) return { ok: true };
  // Hata kodu — Türkçeleştir
  const msg = data.msg || data.message || data.error || `code ${code}`;
  let tr = String(msg);
  if (code === 401) tr = "API anahtarı geçersiz veya yetkiniz yok.";
  else if (code === 402) tr = "Yetersiz kredi. Plan yükselt veya bakiye ekle.";
  else if (code === 403) tr = `Erişim reddedildi: ${msg}`;
  else if (code === 404) tr = "AI sağlayıcı endpoint bulunamadı (model adı veya yol hatalı olabilir).";
  else if (code === 422) tr = `Üretim isteği reddedildi (422): ${msg}`;
  else if (code === 429) tr = "Çok fazla istek, birkaç saniye bekleyin.";
  else if (code >= 500) tr = `AI sağlayıcı sunucu hatası (${code}): ${msg}`;
  return { ok: false, message: tr };
}

async function kieFetch(url: string, init: RequestInit, retry = true): Promise<any> {
  // Next.js fetch'i default olarak cache yapar - poll endpoint icin devre disi birak
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) {
    if (retry && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 1500));
      return kieFetch(url, init, false);
    }
    let bodyText = "";
    try { bodyText = await res.text(); } catch {}
    const tm = turkceHata(res.status, bodyText.slice(0, 200));
    const e: Error & { status?: number; bodyText?: string } = new Error(tm);
    e.status = res.status;
    e.bodyText = bodyText;
    throw e;
  }
  return res.json();
}

export type CreateInput = {
  prompt: string;
  modelDisplayName: string;
  aspect_ratio?: string;
  imageUrls?: string[];
  audioUrls?: string[];
  videoUrls?: string[];
  // video-extend modelleri icin Kie task_id istiyor (mevcut Kie URL'sini kullanmak yerine).
  // Kullanici kendi yuklediginiz videoyu task_id olarak yollamak isterse buradan gelir.
  taskIdInput?: string;
  duration?: number;
  language?: string;
};

// Video uretimine eklenen ek talimat — model uzerinde Turkce yazi/ses sorununu engellemek icin.
// Sahnede HIC yazi, alt yazi, logo, konusma, anlatim, ses olmasin. Hepsi editorden eklenecek.
const SILENT_VISUAL_SUFFIX =
  ", no text on screen, no captions, no subtitles, no logos, no watermarks, no speech, no narration, no dialogue, completely silent, no audio, no music, no on-screen writing in any language";

function applyNegativePrompt(prompt: string, kind: string): string {
  if (kind !== "video" && kind !== "image") return prompt;
  // Lipsync ailesi icin ses lazim — suffix ekleme
  return prompt + SILENT_VISUAL_SUFFIX;
}

export async function createTask(input: CreateInput): Promise<KieTask> {
  const map = getMapping(input.modelDisplayName);
  if (!hasKey()) return mockResponse(map.kind, input.prompt, map.family);

  // Lipsync VE ses gerekn endpointler haric, video promptlarina sessiz/yazisiz ekle
  const isLipsyncOrAudio =
    map.jobsModelId?.includes("lipsync") ||
    map.jobsModelId?.includes("ai-avatar") ||
    map.jobsModelId?.includes("speech-to-video") ||
    map.jobsModelId?.includes("infinitalk");
  if (!isLipsyncOrAudio) {
    input = { ...input, prompt: applyNegativePrompt(input.prompt, map.kind) };
  }

  try {
    if (map.family === "veo") {
      const body: any = {
        prompt: input.prompt,
        model: map.veoModel || "veo3_fast",
        aspect_ratio: input.aspect_ratio || "16:9",
        enableTranslation: true,
      };
      if (input.imageUrls?.length) body.imageUrls = input.imageUrls;
      const data = await kieFetch(`${KIE_BASE}/api/v1/veo/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const codeCheck = checkKieCode(data);
      if (!codeCheck.ok) throw new Error(codeCheck.message || "AI yanıt hatası");
      const taskId = extractTaskId(data?.data) || extractTaskId(data);
      if (!taskId) throw new Error(`Sağlayıcı yanıtında taskId bulunamadı. Yanıt: ${JSON.stringify(data).slice(0, 300)}`);
      return { taskId, status: "running", family: "veo" };
    }

    if (map.family === "gpt4o") {
      const body = {
        prompt: input.prompt,
        size: input.aspect_ratio === "9:16" ? "1024x1792"
          : input.aspect_ratio === "1:1" ? "1024x1024" : "1792x1024",
        ...(input.imageUrls?.length ? { imageUrls: input.imageUrls } : {}),
      };
      const data = await kieFetch(`${KIE_BASE}/api/v1/gpt4o-image/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const codeCheck = checkKieCode(data);
      if (!codeCheck.ok) throw new Error(codeCheck.message || "AI yanıt hatası");
      const taskId = extractTaskId(data?.data) || extractTaskId(data);
      if (!taskId) throw new Error(`Sağlayıcı yanıtında taskId bulunamadı. Yanıt: ${JSON.stringify(data).slice(0, 300)}`);
      return { taskId, status: "running", family: "gpt4o" };
    }

    // jobs ailesi (varsayilan): birlesik createTask
    // Doc: https://docs.kie.ai/market/quickstart
    let modelId = map.jobsModelId || "";
    const inputBody: any = {
      prompt: input.prompt,
    };

    // Model bazli body shape — Kie docs ve canli test ile dogrulanmis
    const isSora2 = modelId.startsWith("sora-2");
    const isGrok = modelId.startsWith("grok-imagine/");
    const isSeedream = modelId.startsWith("seedream/") || modelId.startsWith("bytedance/seedream");
    const isSeedance15 = modelId === "bytedance/seedance-1.5-pro";
    const isKling3 = modelId === "kling-3.0" || modelId === "kling-3.0/video";

    if (isSora2) {
      // Sora 2: aspect_ratio = "landscape"|"portrait" (1:1 desteklenmez), n_frames "10"
      // Sora 2 Pro ek olarak size: "standard" istiyor
      const ar = input.aspect_ratio || "16:9";
      inputBody.aspect_ratio = ar === "9:16" ? "portrait" : "landscape";
      inputBody.n_frames = "10";
      if (modelId.includes("sora-2-pro")) {
        inputBody.size = "standard";
      }
    } else if (isGrok) {
      // Grok Imagine: aspect_ratio ve duration gonderme (range validation)
    } else if (isKling3) {
      // Kling 3.0: kling-3.0/video modelId, sound REQUIRED, mode "std"/"pro"
      modelId = "kling-3.0/video"; // her durumda /video kullan
      inputBody.aspect_ratio = input.aspect_ratio || "16:9";
      inputBody.duration = String(input.duration || 5);
      inputBody.mode = "std";
      inputBody.multi_shots = false;
      inputBody.sound = true;
    } else if (isSeedance15) {
      // Seedance 1.5 Pro: duration STRING + discrete enum (sadece "8" veya "12"), resolution gerekli
      inputBody.aspect_ratio = input.aspect_ratio || "16:9";
      inputBody.resolution = "720p";
      // Kullanici 5 sn istemisse en yakin enum: 8
      const d = input.duration || 5;
      inputBody.duration = d <= 10 ? "8" : "12";
    } else if (isSeedream) {
      inputBody.aspect_ratio = input.aspect_ratio || "16:9";
    } else {
      // Diger jobs modelleri (Kling 2.5, Seedance 2, Hailuo, Wan, vb.)
      inputBody.aspect_ratio = input.aspect_ratio || "16:9";
    }

    if (input.imageUrls?.length) {
      inputBody.image_urls = input.imageUrls;
      if (input.imageUrls.length === 1) inputBody.image_url = input.imageUrls[0];
    }
    if (input.audioUrls?.length) {
      inputBody.audio_urls = input.audioUrls;
      if (input.audioUrls.length === 1) inputBody.audio_url = input.audioUrls[0];
    }
    if (input.videoUrls?.length) {
      inputBody.video_urls = input.videoUrls;
      if (input.videoUrls.length === 1) inputBody.video_url = input.videoUrls[0];
    }
    if (input.taskIdInput) inputBody.task_id = input.taskIdInput;
    // Duration sadece Grok/Sora 2/Kling 3/Seedance 1.5 disindaki jobs modellerine gonder
    if (input.duration && !isGrok && !isSora2 && !isKling3 && !isSeedance15) {
      inputBody.duration = String(input.duration);
    }
    if (input.language) inputBody.language = input.language;
    const body = { model: modelId, input: inputBody };
    const data = await kieFetch(`${KIE_BASE}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const codeCheck = checkKieCode(data);
    if (!codeCheck.ok) throw new Error(codeCheck.message || "AI yanıt hatası");
    const taskId = extractTaskId(data?.data) || extractTaskId(data);
    if (!taskId) {
      // Bilgilendirme: model id veya body sema sorunlu olabilir
      throw new Error(
        `Sağlayıcı yanıtında taskId bulunamadı. Model: "${map.jobsModelId}". Yanıt: ${JSON.stringify(data).slice(0, 300)}`
      );
    }
    return { taskId, status: "running", family: map.family };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return { taskId: "error", status: "failed", error: msg };
  }
}

// Geriye uyumluluk wrapper'lari
export async function createImageTask(prompt: string, modelDisplayName: string): Promise<KieTask> {
  return createTask({ prompt, modelDisplayName });
}
export async function createVideoTask(prompt: string, modelDisplayName: string): Promise<KieTask> {
  return createTask({ prompt, modelDisplayName });
}

export async function getTaskStatus(taskId: string, family?: string): Promise<KieTask> {
  if (!hasKey() || taskId.startsWith("mock-") || taskId === "error") {
    return {
      taskId,
      status: "succeeded",
      resultUrl: `https://placehold.co/1280x720/0a0a0a/ec4899?text=${encodeURIComponent("Hazir: " + taskId)}`,
      mock: true,
    };
  }
  const candidates: { url: string; family: string }[] = [];
  if (family === "veo") {
    candidates.push({ url: `${KIE_BASE}/api/v1/veo/record-info?taskId=${taskId}`, family: "veo" });
  } else if (family === "gpt4o") {
    candidates.push({ url: `${KIE_BASE}/api/v1/gpt4o-image/record-info?taskId=${taskId}`, family: "gpt4o" });
  } else {
    candidates.push(
      { url: `${KIE_BASE}/api/v1/jobs/recordInfo?taskId=${taskId}`, family: "jobs" },
      { url: `${KIE_BASE}/api/v1/veo/record-info?taskId=${taskId}`, family: "veo" },
      { url: `${KIE_BASE}/api/v1/gpt4o-image/record-info?taskId=${taskId}`, family: "gpt4o" },
    );
  }
  let lastErr: Error | undefined;
  for (const c of candidates) {
    try {
      const data = await kieFetch(c.url, {
        headers: { Authorization: `Bearer ${process.env.KIE_API_KEY ?? ""}` },
      }, false);
      const inner = data?.data ?? data;
      // Kie alan adlari farkli endpoint'lerde degisir:
      //  - jobs/recordInfo: data.state ("success"|"fail"|"queuing"|"generating"), data.resultJson
      //  - veo/record-info: data.successFlag (0|1|2|3), data.response.resultUrls
      //  - wav/record-info: data.successFlag string ("SUCCESS"|"PENDING"...)
      //  - flux/kontext/record-info: data.successFlag (0|1|2|3), data.response.resultImageUrl
      const statusRaw = inner?.state ?? inner?.successFlag ?? inner?.status;
      const status = normalizeStatus(statusRaw);
      const resultUrl = extractResultUrl(inner);
      const errorMessage =
        inner?.failMsg || inner?.errorMessage || inner?.error_message || data?.msg;
      return {
        taskId,
        // Bazen state hala "generating" geliyor ama resultUrl mevcut → succeeded say
        status: status === "running" && resultUrl ? "succeeded" : status,
        resultUrl,
        error: status === "failed" ? errorMessage : undefined,
        family: c.family,
      };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error("Sorgu hatasi");
      continue;
    }
  }
  return { taskId, status: "failed", error: lastErr?.message || "Görev durumu sorgulanamadı" };
}

export async function downloadAsset(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}
