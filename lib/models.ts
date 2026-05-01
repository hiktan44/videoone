// Kie.ai model aileleri ve gosterilen ad <-> Kie API model id eslestirmesi.
// Faz 2 hotfix v2: tum 143 model katalogtan dinamik turetiliyor (kie-catalog.ts).

import { KIE_CATALOG, findEntry, type KieCategory, type KieFamily, type KieModelEntry } from "./kie-catalog";

// UI dropdown gruplari — kategorilere gore segregeleyerek gosteriyoruz.
// Kullanici "image" dropdown'unda hem text-to-image hem image-edit hem upscale gorur.
const IMAGE_CATS: KieCategory[] = [
  "image", "image-edit", "image-to-image", "upscale", "background-removal", "reframe",
];
const VIDEO_CATS: KieCategory[] = [
  "video", "image-to-video", "video-extend", "video-edit", "lipsync", "video-upscale",
];
const VOICE_CATS: KieCategory[] = ["voice", "tts", "speech-to-text"];
const MUSIC_CATS: KieCategory[] = ["music", "audio-effect"];

function displaysFor(cats: KieCategory[]): string[] {
  return KIE_CATALOG.filter((e) => cats.includes(e.category)).map((e) => e.display);
}

// Manuel override: ses (voice) icin katalog disinda da klasik isimleri tutuyoruz
// cunku Kie suno dokumantasyonu disinda InWorld/ElevenLabs adlari da kullanicilara tanidik.
const VOICE_FALLBACK = ["InWorld 1.5 Max", "Eleven Labs V3", "Eleven Labs Turbo"];

export const KIE_MODEL_FAMILIES = {
  image: displaysFor(IMAGE_CATS),
  video: displaysFor(VIDEO_CATS),
  voice: displaysFor(VOICE_CATS).length > 0 ? displaysFor(VOICE_CATS) : VOICE_FALLBACK,
  music: displaysFor(MUSIC_CATS),
  language: ["Türkçe", "English", "Español"],
  waveform: ["Tümünü Göster", "Sadece Aktif", "Hiçbiri"],
  aspect: ["1:1", "16:9", "9:16", "4:3"],
} as const;

// Varsayilan model secimleri (katalogtaki mevcut, calisir modeller)
export const KIE_DEFAULT_MODELS = {
  imageModel: KIE_MODEL_FAMILIES.image.find((d) => d.includes("Seedream 4.5") && d.includes("Text")) ?? KIE_MODEL_FAMILIES.image[0] ?? "GPT Image 2",
  videoModel: KIE_MODEL_FAMILIES.video.find((d) => d.includes("Veo 3.1 Fast")) ?? KIE_MODEL_FAMILIES.video[0] ?? "Google Veo 3.1 Fast",
  voiceModel: VOICE_FALLBACK[0],
  musicModel: KIE_MODEL_FAMILIES.music[0] ?? "Suno V4.5",
  language: "Türkçe",
  aspectRatio: "16:9",
  waveform: "Sadece Aktif",
} as const;

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3";

// kie.ts'in bekledigi format — KieModelEntry'i Mapping'e cevir.
export type ModelMapping = {
  family: KieFamily;
  jobsModelId?: string;
  veoModel?: string;
  kind: "image" | "video" | "voice" | "music";
  notes?: string;
  requiresImage?: boolean;
  requiresVideo?: boolean;
  requiresAudio?: boolean;
};

// notes alanindan gereken girdileri cozumle: "image input gerektirir" -> requiresImage.
function parseRequirements(notes?: string): {
  requiresImage?: boolean;
  requiresVideo?: boolean;
  requiresAudio?: boolean;
} {
  if (!notes) return {};
  const n = notes.toLowerCase();
  const req: any = {};
  if (n.includes("image input") || n.includes("reference image") || n.includes("image_urls") || n.includes("image-to-")) {
    req.requiresImage = true;
  }
  if (n.includes("video input") || n.includes("task_id input") || n.includes("video-to-")) {
    req.requiresVideo = true;
  }
  if (n.includes("speech audio") || n.includes("audio input") || n.includes("speech-to-")) {
    req.requiresAudio = true;
  }
  return req;
}

