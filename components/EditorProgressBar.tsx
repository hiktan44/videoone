"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle, Film } from "lucide-react";
import clsx from "clsx";

// Editör üst kısmında mount edilen kompakt ilerleme barı.
// Arka planda çalışan tüm üretim/export işlerini gösterir.
// Tek satır özet + tıklayarak detayları aç/kapat.
export function EditorProgressBar() {
  const jobs = useStore((s) => s.jobs);
  const [expanded, setExpanded] = useState(false);

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
                {j.error ? (
                  <span className="text-rose-400 text-[10px] truncate max-w-[40%]" title={j.error}>
                    {j.error.slice(0, 50)}
                  </span>
                ) : null}
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
