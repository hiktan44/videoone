"use client";

import {
  Image as ImageIcon,
  MessageSquare,
  User,
  Package,
  ArrowLeftRight,
  Sparkles,
  Type,
  Captions,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";

export const EDITOR_TABS = [
  { id: "media", icon: ImageIcon, label: "Tüm Medya" },
  { id: "chat", icon: MessageSquare, label: "Sohbet" },
  { id: "characters", icon: User, label: "Karakterler" },
  { id: "stock", icon: Package, label: "Stok" },
  { id: "transitions", icon: ArrowLeftRight, label: "Geçişler" },
  { id: "effects", icon: Sparkles, label: "Efektler" },
  { id: "text", icon: Type, label: "Metin" },
  { id: "captions", icon: Captions, label: "Altyazılar" },
  { id: "settings", icon: Settings, label: "Ayarlar" },
] as const;

export function EditorTabStrip() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);

  return (
    <div className="w-[60px] shrink-0 border-r border-zinc-900 bg-zinc-950 flex flex-col py-2">
      {EDITOR_TABS.map((t) => {
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            title={t.label}
            className={clsx(
              "relative h-12 mx-1.5 my-0.5 rounded-lg flex items-center justify-center transition-colors",
              active
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-white hover:bg-zinc-900"
            )}
          >
            {active ? (
              <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-gradient-vibe" />
            ) : null}
            <t.icon className="h-[18px] w-[18px]" />
          </button>
        );
      })}
    </div>
  );
}
