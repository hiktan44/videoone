"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, Sparkles, ExternalLink, FilmIcon } from "lucide-react";
import clsx from "clsx";
import { useStore, type GenerationJob } from "@/lib/store";
import { JobPollingSubscriber } from "./JobPollingSubscriber";
import { makeSampleProject, type TimelineClip } from "@/lib/mocks";
import { upsertProject } from "@/lib/persistence";

function kindLabel(kind: GenerationJob["kind"]): string {
  if (kind === "video") return "Video";
  if (kind === "image") return "Görsel";
  return "Ses";
}

function statusLabel(status: GenerationJob["status"]): string {
  if (status === "running") return "Üretiliyor";
  if (status === "succeeded") return "Tamamlandı";
  if (status === "failed") return "Başarısız";
  return "Bekliyor";
}

function StatusIcon({ status }: { status: GenerationJob["status"] }) {
  if (status === "running" || status === "idle") {
    return <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />;
  }
  if (status === "succeeded") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  }
  return <XCircle className="h-4 w-4 text-rose-400" />;
}

function shortenPrompt(p: string, max = 56): string {
  if (!p) return "(prompt yok)";
  return p.length > max ? p.slice(0, max - 1) + "…" : p;
}

export function GenerationPanel() {
  const jobs = useStore((s) => s.jobs);
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const openInEditor = (job: GenerationJob) => {
    if (!job.resultUrl) return;
    // Yeni proje olustur, uretilen sonucu timeline'a klip olarak ekle
    const project = makeSampleProject(job.prompt.slice(0, 40) || "Yeni Üretim");
    const clip: TimelineClip = {
      id: `clip-${Date.now()}`,
      trackId: "video",
      label: job.prompt.slice(0, 24) || "Üretilen klip",
      startTime: 0,
      duration: 5,
      sourceUrl: job.resultUrl,
      gradient: "from-purple-500 to-pink-500",
    };
    project.clips = [clip];
    upsertProject(project);
    router.push(`/editor/${project.id}`);
  };

  // İzlenen aktif job'lar için polling — panel mount olduğu sürece çalışır.
  const pollingJobs = jobs.filter(
    (j) => j.taskId && (j.status === "running" || j.status === "idle")
  );

  if (!jobs || jobs.length === 0) return null;

  const active = jobs.filter((j) => j.status === "running" || j.status === "idle").length;
  const ordered = [...jobs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

  return (
    <>
      {pollingJobs.map((j) => (
        <JobPollingSubscriber
          key={j.id}
          jobId={j.id}
          taskId={j.taskId!}
          prompt={j.prompt}
          family={j.family}
        />
      ))}
      <div className="fixed bottom-4 right-4 z-50 w-[320px] max-w-[calc(100vw-2rem)]">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-md shadow-2xl shadow-black/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Paneli aç" : "Paneli daralt (silmez)"}
          className="w-full flex items-center justify-between px-3 py-2 border-b border-zinc-900 hover:bg-zinc-900/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-zinc-200">
              Üretim Kuyruğu
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              {active > 0 ? `${active} aktif` : `${jobs.length} toplam`}
            </span>
          </div>
          {collapsed ? (
            <ChevronUp className="h-3.5 w-3.5 text-zinc-500" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
          )}
        </button>

        {!collapsed && (
          <ul className="max-h-[360px] overflow-y-auto scrollbar-thin divide-y divide-zinc-900">
            {ordered.map((job) => (
              <li key={job.id} className="px-3 py-2.5 flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  <StatusIcon status={job.status} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                      {kindLabel(job.kind)}
                    </span>
                    <span
                      className={clsx(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        job.status === "succeeded" && "bg-emerald-500/10 text-emerald-400",
                        job.status === "failed" && "bg-rose-500/10 text-rose-400",
                        (job.status === "running" || job.status === "idle") &&
                          "bg-purple-500/10 text-purple-300"
                      )}
                    >
                      {statusLabel(job.status)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-200 truncate">
                    {shortenPrompt(job.prompt)}
                  </div>
                  {job.error && (
                    <div className="mt-0.5 text-[11px] text-rose-400/90 truncate">
                      {job.error}
                    </div>
                  )}
                  {job.status === "succeeded" && job.resultUrl && (
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openInEditor(job)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-gradient-vibe rounded px-2 py-0.5 hover:opacity-90"
                      >
                        <FilmIcon className="h-3 w-3" />
                        Editörde Aç
                      </button>
                      <a
                        href={job.resultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Aç
                      </a>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        </div>
      </div>
    </>
  );
}
