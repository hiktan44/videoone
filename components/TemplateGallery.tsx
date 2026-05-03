"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Image as ImageIcon } from "lucide-react";
import clsx from "clsx";
import { BUILTIN_TEMPLATES, templateToProject, type BuiltinTemplate } from "@/lib/builtin-templates";
import { upsertProject } from "@/lib/persistence";
import type { Project } from "@/lib/mocks";

type PublicTemplate = {
  id: string;
  name: string;
  gradient: string;
  templateCategory: string | null;
  thumbnailUrl: string | null;
  settings?: any;
  createdAt: string;
};

function isVideo(u?: string | null): boolean {
  return !!u && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);
}
function isImage(u?: string | null): boolean {
  return !!u && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(u);
}

const ALL_CATEGORY = "Tümü";

export function TemplateGallery() {
  const router = useRouter();
  const [publicTpls, setPublicTpls] = useState<PublicTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/templates/public")
      .then((r) => (r.ok ? r.json() : { templates: [] }))
      .then((d) => { if (!cancelled) setPublicTpls(d.templates || []); })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  // Tüm kategorileri topla (public + builtin)
  const categories = useMemo(() => {
    const set = new Set<string>();
    publicTpls.forEach((t) => t.templateCategory && set.add(t.templateCategory));
    BUILTIN_TEMPLATES.forEach((t) => set.add(t.category));
    return [ALL_CATEGORY, ...Array.from(set).sort()];
  }, [publicTpls]);

  // Aktif kategoriye göre filtrele
  const filteredPublic = activeCategory === ALL_CATEGORY
    ? publicTpls
    : publicTpls.filter((t) => t.templateCategory === activeCategory);
  const filteredBuiltin = activeCategory === ALL_CATEGORY
    ? BUILTIN_TEMPLATES
    : BUILTIN_TEMPLATES.filter((t) => t.category === activeCategory);

  const usePublicTemplate = async (tpl: PublicTemplate) => {
    setBusyId(tpl.id);
    try {
      const r = await fetch(`/api/templates/${tpl.id}/clone`, { method: "POST" });
      if (r.ok) {
        const d = await r.json();
        if (d?.projectId) router.push(`/editor/${d.projectId}`);
      }
    } finally { setBusyId(null); }
  };

  const useBuiltinTemplate = async (tpl: BuiltinTemplate) => {
    setBusyId(tpl.id);
    try {
      const base = templateToProject(tpl);
      const p: Project = { ...base, id: `tpl-${Date.now()}` };
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: p.name, gradient: p.gradient, settings: p.settings }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.project?.id) p.id = data.project.id;
        }
      } catch {}
      upsertProject(p);
      router.push(`/editor/${p.id}`);
    } finally { setBusyId(null); }
  };

  return (
    <div>
      {/* KATEGORİ FİLTRE — kart üstünde kategorinin seçimi */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={clsx(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all whitespace-nowrap",
              activeCategory === cat
                ? "border-amber-500 bg-amber-500 text-ink-950 shadow-glow-amber"
                : "border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-500"
            )}
          >
            {cat}
            {cat !== ALL_CATEGORY && (
              <span className="ml-1.5 text-[10px] opacity-60">
                {(publicTpls.filter((t) => t.templateCategory === cat).length +
                  BUILTIN_TEMPLATES.filter((t) => t.category === cat).length)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* PUBLIC ŞABLONLAR (admin promote etti) */}
      {filteredPublic.length > 0 && (
        <>
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Topluluk Şablonları
            <span className="text-zinc-600 font-normal normal-case">({filteredPublic.length})</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {filteredPublic.map((tpl) => (
              <PublicTemplateCard
                key={tpl.id}
                tpl={tpl}
                busy={busyId === tpl.id}
                onUse={() => usePublicTemplate(tpl)}
              />
            ))}
          </div>
        </>
      )}

      {/* BUILTIN ŞABLONLAR */}
      {filteredBuiltin.length > 0 && (
        <>
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Hazır Şablonlar
            <span className="text-zinc-600 font-normal normal-case">({filteredBuiltin.length})</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredBuiltin.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => useBuiltinTemplate(tpl)}
                disabled={busyId === tpl.id}
                className="group text-left rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:border-purple-500/50 hover:bg-zinc-900/80 transition-all overflow-hidden hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
              >
                <div className={clsx("aspect-[16/10] bg-gradient-to-br relative overflow-hidden", tpl.gradient)}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-semibold text-white">
                    {tpl.category}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="text-white text-base font-bold drop-shadow-lg">{tpl.name}</div>
                    <div className="text-white/80 text-[11px] drop-shadow flex items-center gap-2">
                      <span>{tpl.duration} sn</span>
                      <span>·</span>
                      <span>{tpl.aspectRatio}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-14 w-14 rounded-full bg-white/95 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {busyId === tpl.id ? <Loader2 className="h-5 w-5 text-purple-700 animate-spin" /> : <Play className="h-6 w-6 text-purple-700 ml-0.5" fill="currentColor" />}
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{tpl.description}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {loading && publicTpls.length === 0 && (
        <div className="text-center py-8 text-zinc-500 text-sm flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Şablonlar yükleniyor...
        </div>
      )}
    </div>
  );
}

function PublicTemplateCard({
  tpl,
  busy,
  onUse,
}: {
  tpl: PublicTemplate;
  busy: boolean;
  onUse: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hover, setHover] = useState(false);
  const url = tpl.thumbnailUrl;
  const vid = isVideo(url);
  const img = isImage(url);

  return (
    <button
      onClick={onUse}
      disabled={busy}
      onMouseEnter={() => {
        setHover(true);
        videoRef.current?.play().catch(() => {});
      }}
      onMouseLeave={() => {
        setHover(false);
        if (videoRef.current) videoRef.current.pause();
      }}
      className="group text-left rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:border-emerald-500/50 transition-all overflow-hidden hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1"
    >
      <div className={clsx("aspect-[16/10] relative overflow-hidden", !url && `bg-gradient-to-br ${tpl.gradient}`)}>
        {vid ? (
          <video ref={videoRef} src={url!} muted loop playsInline className={clsx("absolute inset-0 w-full h-full object-cover transition-transform duration-500", hover && "scale-105")} />
        ) : img ? (
          <img src={url!} alt={tpl.name} className={clsx("absolute inset-0 w-full h-full object-cover transition-transform duration-500", hover && "scale-110")} />
        ) : (
          <ImageIcon className="absolute inset-0 m-auto h-10 w-10 text-white/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {tpl.templateCategory && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-500 text-[10px] font-bold text-white">
            {tpl.templateCategory}
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-emerald-300">
          ✓ Topluluk
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <div className="text-white text-base font-bold drop-shadow-lg truncate">{tpl.name}</div>
        </div>
        {vid && (
          <div className={clsx("absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity", hover && "opacity-0")}>
            <div className="h-12 w-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
              {busy ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Play className="h-5 w-5 text-white ml-0.5" fill="white" />}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
