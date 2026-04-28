"use client";

import Link from "next/link";
import {
  Home,
  Folder,
  Star,
  Share2,
  Layout,
  Tv,
  Globe,
  HelpCircle,
  UserPlus,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

const mainItems = [
  { icon: Home, label: "Ana Sayfa", href: "/" },
  { icon: Folder, label: "Projeler", href: "/" },
  { icon: Star, label: "Yıldızlananlar", href: "/" },
  { icon: Share2, label: "Paylaşılanlar", href: "/" },
];

const resourceItems = [
  { icon: Layout, label: "Şablonlar", href: "/" },
  { icon: Tv, label: "Kanal", href: "/" },
  { icon: Globe, label: "Yayınlanan Şablonlar", href: "/" },
  { icon: HelpCircle, label: "Destek", href: "/" },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-zinc-950 border-r border-zinc-900 h-screen flex flex-col">
      <div className="px-5 pt-6 pb-5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-gradient">Vibe Studio</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3">
        <ul className="space-y-1">
          {mainItems.map((it, i) => (
            <li key={it.label + i}>
              <Link
                href={it.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  i === 0
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                )}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Kaynaklar
        </div>
        <ul className="mt-2 space-y-1">
          {resourceItems.map((it) => (
            <li key={it.label}>
              <Link
                href={it.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-3 pb-5 space-y-3">
        <button className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900/60">
          <UserPlus className="h-4 w-4" />
          Arkadaşını davet et
        </button>

        <button className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white bg-gradient-vibe shadow-lg shadow-purple-500/20">
          <Sparkles className="h-4 w-4" />
          Pro&apos;ya Yükselt
        </button>

        <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-900/60">
          <div className="h-8 w-8 rounded-full bg-gradient-vibe flex items-center justify-center text-sm font-semibold">
            H
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">Hikmet</div>
            <div className="text-[11px] text-zinc-400">86 kredi</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
