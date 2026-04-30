// POST /api/captions/transcribe
// Body: { audioUrl: string, language?: string }
// Doner: { items: [{ start, end, text }], srt: string }
//
// Kie.ai'da ElevenLabs Speech-to-Text endpointi (jobs/elevenlabs/speech-to-text) ile
// audio URL'sini transkripte ediyoruz.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const KIE_BASE = "https://api.kie.ai";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.KIE_API_KEY) {
    return NextResponse.json({ error: "KIE_API_KEY tanımlı değil" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const audioUrl = String(body.audioUrl || "");
  const language = String(body.language || "tr");
  if (!audioUrl) {
    return NextResponse.json({ error: "audioUrl gerekli" }, { status: 400 });
  }

  // 1. Job olustur
  let taskId: string;
  try {
    const createRes = await fetch(`${KIE_BASE}/api/v1/jobs/createTask`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "elevenlabs/speech-to-text",
        input: { audio: audioUrl, language },
      }),
    });
    if (!createRes.ok) {
      const txt = await createRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Kie create ${createRes.status}: ${txt.slice(0, 200)}` },
        { status: 502 }
      );
    }
    const data = await createRes.json();
    taskId = data?.data?.taskId || data?.taskId;
    if (!taskId) {
      return NextResponse.json({ error: "Kie taskId alinamadi" }, { status: 502 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Kie create hata" },
      { status: 502 }
    );
  }

  // 2. Polling — STT genelde 10-60sn surer
  const MAX_TRIES = 60;
  const POLL_MS = 3000;
  for (let i = 0; i < MAX_TRIES; i++) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    try {
      const pollRes = await fetch(
        `${KIE_BASE}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
        {
          headers: { Authorization: `Bearer ${process.env.KIE_API_KEY}` },
          cache: "no-store",
        }
      );
      if (!pollRes.ok) continue;
      const data = await pollRes.json();
      const state = data?.data?.state;
      if (state === "success") {
        const result = data?.data?.resultJson || data?.data?.result;
        const segments: Array<{ start: number; end: number; text: string }> =
          parseSegments(result);
        return NextResponse.json({
          items: segments,
          srt: toSrt(segments),
          fullText: segments.map((s) => s.text).join(" "),
        });
      }
      if (state === "fail" || state === "failed") {
        return NextResponse.json({ error: data?.data?.failMsg || "STT failed" }, { status: 502 });
      }
    } catch {
      // gecici hata, devam
    }
  }
  return NextResponse.json({ error: "Transkripsiyon zaman aşımı" }, { status: 504 });
}

// Kie.ai sonucunu segmentlere parse eder
function parseSegments(result: unknown): Array<{ start: number; end: number; text: string }> {
  if (!result) return [];
  let parsed: any = result;
  if (typeof result === "string") {
    try {
      parsed = JSON.parse(result);
    } catch {
      return [{ start: 0, end: 0, text: result }];
    }
  }
  if (Array.isArray(parsed?.segments)) {
    return parsed.segments.map((s: any) => ({
      start: Number(s.start || 0),
      end: Number(s.end || 0),
      text: String(s.text || "").trim(),
    }));
  }
  if (Array.isArray(parsed?.words)) {
    // word-level → 5 sn'lik bloklarda grupla
    const groups: Array<{ start: number; end: number; text: string }> = [];
    let cur = { start: 0, end: 0, text: "" };
    for (const w of parsed.words) {
      const wStart = Number(w.start || 0);
      const wEnd = Number(w.end || 0);
      const wText = String(w.text || w.word || "");
      if (cur.text === "") {
        cur.start = wStart;
      }
      cur.text += (cur.text ? " " : "") + wText;
      cur.end = wEnd;
      if (cur.end - cur.start > 5) {
        groups.push(cur);
        cur = { start: 0, end: 0, text: "" };
      }
    }
    if (cur.text) groups.push(cur);
    return groups;
  }
  if (typeof parsed?.text === "string") {
    return [{ start: 0, end: 0, text: parsed.text }];
  }
  return [];
}

function toSrt(segments: Array<{ start: number; end: number; text: string }>): string {
  return segments
    .map((s, i) => {
      const num = i + 1;
      const ts = (sec: number) => {
        const ms = Math.floor((sec - Math.floor(sec)) * 1000);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const ss = Math.floor(sec % 60);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
      };
      return `${num}\n${ts(s.start)} --> ${ts(s.end)}\n${s.text}\n`;
    })
    .join("\n");
}
