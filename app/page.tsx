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
import { ArrowRight, Sparkles, Zap, Trophy, Plus } from "lucide-react";
import clsx from "clsx";

const tiers = [
  {
    icon: Zap,
    iconColor: "text-amber-400",
    title: "Hızlı",
    desc: "~18 kredi/dk",
    sub: "Hızlı sonuç, taslak çekimler",
  },
  {
    icon: Trophy,
    iconColor: "text-purple-400",
    title: "Pro",
    desc: "~190 kredi/dk",
    sub: "Yüksek kalite, sosyal medya",
  },
  {
    icon: Sparkles,
    iconColor: "text-pink-400",
    title: "Max",
    desc: "~600 kredi/dk",
    sub: "Sinematik kalite, müşteri sunumu",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const projects = useStore((s) => s.projects);
  const setProjects = useStore((s) => s.setProjects);
  const [activeTab, setActiveTab] = useState<"recent" | "templates">("recent");
  const [mounted, setMounted] = useState(false);

  // Login degilse landing page goster
  if (isLoaded && !isSignedIn) {
    return <Landing />;
  }

  const refreshProjects = useCallback(() => {
    const list = withDisplayLabels(loadAllProjects());
    // En yeniye göre sırala
    list.sort((a, b) => b.updatedAt - a.updatedAt);
    setProjects(list);
  }, [setProjects]);

  useEffect(() => {
    seedIfEmpty();
    refreshProjects();
    setMounted(true);
  }, [refreshProjects]);

  const handleNewProject = useCallback(() => {
    const p = makeSampleProject("İsimsiz Vibe");
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

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />

      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-hero pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-8 pt-16 pb-8">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              İyi akşamlar, <span className="text-gradient">Hikmet</span>
            </h1>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs text-purple-200">
              <Sparkles className="h-3.5 w-3.5" />
              Yeni: Kie.ai entegrasyonu 2.0!
              <ArrowRight className="h-3.5 w-3.5" />
            </div>

            <HeroPrompt />

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tiers.map((t) => (
                <button
                  key={t.title}
                  type="button"
                  className="text-left rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 p-4 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <t.icon className={clsx("h-4 w-4", t.iconColor)} />
                    <div className="text-sm font-semibold text-white">
                      {t.title}
                    </div>
                    <div className="text-[11px] text-zinc-400">{t.desc}</div>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1.5">{t.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative max-w-5xl mx-auto px-8 pb-16">
            <div className="flex items-center gap-6 border-b border-zinc-900">
              <button
                onClick={() => setActiveTab("recent")}
                className={clsx(
                  "py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === "recent"
                    ? "text-white border-white"
                    : "text-zinc-500 border-transparent hover:text-zinc-300"
                )}
              >
                Son Projeler
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className={clsx(
                  "py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === "templates"
                    ? "text-white border-white"
                    : "text-zinc-500 border-transparent hover:text-zinc-300"
                )}
              >
                Genel Şablonlar
              </button>
              <div className="flex-1" />
              <button
                onClick={handleNewProject}
                className="text-xs font-semibold inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 bg-gradient-vibe text-white hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3.5 w-3.5" />
                Yeni Proje
              </button>
              <a
                href="#"
                className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1"
              >
                Tüm projeleri gör
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4">
              {mounted && projects.length === 0 && (
                <div className="col-span-full text-center py-12 text-zinc-500 text-sm">
                  Henüz proje yok. Yukarıdaki <span className="text-zinc-300 font-medium">Yeni Proje</span> butonuyla başlayın.
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
          </div>
        </div>
      </main>

      <GenerationPanel />
    </div>
  );
}
