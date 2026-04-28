import { NextResponse } from "next/server";
import {
  fallbackStoryboard, type Storyboard, type Scene, type CameraAngle, type Transition,
} from "@/lib/scenario";

export const runtime = "nodejs";

// Kie Gemini endpoint URL'inde model adi yer alir.
// docs.kie.ai: POST https://api.kie.ai/gemini-2.5-pro/v1/chat/completions
const KIE_BASE = "https://api.kie.ai";
const GEMINI_PATH = "/gemini-2.5-pro/v1/chat/completions";

const SYSTEM_PROMPT = `You are a professional cinematic storyboard writer for short-form AI video. The user gives you a topic in Turkish and a target total duration. You MUST analyze the topic deeply and design a connected, emotionally engaging multi-scene storyboard. NEVER simply repeat or copy the user's topic into each scene — instead break it into a narrative arc.

NARRATIVE STRUCTURE (always follow):
- Scene 1: Establishing shot — set the location, mood, and protagonist
- Scene 2: Hook — introduce the central tension or visual interest
- Middle scenes: Build action, vary camera angles, change subjects
- Penultimate scene: Climax or peak moment
- Final scene: Resolution / call-to-action / emotional close-up

EVERY scene must have:
- A unique visual focus (don't repeat the same scene description)
- A specific subject doing a specific action
- Time-of-day, weather, lighting details
- Camera movement description
- 2-3 sentences in English (AI video models work best with English prompts)

OUTPUT (return ONLY valid JSON, no markdown, no prose):
{
  "scenes": [
    {
      "title": "<Turkish, max 6 words, descriptive>",
      "prompt": "<English, 2-3 sentences, specific visual details>",
      "durationSec": <integer 3-15>,
      "cameraAngle": "wide-establishing"|"medium-shot"|"close-up"|"extreme-close-up"|"over-the-shoulder"|"low-angle"|"high-angle"|"birds-eye"|"tracking-shot"|"dolly-zoom"|"pov-first-person"|"drone-aerial",
      "transitionAfter": "smooth-fade"|"hard-cut"|"whip-pan"|"match-cut"|"fade-to-black"|"dissolve"|"morph"|"zoom-blur"
    }
  ]
}

CRITICAL RULES:
- Total scene duration MUST be within ±10% of target totalDurationSec.
- Use the per-scene maximum as upper bound for each durationSec.
- Vary camera angles — don't use the same angle twice in a row.
- The last scene's transitionAfter is ignored, set it to "fade-to-black".
- Each scene's prompt MUST be uniquely written, not a copy of the user topic.
- Return STRICT JSON. No code fences. No comments.`;

type GenInput = {
  topic: string;
  totalDurationSec: number;
  modelDisplayName: string;
  perSceneMaxSec: number;
  language?: "Türkçe" | "English";
  globalStyle?: string;
};

const VALID_ANGLES: CameraAngle[] = [
  "wide-establishing","medium-shot","close-up","extreme-close-up","over-the-shoulder",
  "low-angle","high-angle","birds-eye","tracking-shot","dolly-zoom","pov-first-person","drone-aerial",
];
const VALID_TRANS: Transition[] = [
  "smooth-fade","hard-cut","whip-pan","match-cut","fade-to-black","dissolve","morph","zoom-blur",
];

function clampDuration(d: number, max: number): number {
  if (!Number.isFinite(d)) return 5;
  return Math.max(3, Math.min(max, Math.round(d)));
}

