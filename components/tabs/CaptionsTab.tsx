"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { clipsToSrt, downloadAsFile } from "@/lib/srt";
import { SubtitleEditor } from "@/components/SubtitleEditor";
import { Download, Loader2, Sparkles, Volume2, Mic } from "lucide-react";
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
  const [transcribing, setTranscribing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [voiceLanguage, setVoiceLanguage] = useState(language);

  const VOICE_LANGUAGES = [
    { code: "Türkçe", label: "Türkçe (TR)" },
    { code: "English", label: "English (EN)" },
    { code: "Español", label: "Español (ES)" },
    { code: "Français", label: "Français (FR)" },
    { code: "Deutsch", label: "Deutsch (DE)" },
    { code: "Italiano", label: "Italiano (IT)" },
    { code: "Português", label: "Português (PT)" },
    { code: "Русский", label: "Русский (RU)" },
    { code: "日本語", label: "日本語 (JA)" },
    { code: "한국어", label: "한국어 (KO)" },
    { code: "中文", label: "中文 (ZH)" },
    { code: "العربية", label: "العربية (AR)" },
  ];

  const audioClips = useMemo(
    () => clips.filter((c) => c.trackId === "audio" && c.sourceUrl),
    [clips]
  );

  // Whisper ile audio'yu sesten transkripte et
  async function handleWhisperTranscribe() {
    const targetClip = audioClips[0];
    if (!targetClip?.sourceUrl) {
      setStatus("Önce timeline'a bir ses klibi ekleyin (Tümünü Seslendir veya yükleyin).");
      return;
    }
    setTranscribing(true);
    setStatus(null);
    try {
      const res = await fetch("/api/captions/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: targetClip.sourceUrl, language: "tr" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || `Transkripsiyon hatası ${res.status}`);
        return;
      }
      const items: Array<{ start: number; end: number; text: string }> = data.items || [];
      if (items.length === 0) {
        setStatus("Transkript boş döndü.");
        return;
      }
      // Mevcut subtitle'ları temizle
      for (const c of subtitleClips) removeClip(c.id);
      // Yeni transkriptlerle doldur
      for (const it of items) {
        const dur = Math.max(1, it.end - it.start);
        addClip({
          trackId: "subtitle",
          label: "Altyazı",
          text: it.text,
          startTime: targetClip.startTime + it.start,
          duration: dur,
          gradient: "from-cyan-400 to-amber-500",
        });
      }
      setStatus(`✓ ${items.length} altyazı segmenti üretildi.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Transkripsiyon başarısız");
    } finally {
      setTranscribing(false);
    }
  }

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
      const langCodeMap: Record<string, string> = {
        Türkçe: "tr", English: "en", Español: "es", Français: "fr",
        Deutsch: "de", Italiano: "it", Português: "pt", Русский: "ru",
        日本語: "ja", 한국어: "ko", 中文: "zh", العربية: "ar",
      };
      const sourceCode = langCodeMap[language] || "tr";
      const targetCode = langCodeMap[voiceLanguage] || sourceCode;

      const results = await Promise.allSettled(
        subtitleClips.map(async (c) => {
          let text = (c.text ?? "").trim();
          if (!text) return { clip: c, audioUrl: null as string | null };

          // Hedef dil kaynak dilden farklıysa önce translate et
          if (targetCode !== sourceCode) {
            try {
              const tr = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, source: sourceCode, target: targetCode }),
              });
              const trData = await tr.json();
              if (tr.ok && trData.translated) text = trData.translated;
            } catch {
              // çeviri patlarsa orijinal metin kullanılır
            }
          }

          const res = await fetch("/api/kie/voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voiceModel, language: voiceLanguage }),
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
          onClick={handleWhisperTranscribe}
          disabled={transcribing || audioClips.length === 0}
          className="flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 text-sm text-amber-200 font-medium transition-colors"
          title={audioClips.length === 0 ? "Önce timeline'a bir ses klibi ekle" : ""}
        >
          {transcribing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mic className="h-4 w-4 text-amber-400" />
          )}
          Sesten Whisper ile Üret
        </button>

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

        <div>
          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            Seslendirme Dili
          </label>
          <select
            value={voiceLanguage}
            onChange={(e) => setVoiceLanguage(e.target.value)}
            className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/40"
          >
            {VOICE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
                {l.code !== language ? " — otomatik çevir" : ""}
              </option>
            ))}
          </select>
          {voiceLanguage !== language && (
            <div className="mt-1 text-[10px] text-cyan-300">
              ℹ️ Altyazılar {language} dilinde, ses {voiceLanguage} olarak çevrilip üretilecek.
            </div>
          )}
        </div>

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
            Seslendir
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
