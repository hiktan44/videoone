"use client";

import { useState, useEffect } from "react";
import { X, Mic, Loader2, Image as ImageIcon, Volume2, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";

type Props = {
  open: boolean;
  onClose: () => void;
};

const LIPSYNC_MODELS = [
  { display: "Kling AI Avatar Standard", id: "Kling AI Avatar Standard", note: "Hızlı, stabil" },
  { display: "Kling AI Avatar Pro", id: "Kling AI Avatar Pro", note: "Yüksek kalite" },
  { display: "Wan 2.2 A14B Speech-to-Video Turbo", id: "Wan 2.2 A14B Speech-to-Video Turbo", note: "Konuşma odaklı" },
  { display: "Infinitalk From Audio", id: "Infinitalk From Audio", note: "Tam vücut" },
];

export function LipsyncModal({ open, onClose }: Props) {
  const characters = useStore((s) => s.characters);
  const clips = useStore((s) => s.clips);
  const addClip = useStore((s) => s.addClip);
  const addJob = useStore((s) => s.addJob);
  const updateJob = useStore((s) => s.updateJob);
  const settings = useStore((s) => s.settings);

  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [model, setModel] = useState(LIPSYNC_MODELS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioClips = clips.filter((c) => c.trackId === "audio" && c.sourceUrl);

  useEffect(() => {
    if (!open) {
      setImageUrl("");
      setAudioUrl("");
      setCharacterId("");
      setError(null);
    }
  }, [open]);

  // Karakter seçilince avatarUrl otomatik doldur
  useEffect(() => {
    if (!characterId) return;
    const c = characters.find((x) => x.id === characterId);
    if (c && (c as any).avatarUrl) setImageUrl((c as any).avatarUrl);
  }, [characterId, characters]);

  const handleImageUpload = async (file: File) => {
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", "image");
      const res = await fetch("/api/kie/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Görsel yüklenemedi");
        return;
      }
      setImageUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network hatası");
    }
  };

  const handleAudioUpload = async (file: File) => {
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", "audio");
      const res = await fetch("/api/kie/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Ses yüklenemedi");
        return;
      }
      setAudioUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network hatası");
    }
  };

  const submit = async () => {
    if (!imageUrl) {
      setError("Karakter görseli seçilmeli veya yüklenmeli");
      return;
    }
    if (!audioUrl) {
      setError("Ses dosyası seçilmeli veya yüklenmeli");
      return;
    }

    setSubmitting(true);
    setError(null);

    const jobId = addJob({
      kind: "video",
      prompt: `Lipsync — ${model}`,
      status: "running",
    });

    try {
      const res = await fetch("/api/kie/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Character speaking with natural lip sync",
          model,
          imageUrls: [imageUrl],
          audioUrls: [audioUrl],
          aspect_ratio: settings.aspectRatio || "16:9",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        taskId?: string;
        family?: string;
        error?: string;
      };

      if (!res.ok || !data.taskId) {
        updateJob(jobId, {
          status: "failed",
          error: data.error || `Lipsync başarısız (${res.status})`,
        });
        setError(data.error || "Lipsync başarısız");
        setSubmitting(false);
        return;
      }

      updateJob(jobId, {
        taskId: data.taskId,
        status: "running",
        family: data.family,
      });
      // JobPollingSubscriber polling yapar, succeeded olunca timeline'a klip ekler
      onClose();
    } catch (e) {
      updateJob(jobId, {
        status: "failed",
        error: e instanceof Error ? e.message : "Network",
      });
      setError(e instanceof Error ? e.message : "Network hatası");
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-900 shadow-glow-amber max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800 sticky top-0 bg-ink-900 z-10">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-amber-400" />
            <div className="text-sm font-semibold text-ink-50">Dudak Senkronu</div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md hover:bg-ink-800 text-ink-400 hover:text-ink-100 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Açıklama */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-200 leading-relaxed">
            <Sparkles className="h-3.5 w-3.5 inline mr-1" />
            Karakter görseli + ses dosyası seç. AI dudakları sese senkronize ederek konuşan video üretir.
          </div>

          {/* Karakter (opsiyonel) */}
          {characters.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">
                Karakter (opsiyonel)
              </label>
              <select
                value={characterId}
                onChange={(e) => setCharacterId(e.target.value)}
                className="mt-1 w-full bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-amber-500/50"
              >
                <option value="">— Görsel doğrudan yükle —</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Görsel */}
          <div>
            <label className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">
              Karakter Görseli (yüz)
            </label>
            {imageUrl ? (
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-950 p-2">
                <div
                  className="h-12 w-12 rounded-md bg-cover bg-center shrink-0"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                />
                <div className="flex-1 text-[11px] text-ink-300 truncate">{imageUrl}</div>
                <button
                  onClick={() => setImageUrl("")}
                  className="text-[11px] text-coral-300 hover:text-coral-200 px-2"
                >
                  Sil
                </button>
              </div>
            ) : (
              <label className="mt-1 cursor-pointer flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink-700 hover:border-amber-500/40 bg-ink-950 px-3 py-4 text-xs text-ink-400 transition-colors">
                <ImageIcon className="h-4 w-4" />
                Görsel yükle (PNG/JPG)
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f);
                  }}
                />
              </label>
            )}
          </div>

          {/* Ses */}
          <div>
            <label className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">
              Ses Kaynağı
            </label>
            {audioClips.length > 0 && !audioUrl && (
              <div className="mt-1 space-y-1.5 mb-2">
                <div className="text-[10px] text-ink-400">Timeline'daki ses kliplerinden seç:</div>
                {audioClips.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setAudioUrl(c.sourceUrl!)}
                    className="w-full text-left flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-950 hover:bg-ink-800 px-3 py-2 text-xs text-ink-200"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="truncate flex-1">{c.label}</span>
                    <span className="text-[10px] text-ink-500">{c.duration.toFixed(1)}s</span>
                  </button>
                ))}
              </div>
            )}
            {audioUrl ? (
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-950 p-2">
                <Volume2 className="h-4 w-4 text-cyan-400 shrink-0" />
                <div className="flex-1 text-[11px] text-ink-300 truncate">{audioUrl}</div>
                <button
                  onClick={() => setAudioUrl("")}
                  className="text-[11px] text-coral-300 hover:text-coral-200 px-2"
                >
                  Sil
                </button>
              </div>
            ) : (
              <label className="mt-1 cursor-pointer flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink-700 hover:border-cyan-500/40 bg-ink-950 px-3 py-4 text-xs text-ink-400 transition-colors">
                <Volume2 className="h-4 w-4" />
                Ses dosyası yükle (MP3/WAV)
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAudioUpload(f);
                  }}
                />
              </label>
            )}
          </div>

          {/* Model */}
          <div>
            <label className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">
              Lipsync Modeli
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 w-full bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-amber-500/50"
            >
              {LIPSYNC_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display} — {m.note}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-coral-500/30 bg-coral-500/10 px-3 py-2 text-xs text-coral-300">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-ink-800 sticky bottom-0 bg-ink-900">
          <button
            onClick={onClose}
            className="text-xs text-ink-300 hover:text-ink-100 px-3 py-2"
            disabled={submitting}
          >
            İptal
          </button>
          <button
            onClick={submit}
            disabled={submitting || !imageUrl || !audioUrl}
            className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-ink-950 px-4 py-2 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Başlatılıyor...
              </>
            ) : (
              <>
                <Mic className="h-3.5 w-3.5" />
                Lipsync Başlat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
