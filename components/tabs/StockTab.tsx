"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";
import { AlphaBanner } from "../AlphaBanner";

const tabs = ["Görseller", "Videolar", "Müzik"];
const gradients = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-rose-500",
  "from-fuchsia-500 to-purple-500",
  "from-sky-500 to-blue-500",
];

export function StockTab() {
  const [active, setActive] = useState(tabs[0]);
  return (
    <div className="flex flex-col h-full">
      <AlphaBanner text="Alpha: Pexels arama henüz canlı API'ye bağlı değil. Faz 3A ile aktif olacak." />
      <div className="p-3 space-y-3 flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-1 text-xs">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={clsx(
              "px-2.5 py-1 rounded-md transition-colors",
              active === t
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-zinc-500" />
          <input
            placeholder="Aramak için yazın..."
            className="flex-1 bg-transparent text-xs placeholder:text-zinc-500 focus:outline-none"
          />
        </div>
        <button className="rounded-lg bg-gradient-vibe text-white text-xs px-3 py-1.5 font-medium">
          Ara
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto scrollbar-thin">
        {gradients.map((g, i) => (
          <div
            key={i}
            className={clsx(
              "rounded-lg border border-zinc-800 aspect-video bg-gradient-to-br cursor-pointer hover:opacity-80",
              g
            )}
          />
        ))}
      </div>

      <div className="text-[10px] text-zinc-500 text-center pt-1">
        Pexels tarafından desteklenmektedir
      </div>
      </div>
    </div>
  );
}