async function callGemini(input: GenInput): Promise<{ scenes?: Scene[]; error?: string }> {
  if (!process.env.KIE_API_KEY) return { error: "KIE_API_KEY tanımlı değil" };
  try {
    const userPrompt = `Topic (in Turkish): ${input.topic}
Target total duration: ${input.totalDurationSec} seconds
Per-scene maximum: ${input.perSceneMaxSec} seconds
Suggested scene count: ${Math.max(3, Math.ceil(input.totalDurationSec / input.perSceneMaxSec))}
Title language: ${input.language || "Türkçe"}

Design the storyboard now. Return JSON only.`;

    const body = {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.85,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "storyboard",
          strict: true,
          schema: {
            type: "object",
            properties: {
              scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    prompt: { type: "string" },
                    durationSec: { type: "integer" },
                    cameraAngle: { type: "string" },
                    transitionAfter: { type: "string" },
                  },
                  required: ["title", "prompt", "durationSec", "cameraAngle", "transitionAfter"],
                  additionalProperties: false,
                },
              },
            },
            required: ["scenes"],
            additionalProperties: false,
          },
        },
      },
    };

    const res = await fetch(`${KIE_BASE}${GEMINI_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { error: `Gemini HTTP ${res.status}: ${txt.slice(0, 200)}` };
    }

    const data = await res.json();
    const content: string =
      data?.choices?.[0]?.message?.content ||
      data?.data?.choices?.[0]?.message?.content ||
      "";

    if (!content) return { error: "Gemini boş yanıt döndü" };

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (!m) return { error: "Gemini yanıtı JSON değil: " + content.slice(0, 200) };
      try { parsed = JSON.parse(m[0]); }
      catch (e) { return { error: "JSON parse hatası: " + (e as Error).message }; }
    }

    const scenesRaw = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
    if (scenesRaw.length === 0) return { error: "Gemini hiç sahne döndürmedi" };

    const now = Date.now();
    const scenes: Scene[] = scenesRaw.map((s: any, i: number) => ({
      id: `sc${now}-${i + 1}`,
      index: i + 1,
      title: String(s?.title || `Sahne ${i + 1}`).slice(0, 80),
      prompt: String(s?.prompt || `Scene ${i + 1}`),
      durationSec: clampDuration(Number(s?.durationSec) || 5, input.perSceneMaxSec),
      cameraAngle: VALID_ANGLES.includes(s?.cameraAngle) ? s.cameraAngle : "medium-shot",
      transitionAfter:
        i < scenesRaw.length - 1
          ? VALID_TRANS.includes(s?.transitionAfter) ? s.transitionAfter : "smooth-fade"
          : "fade-to-black",
    }));
    return { scenes };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gemini isteği başarısız" };
  }
}

// Eger Gemini calismazsa: Akilli fallback. Konuyu analiz et, narrative arc uygula.
function smartFallback(topic: string, totalSec: number, perSceneMax: number): Scene[] {
  const sceneCount = Math.max(3, Math.min(20, Math.ceil(totalSec / perSceneMax)));
  const baseDuration = Math.max(3, Math.min(perSceneMax, Math.round(totalSec / sceneCount)));
  const now = Date.now();
  const t = topic.trim();

  // Konu tip tahmini — basit anahtar kelime kontrolu
  const isProduct = /(ürün|product|launch|tanıtım|brand|marka)/i.test(t);
  const isTravel = /(istanbul|izmir|şehir|tur|seyahat|gezi|travel|city)/i.test(t);
  const isFood = /(restoran|yemek|menu|cafe|food|restaurant)/i.test(t);
  const isFashion = /(moda|fashion|kıyafet|stil|style)/i.test(t);
  const isStory = /(hikaye|story|aşk|love|insan|romantic)/i.test(t);

  // Her sahne icin farkli narrative beat'ler
  const beats: { title: string; promptTpl: (topic: string) => string; angle: CameraAngle }[] = [];

  // Acilis (sahne 1)
  if (isTravel) {
    beats.push({
      title: "Açılış Manzarası",
      promptTpl: (x) => `Wide cinematic drone aerial establishing shot of ${x}, golden hour lighting, atmospheric haze, slow camera push-in revealing the scale of the location. Vibrant colors, professional color grading.`,
      angle: "drone-aerial",
    });
  } else if (isProduct) {
    beats.push({
      title: "Ürünün İlk Görünümü",
      promptTpl: (x) => `Wide establishing shot introducing the product context: ${x}. Studio lighting, clean composition, the product partially visible in soft focus, rotating slowly. Cinematic depth of field.`,
      angle: "wide-establishing",
    });
  } else if (isFood) {
    beats.push({
      title: "Mekan Atmosferi",
      promptTpl: (x) => `Wide shot of a warm restaurant interior, soft tungsten lighting, plates arriving, ${x}. Steam rising, blurred faces of diners. Cinematic warm tones.`,
      angle: "wide-establishing",
    });
  } else {
    beats.push({
      title: "Açılış",
      promptTpl: (x) => `Wide establishing shot setting the scene for: ${x}. Cinematic lighting, atmospheric depth, slow camera move-in revealing the environment. Professional color grading.`,
      angle: "wide-establishing",
    });
  }

  // Orta sahneler — varyasyonlar
  const midBeats: { title: string; promptTpl: (topic: string) => string; angle: CameraAngle }[] = [
    { title: "Detay Yakın Çekim", promptTpl: (x) => `Extreme close-up shot focusing on a key sensory detail of ${x}. Shallow depth of field, beautiful bokeh, slow tracking movement.`, angle: "extreme-close-up" },
    { title: "Hareket Anı", promptTpl: (x) => `Dynamic tracking shot following the main subject of ${x} in motion. Steady camera, smooth dolly movement, dramatic side lighting.`, angle: "tracking-shot" },
    { title: "Alt Açıdan Güç", promptTpl: (x) => `Low angle hero shot emphasizing the strength and importance of ${x}. Bold composition, rim lighting from behind, sky visible above.`, angle: "low-angle" },
    { title: "Yukarıdan Bakış", promptTpl: (x) => `Top-down bird's eye view of ${x}, geometric composition, symmetrical framing, satisfying patterns. Gentle rotation.`, angle: "birds-eye" },
    { title: "Karakter Yakını", promptTpl: (x) => `Medium close-up of a person experiencing ${x}, genuine emotion on face, natural lighting through window, subtle camera push-in.`, angle: "close-up" },
    { title: "POV Deneyim", promptTpl: (x) => `First person POV shot — viewer experiences ${x} directly. Hands visible in frame, immersive perspective, natural movement.`, angle: "pov-first-person" },
    { title: "Omuz Üstü", promptTpl: (x) => `Over-the-shoulder shot showing a character interacting with ${x}. Contextual environment in soft focus, intimate framing.`, angle: "over-the-shoulder" },
  ];

  for (let i = 1; i < sceneCount - 1; i++) {
    const beat = midBeats[(i - 1) % midBeats.length];
    beats.push(beat);
  }

  // Kapanis (son sahne)
  beats.push({
    title: "Kapanış Anı",
    promptTpl: (x) =>
      isProduct
        ? `Final hero shot: the product fully revealed in perfect lighting, ${x}, brand essence captured. Slight slow-motion, fade towards logo or brand statement.`
        : `Emotionally resonant close-up final shot of the most meaningful moment in ${x}. Soft natural light, slow zoom-in, graceful fade to black.`,
    angle: isProduct ? "medium-shot" : "extreme-close-up",
  });

  // Beats'i Scene'e dönüştür, gecisleri varyasyona koy
  const transitions: Transition[] = ["smooth-fade", "match-cut", "whip-pan", "dissolve", "hard-cut", "morph"];
  const scenes: Scene[] = beats.slice(0, sceneCount).map((b, i) => ({
    id: `sc${now}-${i + 1}`,
    index: i + 1,
    title: b.title,
    prompt: b.promptTpl(t),
    durationSec: baseDuration,
    cameraAngle: b.angle,
    transitionAfter: i < sceneCount - 1 ? transitions[i % transitions.length] : "fade-to-black",
  }));
  return scenes;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<GenInput>;
  const topic = String(body.topic || "").trim();
  const totalDurationSec = Number(body.totalDurationSec || 60);
  const modelDisplayName = String(body.modelDisplayName || "Kling 3.0 Pro");
  const perSceneMaxSec = Number(body.perSceneMaxSec || 10);
  const language = (body.language === "English" ? "English" : "Türkçe") as "Türkçe" | "English";
  const globalStyle = body.globalStyle || "cinematic lighting, professional color grading, smooth camera movement";

  if (!topic) {
    return NextResponse.json({ error: "topic alanı gerekli." }, { status: 400 });
  }
  if (totalDurationSec < 10 || totalDurationSec > 600) {
    return NextResponse.json({ error: "totalDurationSec 10-600 arasında olmalı." }, { status: 400 });
  }

  // 1) Gemini ile dene
  const ai = await callGemini({ topic, totalDurationSec, modelDisplayName, perSceneMaxSec, language, globalStyle });

  let storyboard: Storyboard;
  let source: "ai" | "fallback" = "fallback";
  let warning: string | undefined;

  if (ai.scenes && ai.scenes.length > 0) {
    storyboard = {
      id: `sb${Date.now()}`,
      topic, totalDurationSec, modelDisplayName, language, scenes: ai.scenes,
      createdAt: Date.now(), globalStyle,
    };
    source = "ai";
  } else {
    // 2) Akıllı fallback
    const scenes = smartFallback(topic, totalDurationSec, perSceneMaxSec);
    const base = fallbackStoryboard(topic, totalDurationSec, modelDisplayName, perSceneMaxSec);
    storyboard = { ...base, scenes, language, globalStyle };
    warning = ai.error || "AI senaryo üretimi başarısız oldu, akıllı şablon kullanıldı.";
  }

  return NextResponse.json({ storyboard, source, warning });
}
