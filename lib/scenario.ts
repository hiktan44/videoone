// Senaryo veri tipleri ve kamera/gecis kutuphanesi.
// Kullanici prompt -> /api/scenario/generate -> Storyboard -> kullanici onayi -> pipeline.

export type CameraAngle =
  | "wide-establishing"
  | "medium-shot"
  | "close-up"
  | "extreme-close-up"
  | "over-the-shoulder"
  | "low-angle"
  | "high-angle"
  | "birds-eye"
  | "tracking-shot"
  | "dolly-zoom"
  | "pov-first-person"
  | "drone-aerial";

export type Transition =
  | "smooth-fade"
  | "hard-cut"
  | "whip-pan"
  | "match-cut"
  | "fade-to-black"
  | "dissolve"
  | "morph"
  | "zoom-blur";

export const CAMERA_ANGLES: { id: CameraAngle; tr: string; en: string }[] = [
  { id: "wide-establishing", tr: "Geniş açı (sahne tanıtımı)", en: "wide establishing shot" },
  { id: "medium-shot", tr: "Orta plan", en: "medium shot" },
  { id: "close-up", tr: "Yakın çekim", en: "close-up shot" },
  { id: "extreme-close-up", tr: "Çok yakın çekim", en: "extreme close-up" },
  { id: "over-the-shoulder", tr: "Omuz üstü çekim", en: "over the shoulder" },
  { id: "low-angle", tr: "Alt açı", en: "low angle, looking up" },
  { id: "high-angle", tr: "Üst açı", en: "high angle, looking down" },
  { id: "birds-eye", tr: "Kuş bakışı", en: "bird's eye view, top down" },
  { id: "tracking-shot", tr: "Takip çekimi", en: "tracking shot following the subject" },
  { id: "dolly-zoom", tr: "Dolly zoom", en: "dolly zoom, vertigo effect" },
  { id: "pov-first-person", tr: "Birinci şahıs bakış", en: "first person POV" },
  { id: "drone-aerial", tr: "Hava çekimi", en: "drone aerial cinematic shot" },
];

export const TRANSITIONS: { id: Transition; tr: string; en: string }[] = [
  { id: "smooth-fade", tr: "Yumuşak geçiş", en: "smooth cross-fade transition" },
  { id: "hard-cut", tr: "Sert kesim", en: "hard cut" },
  { id: "whip-pan", tr: "Hızlı pan", en: "whip pan transition" },
  { id: "match-cut", tr: "Eşleşmeli kesim", en: "match cut from previous scene" },
  { id: "fade-to-black", tr: "Karartma", en: "fade to black, then in" },
  { id: "dissolve", tr: "Dissolve", en: "dissolve transition" },
  { id: "morph", tr: "Morph", en: "morphing transition" },
  { id: "zoom-blur", tr: "Zoom blur", en: "zoom blur transition" },
];

export type Scene = {
  id: string;
  index: number; // 1-based sira
  title: string; // kisa baslik (kullanici icin)
  prompt: string; // Kie'ye gonderilecek anlatim
  durationSec: number; // 3-15 sn
  cameraAngle: CameraAngle;
  transitionAfter?: Transition; // sonraki sahneye gecis
  aspectRatio?: string; // proje genelinden override
};

export type Storyboard = {
  id: string;
  topic: string; // kullanicinin verdigi orijinal konu
  totalDurationSec: number; // hedeflenen toplam
  modelDisplayName: string; // hangi Kie modeli kullanilacak
  language: "Türkçe" | "English";
  scenes: Scene[];
  createdAt: number;
  // Genel sinematik stil — tum sahnelere eklenir
  globalStyle?: string;
};

// Bir Storyboard'un toplam suresi (sahnelerden hesaplanir, hedef olabilir)
export function actualTotalDuration(s: Storyboard): number {
  return s.scenes.reduce((sum, sc) => sum + sc.durationSec, 0);
}

// Sahnenin Kie'ye gonderilecek zenginlestirilmis promptunu uret.
// Onceki sahne ile gecis ifadesini, kamera acisini ve global stili eklemis olur.
export function buildScenePrompt(
  scene: Scene,
  prevScene: Scene | undefined,
  globalStyle?: string
): string {
  const parts: string[] = [];

  // Kamera acisi (Ingilizce — Kie modelleri Ingilizce promptta daha iyi calisir)
  const angle = CAMERA_ANGLES.find((a) => a.id === scene.cameraAngle);
  if (angle) parts.push(angle.en);

  // Onceki sahnedeki gecis tarifi
  if (prevScene?.transitionAfter) {
    const t = TRANSITIONS.find((t) => t.id === prevScene.transitionAfter);
    if (t) parts.push(`continuing ${t.en} from previous scene`);
  }

  // Asil sahne anlatimi
  parts.push(scene.prompt);

  // Global stil
  if (globalStyle) parts.push(globalStyle);

  // Sahne numarasi (modellerin tutarli stil tutmasi icin)
  parts.push(`Scene ${scene.index} of a connected sequence.`);

  return parts.join(". ");
}

// Hedef toplam sureye gore ideal sahne sayisi (kabaca).
// Kling 3.0 / Seedance 2 = 15 sn; Veo Fast = 10 sn; cogu = 5-8 sn.
export function suggestSceneCount(totalSec: number, perSceneMaxSec: number): number {
  const ideal = Math.ceil(totalSec / perSceneMaxSec);
  return Math.max(3, Math.min(20, ideal));
}

// Eger Kie agent yoksa kullanilan basit fallback senaryosu — konu adindan jenerik 12 sahne uretir.
export function fallbackStoryboard(
  topic: string,
  totalSec: number,
  modelDisplayName: string,
  perSceneMax: number
): Storyboard {
  const sceneCount = suggestSceneCount(totalSec, perSceneMax);
  const baseDuration = Math.max(3, Math.min(perSceneMax, Math.round(totalSec / sceneCount)));
  const angles: CameraAngle[] = ["wide-establishing", "medium-shot", "close-up", "tracking-shot", "low-angle", "drone-aerial"];
  const transitions: Transition[] = ["smooth-fade", "match-cut", "whip-pan", "hard-cut", "dissolve"];
  const now = Date.now();
  const scenes: Scene[] = Array.from({ length: sceneCount }, (_, i) => ({
    id: `sc${now}-${i + 1}`,
    index: i + 1,
    title: `Sahne ${i + 1}`,
    prompt: i === 0
      ? `Açılış: ${topic}. Konunun atmosferini tanıtan bir an.`
      : i === sceneCount - 1
      ? `Kapanış: ${topic} temasının duygusal son anı.`
      : `${topic} hakkında ${i + 1}. an: anlatımı ileri taşıyan bir görüntü.`,
    durationSec: baseDuration,
    cameraAngle: angles[i % angles.length],
    transitionAfter: i < sceneCount - 1 ? transitions[i % transitions.length] : undefined,
  }));
  return {
    id: `sb${now}`,
    topic,
    totalDurationSec: totalSec,
    modelDisplayName,
    language: "Türkçe",
    scenes,
    createdAt: now,
    globalStyle: "cinematic lighting, professional color grading, smooth camera movement",
  };
}
