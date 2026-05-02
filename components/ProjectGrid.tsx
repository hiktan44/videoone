"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, Globe, Lock, FileText, Trash2, Loader2 } from "lucide-react";
import clsx from "clsx";

export type GridProject = {
  id: string;
  name: string;
  gradient: string;
  isPublic: boolean;
  starred: boolean;
  isTemplate: boolean;
  thumbnailUrl?: string | null;
  updatedAt: string | Date;
  _count?: { clips: number };
};

type Props = {
  projects: GridProject[];
  emptyText?: string;
  onUpdate?: () => void;
  showActions?: boolean;
};

export function ProjectGrid({
  projects,
  emptyText = "Henüz proje yok.",
  onUpdate,
  showActions = true,
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleStar = async (id: string, current: boolean) => {
    setBusyId(id);
    try {
      await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !current }),
      });
      onUpdate?.();
    } finally {
      setBusyId(null);
    }
  };

  const togglePublic = async (id: string, current: boolean) => {
    setBusyId(id);
    try {
      await fetch(`/api/projects/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !current }),
      });
      onUpdate?.();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`"${name}" projesini silmek istiyor musun?`)) return;
    setBusyId(id);
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      onUpdate?.();
    } finally {
      setBusyId(null);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 text-ink-500 text-sm">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((p) => (
        <div
          key={p.id}
          className="group rounded-xl overflow-hidden border border-ink-700 bg-ink-900/40 hover:border-amber-500/40 transition-all"
        >
          <Link href={`/editor/${p.id}`} className="block">
            <div
              className={clsx(
                "aspect-video relative overflow-hidden",
                !p.thumbnailUrl && `bg-gradient-to-br ${p.gradient}`
              )}
              style={
                p.thumbnailUrl
                  ? { backgroundImage: `url(${p.thumbnailUrl})`, backgroundSize: "cover" }
                  : undefined
              }
            >
              {/* Top corner badges */}
              <div className="absolute top-1.5 left-1.5 flex gap-1">
                {p.starred && (
                  <div className="rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold text-ink-950 inline-flex items-center gap-1">
                    <Star className="h-2.5 w-2.5 fill-current" />
                  </div>
                )}
                {p.isPublic && (
                  <div className="rounded-md bg-cyan-500/90 px-1.5 py-0.5 text-[9px] font-bold text-ink-950 inline-flex items-center gap-1">
                    <Globe className="h-2.5 w-2.5" />
                  </div>
                )}
                {p.isTemplate && (
                  <div className="rounded-md bg-coral-500/90 px-1.5 py-0.5 text-[9px] font-bold text-ink-950 inline-flex items-center gap-1">
                    <FileText className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>
              {p._count?.clips !== undefined && (
                <div className="absolute bottom-1.5 right-1.5 rounded-md bg-ink-950/80 px-1.5 py-0.5 text-[10px] text-ink-100">
                  {p._count.clips} klip
                </div>
              )}
            </div>
          </Link>

          <div className="px-3 py-2 flex items-start justify-between gap-2">
            <Link href={`/editor/${p.id}`} className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink-100 truncate hover:text-amber-300 transition-colors">
                {p.name}
              </div>
              <div className="text-[10px] text-ink-400 mt-0.5">
                {new Date(p.updatedAt).toLocaleDateString("tr-TR")}
              </div>
            </Link>
            {showActions && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleStar(p.id, p.starred);
                  }}
                  disabled={busyId === p.id}
                  className="h-6 w-6 rounded hover:bg-ink-800 flex items-center justify-center"
                  title={p.starred ? "Yıldızı kaldır" : "Yıldızla"}
                >
                  {busyId === p.id ? (
                    <Loader2 className="h-3 w-3 animate-spin text-ink-400" />
                  ) : (
                    <Star
                      className={clsx(
                        "h-3.5 w-3.5",
                        p.starred ? "fill-amber-400 text-amber-400" : "text-ink-400"
                      )}
                    />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    togglePublic(p.id, p.isPublic);
                  }}
                  disabled={busyId === p.id}
                  className="h-6 w-6 rounded hover:bg-ink-800 flex items-center justify-center"
                  title={p.isPublic ? "Yayını kaldır" : "Public yayınla"}
                >
                  {p.isPublic ? (
                    <Globe className="h-3.5 w-3.5 text-cyan-400" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-ink-400" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    remove(p.id, p.name);
                  }}
                  disabled={busyId === p.id}
                  className="h-6 w-6 rounded hover:bg-coral-500/20 flex items-center justify-center"
                  title="Sil"
                >
                  <Trash2 className="h-3.5 w-3.5 text-ink-400 hover:text-coral-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
