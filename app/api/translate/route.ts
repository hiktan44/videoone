// POST /api/translate
// Body: { text, target: "en"|"tr"|"es"|... , source?: "tr" }
// Doner: { translated: string }

import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/llm";

export const runtime = "nodejs";

const LANG_NAMES: Record<string, string> = {
  tr: "Turkish",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  hi: "Hindi",
  pl: "Polish",
  nl: "Dutch",
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text || "").trim();
    const target = String(body?.target || "en");
    const source = String(body?.source || "auto");

    if (!text) return NextResponse.json({ error: "text gerekli" }, { status: 400 });
    if (!LANG_NAMES[target]) {
      return NextResponse.json({ error: "Geçersiz target dil" }, { status: 400 });
    }

    const targetName = LANG_NAMES[target];
    const sourceName = source !== "auto" ? LANG_NAMES[source] : "the source language";

    const result = await chatCompletion({
      messages: [
        {
          role: "system",
          content: `You are a precise translator. Translate from ${sourceName} to ${targetName}. Preserve tone and meaning. Output ONLY the translated text — no quotes, no explanation, no preamble.`,
        },
        { role: "user", content: text },
      ],
      temperature: 0.2,
    });

    return NextResponse.json({ translated: (result.content || "").trim() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Çeviri hatası" },
      { status: 500 }
    );
  }
}
