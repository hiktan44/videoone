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
  Crown,
} from "lucide-react";
import clsx from "clsx";
import { Show, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";

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
  const base = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm w-full transition-colors";
  if (item.disabled) {
    return (
      <button
        type="button"
        title="Yakında"
        disabled
        className={clsx(
          base,
          "text-ink-500 cursor-not-allowed opacity-70 hover:bg-transparent"
        )}
      >
        <item.icon className="h-4 w-4" />
        <span className="flex-1 text-left">{item.label}</span>
        <span className="text-[9px] uppercase tracking-wider text-ink-500/80 font-semibold">
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
          ? "bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/20"
          : "text-ink-300 hover:text-ink-50 hover:bg-ink-800/60"
      )}
    >
      <item.icon className={clsx("h-4 w-4", active && "text-amber-400")} />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-ink-950 border-r border-ink-800 h-screen flex flex-col">
      <div className="px-5 pt-6 pb-5 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <div className="h-7 w-7 rounded-lg bg-gradient-vibe flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-ink-950" strokeWidth={2.5} />
          </div>
          <span className="text-ink-50">Vibe Studio</span>
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

        <div className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">
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
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-500 opacity-70 cursor-not-allowed"
        >
          <UserPlus className="h-4 w-4" />
          Arkadaşını davet et
        </button>

        <Link
          href="/pricing"
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink-950 bg-gradient-amber shadow-glow-amber hover:shadow-[0_0_60px_-8px_rgba(245,158,11,0.6)] transition-shadow"
        >
          <Crown className="h-4 w-4" strokeWidth={2.2} />
          Pro&apos;ya Yükselt
        </Link>

        <Show when="signed-in">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-ink-800/60 transition-colors">
            <UserButton />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-amber-300 font-medium">86 kredi</div>
            </div>
          </div>
        </Show>
        <Show when="signed-out">
          <div className="flex flex-col gap-2">
            <SignInButton mode="modal">
              <button className="w-full rounded-lg border border-ink-700 hover:border-cyan-500/40 hover:bg-ink-800 px-3 py-2 text-xs text-ink-200 font-medium transition-all">
                Giriş yap
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 px-3 py-2 text-xs font-semibold transition-colors shadow-glow-amber">
                Hesap oluştur
              </button>
            </SignUpButton>
          </div>
        </Show>
      </div>
    </aside>
  );
}
