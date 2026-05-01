"use client";

import { useState, useEffect } from "react";
import { X, Download, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useStore } from "@/lib/store";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ExportModal({ open, onClose }: Props) {
  const projectId = useStore((s) => s.projectId);
  const settings = useStore((s) => s.settings);
  const [resolution, setResolution] = useState<"720p" | "1080p">("1080p");
  const [aspectRatio, setAspectRatio] = useState(settings.aspectRatio || "16:9");
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "running" | "succeeded" | "failed">("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // SSE stream subscription
  useEffect(() => {
    if (!jobId || status === "succeeded" || status === "failed") return;
    const es = new EventSource(`/api/jobs/${jobId}/stream`);
    es.addEventListener("progress", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        if (typeof data.progress === "number") setProgress(data.progress);
        if (data.status) setStatus(data.status);
        if (data.resultUrl) setResultUrl(data.resultUrl);
        if (data.error) setError(data.error);
      } catch {}
    });
    es.addEventListener("done", () => es.close());
    es.onerror = () => es.close();
    return () => es.close();
  }, [jobId, status]);

  const start = async () => {
    if (!projectId) {
      setError("Önce bir projeyi kaydet");
      return;
    }
    setError(null);
    setStatus("running");
    setProgress(0);
    try {
      const res = await fetch(`/api/projects/${projectId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution, aspectRatio }),
      });
      const data = await res.json();
      if (!res.ok || !data.jobId) {
        setError(data.error || "Export başlatılamadı");
        setStatus("idle");
        return;
      }
      setJobId(data.jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network hatası");
      setStatus("idle");
    }
  };

  const reset = () => {
    setJobId(null);
    setProgress(0);
    setStatus("idle");
    setResultUrl(null);
    setError(null);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 shadow-glow-amber"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-amber-400" />
            <div className="text-sm font-semibold text-ink-50">Videoyu Dışa Aktar</div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md hover:bg-ink-800 text-ink-400 hover:text-ink-100 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {status === "idle" && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">
                  Çözünürlük
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["720p", "1080p"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setResolution(r)}
                      className={
                        resolution === r
                          ? "rounded-lg border-2 border-amber-500 bg-amber-500/5 px-3 py-2 text-sm font-medium text-amber-200"
                          : "rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-300 hover:border-ink-600"
                      }
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">
                  Format
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["16:9", "9:16", "1:1"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setAspectRatio(r)}
                      className={
                        aspectRatio === r
                          ? "rounded-lg border-2 border-cyan-500 bg-cyan-500/5 px-3 py-2 text-xs font-medium text-cyan-200"
                          : "rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-xs text-ink-300 hover:border-ink-600"
                      }
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-coral-500/30 bg-coral-500/10 px-3 py-2 text-xs text-coral-300">
                  {error}
                </div>
              )}
            </>
          )}

          {(status === "running" || status === "succeeded" || status === "failed") && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {status === "running" && <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />}
                {status === "succeeded" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {status === "failed" && <XCircle className="h-4 w-4 text-coral-400" />}
                <div className="text-sm text-ink-100">
                  {status === "running" && "Video işleniyor..."}
                  {status === "succeeded" && "Export tamamlandı!"}
                  {status === "failed" && "Export başarısız"}
                </div>
                <div className="ml-auto text-xs text-ink-400 tabular-nums">{progress}%</div>
              </div>

              <div className="h-2 rounded-full bg-ink-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-amber transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {error && (
                <div className="rounded-lg border border-coral-500/30 bg-coral-500/10 px-3 py-2 text-xs text-coral-300">
                  {error}
                </div>
              )}

              {status === "succeeded" && resultUrl && (
                <a
                  href={resultUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="block w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 px-4 py-2.5 text-sm font-semibold text-center transition-colors"
                >
                  MP4 İndir
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-ink-800">
          {status === "idle" ? (
            <>
              <button
                onClick={onClose}
                className="text-xs text-ink-300 hover:text-ink-100 px-3 py-2"
              >
                İptal
              </button>
              <button
                onClick={start}
                className="text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 px-4 py-2 transition-colors"
              >
                Export Başlat
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (status === "running") {
                  onClose();
                } else {
                  reset();
                }
              }}
              className="text-xs font-semibold rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-100 px-4 py-2 transition-colors"
            >
              {status === "running" ? "Arkaplanda devam etsin" : "Yeni Export"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
