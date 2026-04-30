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

type NavItem = {
  icon: typeof Home;
  label: string;
  href?: string;
  disabled?: boolean;
};

const mainItems: NavItem[] = [
  { icon: Home, label: "Ana Sayfa", href: "/" },
  { icon: Folder, label: "Projeler", disabled: true },
  { icon: Star, label: "Yıldızlananlar", disabled: true },
  { icon: Share2, label: "Paylaşılanlar", disabled: true },
];

const resourceItems: NavItem[] = [
  { icon: Layout, label: "Şablonlar", disabled: true },
  { icon: Tv, label: "Kanal", disabled: true },
  { icon: Globe, label: "Yayınlanan Şablonlar", disabled: true },
  { icon: HelpCircle, label: "Destek", disabled: true },
];

function NavRow({ item, active }: { item: NavItem; active?: boolean }) {
  const base = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm w-full";
  if (item.disabled) {
    return (
      <button
        type="button"
        title="Yakında"
        disabled
        className={clsx(
          base,
          "text-zinc-600 cursor-not-allowed opacity-60 hover:bg-transparent"
        )}
      >
        <item.icon className="h-4 w-4" />
        <span className="flex-1 text-left">{item.label}</span>
        <span className="text-[9px] uppercase tracking-wide text-zinc-600">
          yakında
        </span>
      </button>
    );
  }
  return (
    <Link
      href={item.href || "/"}
      className={clsx(
        base,
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

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
              <NavRow item={it} active={i === 0} />
            </li>
          ))}
        </ul>

        <div className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Kaynaklar
        </div>
        <ul className="mt-2 space-y-1">
          {resourceItems.map((it) => (
            <li key={it.label}>
              <NavRow item={it} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-3 pb-5 space-y-3">
        <button
          type="button"
          title="Yakında"
          disabled
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 opacity-60 cursor-not-allowed"
        >
          <UserPlus className="h-4 w-4" />
          Arkadaşını davet et
        </button>

        <button
          type="button"
          title="Yakında"
          disabled
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white bg-gradient-vibe shadow-lg shadow-purple-500/20 opacity-70 cursor-not-allowed"
        >
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
