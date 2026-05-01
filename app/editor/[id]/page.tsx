"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  loadAllProjects,
  seedIfEmpty,
  setActiveProjectId,
  fetchProjectById,
  apiUpsert,
} from "@/lib/persistence";
import { EditorTopBar } from "@/components/EditorTopBar";
import { EditorTabStrip } from "@/components/EditorTabStrip";
import { VideoPreview } from "@/components/VideoPreview";
import { Timeline } from "@/components/Timeline";
import { AllMediaTab } from "@/components/tabs/AllMediaTab";
import { ChatTab } from "@/components/tabs/ChatTab";
import { CharactersTab } from "@/components/tabs/CharactersTab";
import { StockTab } from "@/components/tabs/StockTab";
import { TransitionsTab } from "@/components/tabs/TransitionsTab";
import { EffectsTab } from "@/components/tabs/EffectsTab";
import { TextTab } from "@/components/tabs/TextTab";
import { CaptionsTab } from "@/components/tabs/CaptionsTab";
import { SettingsTab } from "@/components/tabs/SettingsTab";

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const activeTab = useStore((s) => s.activeTab);
  const projectId = useStore((s) => s.projectId);
  const loadProject = useStore((s) => s.loadProject);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    let cancelled = false;

    (async () => {
      // İlk kez açıldıysa seed et
      seedIfEmpty();

      // 1. Once API'den dene (login varsa); fetchProjectById fallback olarak LS'i de bakar
      let found = await fetchProjectById(params.id);

      // 2. Hiç yoksa anasayfaya don
      if (!found) {
        if (cancelled) return;
        router.push("/");
        return;
      }

      // 3. Eski LS proje ID'siyse (cuid degil) -> DB'ye senkronize et (one-shot migration)
      const looksLikeApiId = /^c[a-z0-9]{20,}$/i.test(found.id);
      if (!looksLikeApiId) {
        // Arka planda API'ye gonder (login varsa); yenisini olusturup yonlendir
        try {
          await apiUpsert(found);
        } catch {}
      }

      if (cancelled) return;
      loadProject(found);
      setActiveProjectId(found.id);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [params?.id, loadProject, router]);

  if (!loaded || projectId !== params?.id) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Proje yükleniyor...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950">
      <EditorTopBar />

      <div className="flex flex-1 overflow-hidden">
        <EditorTabStrip />

        <div className="w-[320px] shrink-0 border-r border-zinc-900 bg-zinc-950 overflow-hidden flex flex-col">
          {renderTab(activeTab)}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <VideoPreview />
          <Timeline />
        </div>
      </div>
    </div>
  );
}

function renderTab(id: string) {
  switch (id) {
    case "media":
      return <AllMediaTab />;
    case "chat":
      return <ChatTab />;
    case "characters":
      return <CharactersTab />;
    case "stock":
      return <StockTab />;
    case "transitions":
      return <TransitionsTab />;
    case "effects":
      return <EffectsTab />;
    case "text":
      return <TextTab />;
    case "captions":
      return <CaptionsTab />;
    case "settings":
      return <SettingsTab />;
    default:
      return <ChatTab />;
  }
}
