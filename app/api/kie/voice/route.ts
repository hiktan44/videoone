// Kie.ai üzerinden ElevenLabs / InWorld TTS — gerçek createTask + polling.
// Body: { text, voiceModel?, language? }
// Doner: { taskId, status, family, audioUrl? }
// Frontend polling /api/kie/poll ile sonucu bekler.

import { NextResponse } from "next/server";
import { chargeForGeneration } from "@/lib/charge-helper";
import { createTask } from "@/lib/kie";

// Display language → ISO 639-1 code (ElevenLabs Multilingual destekler)
const LANG_CODE_MAP: Record<string, string> = {
  Türkçe: "tr", "Türkçe (TR)": "tr", tr: "tr", TR: "tr",
  English: "en", İngilizce: "en", en: "en", EN: "en",
  Español: "es", İspanyolca: "es", es: "es",
  Français: "fr", Fransızca: "fr", fr: "fr",
  Deutsch: "de", Almanca: "de", de: "de",
  Italiano: "it", İtalyanca: "it", it: "it",
  Português: "pt", Portekizce: "pt", pt: "pt",
  Русский: "ru", Rusça: "ru", ru: "ru",
  日本語: "ja", Japonca: "ja", ja: "ja",
  한국어: "ko", Korece: "ko", ko: "ko",
  中文: "zh", Çince: "zh", zh: "zh",
  العربية: "ar", Arapça: "ar", ar: "ar",
  हिन्दी: "hi", Hintçe: "hi", hi: "hi",
  Polski: "pl", Lehçe: "pl", pl: "pl",
  Nederlands: "nl", Felemenkçe: "nl", nl: "nl",
};

function mapLanguage(lang: string): string {
  return LANG_CODE_MAP[lang] || LANG_CODE_MAP[lang?.toLowerCase?.() || ""] || "tr";
}

const VOICE_MODEL_MAP: Record<string, string> = {
  // Display name → Kie modelDisplayName (catalog'da var)
  "Eleven Labs V3": "ElevenLabs Text-to-Dialogue V3",
  "Eleven Labs Turbo": "ElevenLabs TTS Turbo 2.5",
  "ElevenLabs TTS Multilingual V2": "ElevenLabs TTS Multilingual V2",
  "ElevenLabs TTS Turbo 2.5": "ElevenLabs TTS Turbo 2.5",
  "ElevenLabs Text-to-Dialogue V3": "ElevenLabs Text-to-Dialogue V3",
  "InWorld 1.5 Max": "ElevenLabs TTS Multilingual V2", // fallback (InWorld Kie'de yok)
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text ?? "").trim();
  const requestedVoice = String(body?.voiceModel ?? "ElevenLabs TTS Multilingual V2");
  const language = String(body?.language ?? "Türkçe");

  if (!text) {
    return NextResponse.json(
      { error: "Seslendirilecek metin boş olamaz" },
      { status: 400 }
    );
  }

  // Kullanıcının seçtiği voice'u catalog modeline çevir
  const modelDisplayName = VOICE_MODEL_MAP[requestedVoice] || "ElevenLabs TTS Multilingual V2";

  // Kredi düşürme
  const estimatedDur = Math.max(3, text.split(/\s+/).length / 2.5);
  let charge;
  try {
    charge = await chargeForGeneration({
      kind: "voice",
      durationSec: estimatedDur,
      modelDisplayName,
    });
  } catch {
    return NextResponse.json(
      { error: "Yetersiz kredi. Lütfen plan yükselt veya bekle." },
      { status: 402 }
    );
  }

  if (!process.env.KIE_API_KEY) {
    // Mock — sadece dev
    return NextResponse.json({
      taskId: `mock-voice-${Date.now()}`,
      status: "succeeded",
      audioUrl:
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=",
      mock: true,
    });
  }

  // Gerçek Kie createTask çağrısı (lib/kie.ts üzerinden — text input olarak prompt'a yerleştirir)
  // Not: ElevenLabs TTS modelleri input.text bekler; lib/kie.ts default jobs body 'prompt' alanı
  // kullandığı için biz burada özel POST yapıyoruz.
  try {
    const modelMap: Record<string, string> = {
      "ElevenLabs TTS Multilingual V2": "elevenlabs/text-to-speech-multilingual-v2",
      "ElevenLabs TTS Turbo 2.5": "elevenlabs/text-to-speech-turbo-2-5",
      "ElevenLabs Text-to-Dialogue V3": "elevenlabs/text-to-dialogue-v3",
    };
    const modelId = modelMap[modelDisplayName] || "elevenlabs/text-to-speech-multilingual-v2";

    const res = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        input: {
          text,
          language_code: mapLanguage(language),
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      await charge.refund();
      return NextResponse.json(
        { error: `Ses üretimi başarısız: ${res.status} ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const code = data?.code;
    if (code !== undefined && code !== 200 && code !== 0) {
      await charge.refund();
      return NextResponse.json(
        { error: `Ses üretimi reddedildi: ${data?.msg || data?.message || code}` },
        { status: 502 }
      );
    }
    const taskId = data?.data?.taskId || data?.taskId;
    if (!taskId) {
      await charge.refund();
      return NextResponse.json(
        { error: "Ses üretimi taskId alınamadı" },
        { status: 502 }
      );
    }

    // TTS hızlı — internal polling ile audioUrl bekle (max ~60sn)
    const POLL_MS = 2000;
    const MAX = 30;
    for (let i = 0; i < MAX; i++) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const pollRes = await fetch(
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
        { headers: { Authorization: `Bearer ${process.env.KIE_API_KEY}` }, cache: "no-store" }
      );
      if (!pollRes.ok) continue;
      const pdata = await pollRes.json();
      const state = pdata?.data?.state;
      if (state === "success") {
        const result = pdata?.data?.resultJson || pdata?.data?.result;
        let audioUrl: string | undefined;
        if (typeof result === "string") {
          try {
            const parsed = JSON.parse(result);
            audioUrl =
              parsed?.audio_url ||
              parsed?.audioUrl ||
              parsed?.url ||
              (Array.isArray(parsed?.resultUrls) ? parsed.resultUrls[0] : undefined);
          } catch {
            audioUrl = result;
          }
        } else if (result && typeof result === "object") {
          audioUrl = (result as any).audio_url || (result as any).audioUrl || (result as any).url;
        }
        return NextResponse.json({
          taskId,
          status: "succeeded",
          audioUrl,
          family: "jobs",
        });
      }
      if (state === "fail" || state === "failed") {
        await charge.refund();
        return NextResponse.json(
          { error: pdata?.data?.failMsg || "TTS failed" },
          { status: 502 }
        );
      }
    }
    // Timeout — yine de taskId dön, frontend pollNG ile devam edebilir
    return NextResponse.json({
      taskId,
      status: "running",
      family: "jobs",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    await charge.refund();
    return NextResponse.json(
      { error: `Ses üretimi sırasında hata oluştu: ${msg}` },
      { status: 500 }
    );
  }
}
