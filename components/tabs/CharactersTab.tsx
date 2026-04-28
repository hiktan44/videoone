"use client";

import { useStore } from "@/lib/store";
import { Search, Plus } from "lucide-react";
import clsx from "clsx";

export function CharactersTab() {
  const characters = useStore((s) => s.characters);
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5">
        <Search className="h-3.5 w-3.5 text-zinc-500" />
        <input
          placeholder="Karakter ara..."
          className="flex-1 bg-transparent text-xs placeholder:text-zinc-500 focus:outline-none"
        />
      </div>
      <button className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 px-3 py-2 text-xs text-zinc-200 inline-flex items-center justify-center gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Karakter Ekle
      </button>

      <div className="space-y-2 pt-1">
        {characters.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 p-2.5 cursor-pointer"
          >
            <div
              className={clsx(
                "h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-[11px] font-bold shrink-0",
                c.color
              )}
            >
              {c.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-white truncate">
                {c.name}
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                {c.description}
              </div>
              <div className="mt-1 inline-block text-[10px] rounded bg-zinc-800 text-zinc-300 px-1.5 py-0.5">
                {c.voiceModel}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
