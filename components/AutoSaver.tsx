"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { upsertProject } from "@/lib/persistence";
import { Check, Loader2 } from "lucide-react";

type SaveStatus = "idle" | "pending" | "saved";

/**
 * AutoSaver — Editör sayfasında sessizce çalışan bileşen.
 * clips / characters / chatMessages / settings / currentProjectName / mediaItems
 * değişimlerini izler, 1 saniye debounce ile upsertProject çağırır.
 * Editor top bar'ın yanında küçük "Kaydedildi" göstergesi render eder.
 */
export function AutoSaver() {
  const projectId = useStore((s) => s.projectId);
  const currentProjectName = useStore((s) => s.currentProjectName);
  const clips = useStore((s) => s.clips);
  const characters = useStore((s) => s.characters);
  const chatMessages = useStore((s) => s.chatMessages);
  const mediaItems = useStore((s) => s.mediaItems);
  const settings = useStore((s) => s.settings);
  const exportCurrentAsProject = useStore((s) => s.exportCurrentAsProject);

  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Proje henüz yüklenmemişse kaydetme
    if (!projectId) return;

    // İlk render'da (proje yeni yüklendiğinde) kaydetme — sadece değişimlerde.
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    setStatus("pending");

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const project = exportCurrentAsProject();
        upsertProject(project);
        setStatus("saved");
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => {
          setStatus("idle");
        }, 2000);
      } catch (e) {
        // Sessizce yut
        setStatus("idle");
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    projectId,
    currentProjectName,
    clips,
    characters,
    chatMessages,
    mediaItems,
    settings,
    exportCurrentAsProject,
  ]);

  // Unmount temizliği
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  if (status === "idle") {
    return (
      <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-600">
        Otomatik kayıt açık
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Kaydediliyor...
      </span>
    );
  }

  return (
    <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400">
      <Check className="h-3 w-3" />
      Kaydedildi
    </span>
  );
}
