"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Sidebar } from "@/components/Sidebar";
import { HeroPrompt } from "@/components/HeroPrompt";
import { ProjectCard } from "@/components/ProjectCard";
import { GenerationPanel } from "@/components/GenerationPanel";
import { Landing } from "@/components/Landing";
import { useStore } from "@/lib/store";
import {
  seedIfEmpty,
  loadAllProjects,
  withDisplayLabels,
  upsertProject,
  deleteProject,
} from "@/lib/persistence";
import { makeSampleProject, type Project } from "@/lib/mocks";
import { BUILTIN_TEMPLATES, templateToProject, type BuiltinTemplate } from "@/lib/builtin-templates";
import { RecentGenerations } from "@/components/RecentGenerations";
import { ArrowRight, Sparkles, Zap, Trophy, Plus, Play } from "lucide-react";
import clsx from "clsx";

const tiers = [
  {
    icon: Zap,
    title: "Hızlı",
    desc: "~18 kredi/dk",
    sub: "Hızlı sonuç, taslak çekimler",
    // Sarı tema
    bg: "bg-gradient-to-br from-amber-400/15 to-amber-500/5",
    ring: "ring-amber-400/40",
    iconColor: "text-amber-500",
    titleColor: "text-amber-600 dark:text-amber-400",
    hover: "hover:from-amber-400/25 hover:to-amber-500/10 hover:ring-amber-400/60",
  },
  {
    icon: Trophy,
    title: "Pro",
    desc: "~190 kredi/dk",
    sub: "Yüksek kalite, sosyal medya",
    // Lacivert tema
    bg: "bg-gradient-to-br from-indigo-500/15 to-blue-600/5",
    ring: "ring-indigo-500/40",
    iconColor: "text-indigo-500",
    titleColor: "text-indigo-600 dark:text-indigo-300",
    hover: "hover:from-indigo-500/25 hover:to-blue-600/10 hover:ring-indigo-500/60",
  },
  {
    icon: Sparkles,
    title: "Max",
    desc: "~600 kredi/dk",
    sub: "Sinematik kalite, müşteri sunumu",
    // Kırmızı/turuncu tema
    bg: "bg-gradient-to-br from-rose-500/15 to-orange-500/5",
    ring: "ring-rose-500/40",
    iconColor: "text-rose-500",
    titleColor: "text-rose-600 dark:text-rose-300",
    hover: "hover:from-rose-500/25 hover:to-orange-500/10 hover:ring-rose-500/60",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const projects = useStore((s) => s.projects);
  const setProjects = useStore((s) => s.setProjects);
  const [activeTab, setActiveTab] = useState<"recent" | "templates">("recent");
  const [mounted, setMounted] = useState(false);

  const refreshProjects = useCallback(async () => {
    // Önce LS'den hızlıca göster (ilk render için)
    const local = withDisplayLabels(loadAllProjects());
    local.sort((a, b) => b.updatedAt - a.updatedAt);
    setProjects(local);
    // Sonra DB'den çek ve birleştir (DB > LS — en güncel hali)
    try {
      const r = await fetch("/api/projects");
      if (r.ok) {
        const data = await r.json();
        const dbProjects: Project[] = (data.projects || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          gradient: p.gradient,
          createdAt: new Date(p.createdAt).getTime(),
          updatedAt: new Date(p.updatedAt).getTime(),
          clips: p.clips || [],
          characters: [],
          chatMessages: [],
          mediaItems: [],
          settings: p.settings || {},
          thumbnailUrl: p.thumbnailUrl,
        }));
        // Local + DB merge (DB id'leri öncelikli)
        const dbIds = new Set(dbProjects.map((p) => p.id));
        const merged = [
          ...dbProjects,
          ...local.filter((p) => !dbIds.has(p.id)),
        ];
        const labeled = withDisplayLabels(merged);
        labeled.sort((a, b) => b.updatedAt - a.updatedAt);
        setProjects(labeled);
      }
    } catch {}
  }, [setProjects]);

  useEffect(() => {
    if (!isSignedIn) return;
    seedIfEmpty();
    refreshProjects();
    setMounted(true);
  }, [isSignedIn, refreshProjects]);

  const handleUseTemplate = useCallback(
    async (tpl: BuiltinTemplate) => {
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
      refreshProjects();
      router.push(`/editor/${p.id}`);
    },
    [router, refreshProjects]
  );

  const handleNewProject = useCallback(async () => {
    const p = makeSampleProject("İsimsiz Vibe");
    // Login varsa API'den cuid al
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
    refreshProjects();
    router.push(`/editor/${p.id}`);
  }, [router, refreshProjects]);

  const handleDelete = useCallback(
    (id: string) => {
      if (typeof window === "undefined") return;
      const ok = window.confirm("Bu projeyi silmek istediğinize emin misiniz?");
      if (!ok) return;
      deleteProject(id);
      refreshProjects();
    },
    [refreshProjects]
  );

  // Tum hook'lardan SONRA conditional return (Rules of Hooks)
  if (!isLoaded) {
    return <div className="h-screen bg-zinc-950" />;
  }
  if (!isSignedIn) {
    return <Landing />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      <Sidebar />

      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-hero pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-8 pt-16 pb-8">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-ink-50">
              İyi akşamlar, <span className="text-gradient">Hikmet</span>
            </h1>

            <HeroPrompt />

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tiers.map((t) => (
                <button
                  key={t.title}
                  type="button"
                  className={clsx(
                    "tier-card text-left rounded-xl ring-1 p-4 transition-all hover:-translate-y-0.5",
                    t.bg,
                    t.ring,
                    t.hover
                  )}
                >
                  <div className="flex items-center gap-2">
                    <t.icon className={clsx("h-5 w-5", t.iconColor)} strokeWidth={2.4} />
                    <div className={clsx("text-base font-bold", t.titleColor)}>{t.title}</div>
                    <div className="text-[11px] text-ink-400 ml-auto font-medium">{t.desc}</div>
                  </div>
                  <div className="text-xs text-ink-300 mt-1.5">{t.sub}</div>
                </button>
              ))}
            </div>

            {/* Son Üretimler — kullanıcının başarılı job'ları */}
            <RecentGenerations limit={8} />
          </div>

          <div className="relative max-w-5xl mx-auto px-8 pb-16">
            <div className="flex items-center gap-6 border-b border-ink-800">
              <button
                onClick={() => setActiveTab("recent")}
                className={clsx(
                  "py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === "recent"
                    ? "text-amber-300 border-amber-500"
                    : "text-ink-400 border-transparent hover:text-ink-200"
                )}
              >
                Son Projeler
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className={clsx(
                  "py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === "templates"
                    ? "text-amber-300 border-amber-500"
                    : "text-ink-400 border-transparent hover:text-ink-200"
                )}
              >
                Genel Şablonlar
              </button>
              <div className="flex-1" />
              <button
                onClick={handleNewProject}
                className="text-xs font-semibold inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-ink-950 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                Yeni Proje
              </button>
              <a
                href="#"
                className="text-xs text-ink-400 hover:text-ink-100 inline-flex items-center gap-1"
              >
                Tüm projeleri gör
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>

            {activeTab === "recent" ? (
              <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                {mounted && projects.length === 0 && (
                  <div className="col-span-full text-center py-12 text-ink-400 text-sm">
                    Henüz proje yok. Yukarıdaki <span className="text-amber-300 font-medium">Yeni Proje</span> butonuyla başlayın
                    veya <span className="text-amber-300 font-medium">Genel Şablonlar</span>'dan birini seçin.
                  </div>
                )}
                {projects.map((p: Project) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                {BUILTIN_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleUseTemplate(tpl)}
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
                          <Play className="h-6 w-6 text-purple-700 ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{tpl.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <GenerationPanel />
    </div>
  );
}
