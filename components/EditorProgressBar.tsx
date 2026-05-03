"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle, Film, Search, Ban } from "lucide-react";
import clsx from "clsx";

// Editör üst kısmında mount edilen kompakt ilerleme barı.
// Arka planda çalışan tüm üretim/export işlerini gösterir.
// Tek satır özet + tıklayarak detayları aç/kapat.
type CheckResult = {
  jobLabel: string;
  httpStatus: number;
  status?: string;
  resultUrl?: string;
  error?: string;
  family?: string;
  taskId?: string;
  raw?: any;
};

export function EditorProgressBar() {
  const jobs = useStore((s) => s.jobs);
  const updateJob = useStore((s) => s.updateJob);
  const [expanded, setExpanded] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);

  const checkKie = async (jobId: string, taskId: string, family: string | undefined, label: string) => {
    setChecking(jobId);
    try {
      const isQueue = family === "queue";
      const url = isQueue
        ? `/api/jobs/${taskId}`
        : `/api/kie/poll?taskId=${encodeURIComponent(taskId)}&family=${encodeURIComponent(family || "jobs")}`;
      const r = await fetch(url);
      const data = await r.json().catch(() => ({}));
      const flat = isQueue ? data.job || {} : data;
      const checkRes: CheckResult = {
        jobLabel: label,
        httpStatus: r.status,
        status: flat.status,
        resultUrl: flat.resultUrl || undefined,
        error: flat.error || undefined,
        family,
        taskId,
        raw: data,
      };
      setResult(checkRes);
      // Local güncelle
      if (flat.status === "succeeded" && flat.resultUrl) {
        updateJob(jobId, { status: "succeeded", resultUrl: flat.resultUrl });
      } else if (flat.status === "failed") {
        updateJob(jobId, { status: "failed", error: flat.error });
      }
    } catch (e) {
      setResult({
        jobLabel: label,
        httpStatus: 0,
        error: e instanceof Error ? e.message : "Network hatası",
        taskId,
        family,
      });
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
    <>
    {result && (
      <div
        className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
        onClick={() => setResult(null)}
      >
        <div
          className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
            <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              {result.status === "succeeded" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                : result.status === "failed" ? <XCircle className="h-4 w-4 text-rose-400" />
                : result.status === "running" ? <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                : <Search className="h-4 w-4 text-cyan-400" />}
              Kie Durum Kontrolü
            </div>
            <button
              onClick={() => setResult(null)}
              className="h-8 w-8 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 flex items-center justify-center"
              title="Kapat"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            <div className="text-xs text-zinc-400 truncate">İş: <span className="text-zinc-100">{result.jobLabel}</span></div>
            <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2 text-xs">
              <dt className="text-zinc-500">HTTP</dt>
              <dd className={result.httpStatus >= 200 && result.httpStatus < 300 ? "text-emerald-400" : "text-rose-400"}>
                {result.httpStatus || "Network hatası"}
              </dd>
              <dt className="text-zinc-500">Status</dt>
              <dd className={
                result.status === "succeeded" ? "text-emerald-400 font-semibold" :
                result.status === "failed" ? "text-rose-400 font-semibold" :
                result.status === "running" ? "text-purple-300" : "text-zinc-300"
              }>{result.status || "(yok)"}</dd>
              {result.taskId && <>
                <dt className="text-zinc-500">Task ID</dt>
                <dd className="text-zinc-300 font-mono text-[10px] break-all">{result.taskId}</dd>
              </>}
              {result.family && <>
                <dt className="text-zinc-500">Family</dt>
                <dd className="text-zinc-300">{result.family}</dd>
              </>}
              {result.resultUrl && <>
                <dt className="text-zinc-500">Result</dt>
                <dd>
                  <a href={result.resultUrl} target="_blank" rel="noreferrer" className="text-amber-300 hover:text-amber-200 underline break-all">
                    {result.resultUrl.length > 60 ? result.resultUrl.slice(0, 60) + "…" : result.resultUrl}
                  </a>
                </dd>
              </>}
              {result.error && <>
                <dt className="text-zinc-500">Hata</dt>
                <dd className="text-rose-300 break-words">{result.error}</dd>
              </>}
            </dl>
            <details className="text-[10px] text-zinc-500 mt-3">
              <summary className="cursor-pointer hover:text-zinc-300">Ham yanıt (debug)</summary>
              <pre className="mt-2 bg-zinc-950 border border-zinc-800 rounded p-2 overflow-x-auto max-h-40 text-zinc-400">
                {JSON.stringify(result.raw, null, 2)}
              </pre>
            </details>
            {result.status === "running" && (
              <div className="text-[11px] text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                ✓ Kie gerçekten üretiyor. 1-3 dk içinde sonuçlanmalı.
              </div>
            )}
            {result.status === "succeeded" && (
              <div className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
                ✓ Tamamlandı! Local job güncellendi.
              </div>
            )}
            {result.httpStatus === 404 && (
              <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2">
                ⚠️ Task Kie'de bulunamadı — büyük ihtimalle hayalet job. İptal et ve yeniden dene.
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-800">
            <button
              onClick={() => setResult(null)}
              className="px-4 py-1.5 text-sm rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    )}
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
                    onClick={() => checkKie(j.id, j.taskId!, j.family, j.prompt || j.kind)}
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
    </>
  );
}
