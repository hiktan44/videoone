"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Download, ExternalLink, Loader2, Image as ImageIcon } from "lucide-react";

type RecentJob = {
  id: string;
  kind: string;
  prompt: string;
  resultUrl?: string | null;
  createdAt: string;
};

function isVideo(u?: string | null): boolean {
  return !!u && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);
}
function isImage(u?: string | null): boolean {
  return !!u && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(u);
}

export function RecentGenerations({ limit = 8 }: { limit?: number }) {
  const [jobs, setJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/jobs?limit=${limit}`)
      .then((r) => (r.ok ? r.json() : { jobs: [] }))
      .then((data) => {
        if (cancelled) return;
        const succeeded = (data.jobs || []).filter((j: any) => j.status === "succeeded" && j.resultUrl);
        setJobs(succeeded.slice(0, limit));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [limit]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-ink-400 text-xs px-1 py-3">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Son üretimler yükleniyor...
      </div>
    );
  }

  if (jobs.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-ink-100">Son Üretimleriniz</h3>
        <span className="text-[11px] text-ink-500">{jobs.length} öğe</span>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1">
        {jobs.map((j) => (
          <RecentCard key={j.id} job={j} />
        ))}
      </div>
    </div>
  );
}

function RecentCard({ job }: { job: RecentJob }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hover, setHover] = useState(false);
  const url = job.resultUrl || "";
  const vid = isVideo(url);
  const img = isImage(url);

  const onEnter = () => {
    setHover(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };
  const onLeave = () => {
    setHover(false);
    if (videoRef.current) videoRef.current.pause();
  };

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="group shrink-0 w-56 rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden hover:border-purple-500/50 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/10"
    >
      <div className="aspect-video relative bg-zinc-950 overflow-hidden">
        {vid ? (
          <video
            ref={videoRef}
            src={url}
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : img ? (
          <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-zinc-600" />
          </div>
        )}
        {vid && (
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${hover ? "opacity-0" : "opacity-100"}`}>
            <div className="h-10 w-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
              <Play className="h-4 w-4 text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white uppercase">
          {job.kind}
        </div>
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={url}
            download
            onClick={(e) => e.stopPropagation()}
            title="İndir"
            className="h-6 w-6 rounded bg-black/70 hover:bg-amber-500 text-white hover:text-ink-950 flex items-center justify-center"
          >
            <Download className="h-3 w-3" />
          </a>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Yeni sekmede aç"
            className="h-6 w-6 rounded bg-black/70 hover:bg-cyan-500 text-white flex items-center justify-center"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
      <div className="p-2.5">
        <div className="text-xs text-zinc-200 truncate" title={job.prompt}>
          {job.prompt || "(prompt yok)"}
        </div>
        <div className="text-[10px] text-zinc-500 mt-0.5">
          {new Date(job.createdAt).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
        </div>
      </div>
    </div>
  );
}
