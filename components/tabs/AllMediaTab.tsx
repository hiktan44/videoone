"use client";

import { useStore } from "@/lib/store";
import { Plus, Image as ImageIcon, Mic, Music, Video } from "lucide-react";
import clsx from "clsx";

const addButtons = [
  { icon: ImageIcon, label: "Yeni Görsel" },
  { icon: Mic, label: "Yeni Konuşma" },
  { icon: Music, label: "Yeni Ses" },
  { icon: Video, label: "Yeni Video" },
];

export function AllMediaTab() {
  const items = useStore((s) => s.mediaItems);
  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {addButtons.map((b) => (
          <button
            key={b.label}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 px-3 py-2.5 text-xs text-zinc-200 inline-flex items-center gap-1.5 justify-center"
          >
            <Plus className="h-3.5 w-3.5" />
            {b.label}
          </button>
        ))}
      </div>

      <div className="text-[11px] uppercase tracking-wider text-zinc-500 px-1 pt-2">
        Medya kütüphanesi
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900/40 hover:border-zinc-700 cursor-pointer"
          >
            <div
              className={clsx(
                "aspect-video bg-gradient-to-br relative",
                m.gradient
              )}
            >
              <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                {m.duration}
              </div>
            </div>
            <div className="p-2 text-[11px] text-zinc-200 truncate">
              {m.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
