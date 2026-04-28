"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { clipsToSrt, downloadAsFile } from "@/lib/srt";
import { SubtitleEditor } from "@/components/SubtitleEditor";
import { Download, Loader2, Sparkles, Volume2 } from "lucide-react";
import clsx from "clsx";

// chatMessages'tan basit cümle ayırıcı — nokta, ünlem, soru işareti.
function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

export function CaptionsTab() {
  const enabled = useStore((s) => s.settings.captionsEnabled);
  const voiceModel = useStore((s) => s.settings.voiceModel);
  const language = useStore((s) => s.settings.language);
  const update = useStore((s) => s.updateSetting);
  const clips = useStore((s) => s.clips);
  const chatMessages = useStore((s) => s.chatMessages);
  const addClip = useStore((s) => s.addClip);
  const removeClip = useStore((s) => s.removeClip);

  const [generating, setGenerating] = useState(false);
  const [voicing, setVoicing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const subtitleClips = useMemo(
    () =>
      clips
        .filter((c) => c.trackId === "subtitle")
        .sort((a, b) => a.startTime - b.startTime),
    [clips]
  );

  // Sahnelerden otomatik altyazı üret.
  function handleAutoGenerate() {
    setGenerating(true);
    setStatus(null);
    try {
      // Mevcut subtitle'ları temizle — yeniden üretim.
      for (const c of subtitleClips) removeClip(c.id);

      // chatMessages'tan içerik topla.
      const source = chatMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => m.content)
        .join(" ");
      const sentences = splitIntoSentences(source);

      if (sentences.length === 0) {
        setStatus("Sohbette altyazıya dönüştürülecek içerik bulunamadı.");
        return;
      }

      let cursor = 0;
      for (const sentence of sentences) {
        // Okuma hızı ~12 karakter/saniye, minimum 1.5 saniye.
        const dur = Math.max(1.5, Number((sentence.length / 12).toFixed(2)));
        addClip({
          trackId: "subtitle",
          label: "Altyazı",
          text: sentence,
          startTime: cursor,
          duration: dur,
          gradient: "from-blue-400 to-blue-600",
        });
        cursor += dur;
      }
      setStatus(`${sentences.length} altyazı oluşturuldu.`);
    } finally {
      setGenerating(false);
    }
  }

  // Tüm altyazılar için SRT indir.
  function handleDownloadSrt() {
    if (subtitleClips.length === 0) {
      setStatus("İndirilecek altyazı yok. Önce altyazı oluşturun.");
      return;
    }
    const srt = clipsToSrt(clips);
    downloadAsFile(srt, "altyazi.srt", "text/plain;charset=utf-8");
    setStatus("SRT dosyası indirildi.");
  }

  // Tüm altyazıları paralel seslendir.
  async function handleVoiceAll() {
    if (subtitleClips.length === 0) {
      setStatus("Seslendirilecek altyazı yok.");
      return;
    }
    setVoicing(true);
    setStatus(null);
    try {
      const results = await Promise.allSettled(
        subtitleClips.map(async (c) => {
          const text = (c.text ?? "").trim();
          if (!text) return { clip: c, audioUrl: null as string | null };
          const res = await fetch("/api/kie/voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voiceModel, language }),
          });
          if (!res.ok) throw new Error("Ses üretimi başarısız");
          const data = await res.json();
          return { clip: c, audioUrl: (data.audioUrl as string) || null };
        })
      );

      let ok = 0;
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const { clip, audioUrl } = r.value;
        if (!audioUrl) continue;
        addClip({
          trackId: "audio",
          label: "TTS: " + (clip.text ?? "").slice(0, 15),
          startTime: clip.startTime,
          duration: clip.duration,
          sourceUrl: audioUrl,
          gradient: "from-emerald-500 to-teal-500",
        });
        ok++;
      }
      setStatus(
        ok > 0
          ? `${ok}/${subtitleClips.length} altyazı seslendirildi.`
          : "Seslendirme tamamlanamadı."
      );
    } catch (e) {
      setStatus(
        e instanceof Error ? e.message : "Seslendirme sırasında hata oluştu."
      );
    } finally {
      setVoicing(false);
    }
  }

  return (
    <div className="p-3 space-y-3">
      {/* Etkinleştir toggle */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
        <div>
          <div className="text-sm font-medium">Altyazıları Etkinleştir</div>
          <div className="text-[11px] text-zinc-500">
            Önizlemede altyazılar video altında gösterilir
          </div>
        </div>
        <button
          onClick={() => update("captionsEnabled", !enabled)}
          className={clsx(
            "relative h-6 w-11 rounded-full transition-colors",
            enabled ? "bg-gradient-vibe" : "bg-zinc-700"
          )}
          aria-label="Altyazıları aç/kapat"
        >
          <span
            className={clsx(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
              enabled ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>

      {/* Aksiyon butonları */}
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={handleAutoGenerate}
          disabled={generating}
          className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-sm text-zinc-100 transition-colors"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-purple-400" />
          )}
          Sahnelerden Otomatik Üret
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownloadSrt}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 transition-colors"
          >
            <Download className="h-4 w-4" />
            SRT İndir
          </button>
          <button
            onClick={handleVoiceAll}
            disabled={voicing}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 text-sm text-zinc-100 transition-colors"
          >
            {voicing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4 text-emerald-400" />
            )}
            Tümünü Seslendir
          </button>
        </div>
      </div>

      {status ? (
        <div className="text-[11px] text-zinc-400 bg-zinc-900/40 border border-zinc-800 rounded-md px-2 py-1.5">
          {status}
        </div>
      ) : null}

      {/* Altyazı listesi */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="text-xs font-medium text-zinc-300">
            Altyazılar
          </div>
          <div className="text-[11px] text-zinc-500">
            {subtitleClips.length} satır
          </div>
        </div>
        {subtitleClips.length === 0 ? (
          <div className="text-[12px] text-zinc-500 text-center py-6 border border-dashed border-zinc-800 rounded-lg">
            Henüz altyazı yok. &quot;Sahnelerden Otomatik Üret&quot; ile
            başlayın.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
            {subtitleClips.map((c) => (
              <SubtitleEditor key={c.id} clip={c} />
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Altyazılar {language} dilinde işlenir. Yazı tipi ve konumu ileriki
        sürümlerde sahne bazında özelleştirilebilir.
      </p>
    </div>
  );
}
