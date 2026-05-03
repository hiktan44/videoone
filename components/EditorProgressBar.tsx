"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle, Film, Search, Ban } from "lucide-react";
import clsx from "clsx";

// Editör üst kısmında mount edilen kompakt ilerleme barı.
// Arka planda çalışan tüm üretim/export işlerini gösterir.
// Tek satır özet + tıklayarak detayları aç/kapat.
export function EditorProgressBar() {
  const jobs = useStore((s) => s.jobs);
  const updateJob = useStore((s) => s.updateJob);
  const [expanded, setExpanded] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);

  const checkKie = async (jobId: string, taskId: string, family: string | undefined) => {
    setChecking(jobId);
    try {
      // Queue jobs için /api/jobs/[id], değilse /api/kie/poll
      const isQueue = family === "queue";
      const url = isQueue
        ? `/api/jobs/${taskId}`
        : `/api/kie/poll?taskId=${encodeURIComponent(taskId)}&family=${encodeURIComponent(family || "jobs")}`;
      const r = await fetch(url);
      const data = await r.json().catch(() => ({}));
      const summary = isQueue
        ? `Status: ${data.job?.status || "?"}\nProgress: ${data.job?.progress ?? "?"}%\nResultURL: ${data.job?.resultUrl || "yok"}\nError: ${data.job?.error || "yok"}`
        : `Status: ${data.status || "?"}\nResultURL: ${data.resultUrl || "yok"}\nError: ${data.error || "yok"}\nFamily: ${family}\nTaskID: ${taskId}`;
      alert(`Kie/Queue Durumu:\n\n${summary}\n\nHTTP ${r.status}`);
      // Eğer succeeded ise local'i de güncelle
      if (data.status === "succeeded" || data.job?.status === "succeeded") {
        updateJob(jobId, { status: "succeeded", resultUrl: data.resultUrl || data.job?.resultUrl });
      } else if (data.status === "failed" || data.job?.status === "failed") {
        updateJob(jobId, { status: "failed", error: data.error || data.job?.error });
      }
    } catch (e) {
      alert(`Kontrol hatası: ${e instanceof Error ? e.message : "?"}`);
    } finally {
      setChecking(null);
    }
  };

  const cancelLocal = (jobId: string) => {
    if (!confirm("Bu job'ı yerel olarak iptal etmek istediğine emin misin? (Kie'deki gerçek task etkilenmez, sadece UI'dan kaldırılır)")) return;
    updateJob(jobId, { status: "failed", error: "Kullanıcı tarafından iptal edildi" });
  };

  // Son 30 dk içindeki + aktif/biten işler
  const recent = jobs
    .filter((j) => j.createdAt > Date.now() - 30 * 60 * 1000)
    .sort((a, b) => b.createdAt - a.createdAt);

  const running = recent.filter((j) => j.status === "running" || j.status === "idle");
  const succeeded = recent.filter((j) => j.status === "succeeded");
  const failed = recent.filter((j) => j.status === "failed");

  if (recent.length === 0) return null;

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-zinc-900/50"
      >
        <Film className="h-4 w-4 text-purple-400 shrink-0" />

        {running.length > 0 ? (
          <>
            <Loader2 className="h-3.5 w-3.5 text-purple-400 animate-spin shrink-0" />
            <span className="text-xs text-zinc-200">
              <strong className="text-purple-300">{running.length}</strong> üretim devam ediyor
              {succeeded.length > 0 && <span className="text-zinc-500"> · {succeeded.length} tamamlandı</span>}
              {failed.length > 0 && <span className="text-rose-400"> · {failed.length} başarısız</span>}
            </span>
          </>
        ) : failed.length > 0 ? (
          <>
            <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            <span className="text-xs text-zinc-200">
              <strong className="text-rose-300">{failed.length}</strong> üretim başarısız oldu
              {succeeded.length > 0 && <span className="text-zinc-500"> · {succeeded.length} tamamlandı</span>}
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs text-zinc-200">
              <strong className="text-emerald-300">{succeeded.length}</strong> üretim tamamlandı
            </span>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {running.length > 0 && (
            <div className="hidden sm:block w-32 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{
                  width: `${
                    Math.round(
                      ((succeeded.length + failed.length) /
                        Math.max(1, succeeded.length + failed.length + running.length)) *
                        100
                    )
                  }%`,
                }}
              />
            </div>
          )}
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3 max-h-48 overflow-y-auto">
          {running.length > 1 && (
            <div className="flex items-center justify-end mb-1">
              <button
                onClick={() => {
                  if (confirm(`${running.length} aktif job iptal edilsin mi? (yerel UI'dan kaldırılır)`)) {
                    running.forEach((j) => updateJob(j.id, { status: "failed", error: "Toplu iptal" }));
                  }
                }}
                className="text-[10px] text-rose-300 hover:text-rose-200 inline-flex items-center gap-1"
              >
                <Ban className="h-2.5 w-2.5" />
                Tümünü iptal et ({running.length})
              </button>
            </div>
          )}
          <ul className="space-y-1 text-xs">
            {recent.slice(0, 12).map((j) => (
              <li key={j.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-900/50">
                {j.status === "running" || j.status === "idle" ? (
                  <Loader2 className="h-3 w-3 text-purple-400 animate-spin shrink-0" />
                ) : j.status === "succeeded" ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 text-rose-400 shrink-0" />
                )}
                <span className="text-[10px] uppercase text-zinc-500 shrink-0">{j.kind}</span>
                <span className="text-zinc-200 truncate flex-1">{j.prompt || "(prompt yok)"}</span>
                {j.taskId && (
                  <span className="text-[9px] text-zinc-600 font-mono shrink-0" title={`taskId: ${j.taskId}\nfamily: ${j.family || "?"}`}>
                    {(j.taskId as string).slice(0, 8)}…
                  </span>
                )}
                {j.error ? (
                  <span className="text-rose-400 text-[10px] truncate max-w-[30%]" title={j.error}>
                    {j.error.slice(0, 40)}
                  </span>
                ) : null}
                {(j.status === "running" || j.status === "idle") && j.taskId && (
                  <button
                    onClick={() => checkKie(j.id, j.taskId!, j.family)}
                    disabled={checking === j.id}
                    title="Kie'ye sor — bu task gerçekten çalışıyor mu?"
                    className="shrink-0 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 disabled:opacity-50"
                  >
                    {checking === j.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Search className="h-2.5 w-2.5" />}
                    Kontrol
                  </button>
                )}
                {(j.status === "running" || j.status === "idle") && (
                  <button
                    onClick={() => cancelLocal(j.id)}
                    title="Bu job'ı yerel olarak iptal et"
                    className="shrink-0 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300"
                  >
                    <Ban className="h-2.5 w-2.5" />
                  </button>
                )}
                {j.status === "succeeded" && j.resultUrl && (
                  <a
                    href={j.resultUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-amber-300 hover:text-amber-200 shrink-0"
                  >
                    İndir
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
