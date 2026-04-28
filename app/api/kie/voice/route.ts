import { NextResponse } from "next/server";

// Kie.ai ses üretimi uç noktası.
// KIE_API_KEY yoksa mock yanıt döner (geliştirme için).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text ?? "").trim();
  const voiceModel = String(body?.voiceModel ?? "InWorld 1.5 Max");
  const language = String(body?.language ?? "Türkçe");

  if (!text) {
    return NextResponse.json(
      { error: "Seslendirilecek metin boş olamaz" },
      { status: 400 }
    );
  }

  const hasKey = Boolean(process.env.KIE_API_KEY);

  if (!hasKey) {
    // Mock yanıt — taskId ve placeholder audioUrl.
    const taskId = `mock-voice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    return NextResponse.json({
      taskId,
      status: "succeeded",
      audioUrl:
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=",
      mock: true,
    });
  }

  try {
    const res = await fetch("https://api.kie.ai/v1/voice/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
      },
      body: JSON.stringify({ text, voiceModel, language }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Ses üretimi başarısız: ${res.status} ${errText}` },
        { status: 500 }
      );
    }
    const data = await res.json();
    return NextResponse.json({
      taskId: data.taskId || data.id || "unknown",
      status: data.status || "succeeded",
      audioUrl: data.audioUrl || data.resultUrl,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return NextResponse.json(
      { error: `Ses üretimi sırasında hata oluştu: ${msg}` },
      { status: 500 }
    );
  }
}