// Katalogtaki kategori tek basina da zorunlu girdi isarettir:
// - image-to-video, image-to-image, lipsync -> image zorunlu
// - video-extend, video-edit, video-upscale -> video zorunlu
function inferRequirementsFromCategory(category: string) {
  const req: any = {};
  if (["image-to-video", "image-to-image", "lipsync", "image-edit", "reframe", "upscale", "background-removal"].includes(category)) {
    req.requiresImage = true;
  }
  if (["video-extend", "video-edit", "video-upscale"].includes(category)) {
    req.requiresVideo = true;
  }
  return req;
}

function entryToMapping(entry: KieModelEntry): ModelMapping {
  const kindMap: Record<KieCategory, ModelMapping["kind"]> = {
    image: "image", "image-edit": "image", "image-to-image": "image",
    upscale: "image", "background-removal": "image", reframe: "image",
    video: "video", "image-to-video": "video", "video-extend": "video",
    "video-edit": "video", lipsync: "video", "video-upscale": "video",
    voice: "voice", tts: "voice", "speech-to-text": "voice",
    music: "music", "audio-effect": "music",
    chat: "voice", other: "voice",
  };
  const reqFromNotes = parseRequirements(entry.notes);
  const reqFromCat = inferRequirementsFromCategory(entry.category);
  const m: ModelMapping = {
    family: entry.family,
    jobsModelId: entry.modelId,
    kind: kindMap[entry.category] ?? "video",
    notes: entry.notes,
    ...reqFromCat,
    ...reqFromNotes,
  };
  if (entry.family === "veo" && entry.modelId) m.veoModel = entry.modelId;
  return m;
}

// Eski display adlari icin alias eslestirme + Kie tarafinda calismayan
// modelleri calisan eşdegerlerine yonlendirme.
const ALIAS_MAP: Record<string, string> = {
  // Eski isim aliaslari
  "Google Veo 3.1 Fast": "Veo 3.1 Fast",
  "Google Veo 3.1": "Veo 3.1 Fast",
  "Google Veo 3.1 Lite": "Veo 3.1 Fast",
  "LTX2": "Kling 2.5 Turbo Text-to-Video Pro",
  "Flux Klein 9B": "Flux 2 Pro Text-to-Image",
  "Nano Banana Pro": "Nano Banana 2",
  "Seedream 4.5": "Seedream 4.5 Text-to-Image",

};

export function getMapping(displayName: string): ModelMapping {
  // Once dogrudan eslesme dene
  let entry = findEntry(displayName);
  if (entry) return entryToMapping(entry);

  // Alias varsa onu dene
  const alias = ALIAS_MAP[displayName];
  if (alias) {
    entry = findEntry(alias);
    if (entry) return entryToMapping(entry);
  }

  // Eski/manuel ses adlari icin fallback (jobs ailesinde varsayim)
  if (VOICE_FALLBACK.includes(displayName)) {
    return { family: "jobs", jobsModelId: `voice/${displayName.toLowerCase().replace(/\s+/g, "-")}`, kind: "voice" };
  }

  // Bilinmeyen — "Web Render" gibi yer tutucular icin Veo'ya guvenli fallback
  console.warn(`[models] Bilinmeyen model "${displayName}" — Veo 3.1 Fast'e dususuldu`);
  const veoEntry = findEntry("Veo 3.1 Fast");
  if (veoEntry) return entryToMapping(veoEntry);
  return { family: "jobs", jobsModelId: undefined, kind: "video" };
}

// UI tarafinda kategori basliklari icin kullanilabilir.
export const CATEGORY_LABEL_TR: Record<KieCategory, string> = {
  image: "Görsel — Metinden",
  "image-edit": "Görsel — Düzenleme",
  "image-to-image": "Görsel — Görselden",
  upscale: "Görsel — Yükseltme",
  "background-removal": "Görsel — Arkaplan Kaldır",
  reframe: "Görsel — Yeniden Çerçeve",
  video: "Video — Metinden",
  "image-to-video": "Video — Görselden",
  "video-extend": "Video — Uzatma",
  "video-edit": "Video — Düzenleme",
  lipsync: "Video — Dudak Senkronu",
  "video-upscale": "Video — Yükseltme",
  voice: "Ses — Klonlama",
  tts: "Ses — Türkçe Konuşma",
  "speech-to-text": "Ses — Metne Çevirme",
  music: "Müzik — Üretim",
  "audio-effect": "Ses — Efekt",
  chat: "Sohbet",
  other: "Diğer",
};
