"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import {
  Sparkles,
  ArrowRight,
  Wand2,
  Film,
  MessageSquare,
  Users,
  Music,
  Zap,
  Crown,
  Check,
  Layers,
  Star,
  ShoppingBag,
  GraduationCap,
  Megaphone,
  Mic,
  Clapperboard,
  Hash,
  Play,
  ChevronDown,
} from "lucide-react";
import { useLocale, LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { getTranslation } from "@/lib/i18n";

// ─── Scroll Reveal hook (Intersection Observer) ─────────────────────────────
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, shown] as const;
}

// ─── Animated counter (stat numbers) ────────────────────────────────────────
function CountUp({ to, duration = 1800, suffix = "" }: { to: number; duration?: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const [ref, shown] = useReveal<HTMLSpanElement>();
  useEffect(() => {
    if (!shown) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.floor(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, to, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {val.toLocaleString("tr-TR")}
      {suffix}
    </span>
  );
}

// ─── Reveal wrapper ──────────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: any;
}) {
  const [ref, shown] = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

// ─── Marquee row (models scroll) ─────────────────────────────────────────────
const MODEL_LOGOS = [
  "Veo 3.1",
  "Sora 2",
  "Kling 3.0",
  "Seedance 2",
  "Hailuo 2.3",
  "Wan 2.7",
  "Flux 2",
  "Imagen 4",
  "Seedream 4.5",
  "ElevenLabs",
  "InWorld 1.5",
  "Suno V5",
  "GPT-5",
  "Claude Sonnet 4.6",
  "Gemini 3 Pro",
];

function ModelMarquee() {
  return (
    <div className="relative overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
      <div className="flex gap-3 animate-marquee whitespace-nowrap">
        {[...MODEL_LOGOS, ...MODEL_LOGOS].map((m, i) => (
          <div
            key={i}
            className="shrink-0 rounded-xl border border-ink-700 bg-ink-900/40 px-5 py-3 text-sm font-medium text-ink-100"
          >
            {m}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ICONS for use cases ─────────────────────────────────────────────────────
const USE_ICONS = [Hash, ShoppingBag, GraduationCap, Megaphone, Mic, Clapperboard];

// ─── MAIN LANDING ────────────────────────────────────────────────────────────
export function Landing() {
  const [locale] = useLocale();
  const tr = getTranslation(locale);
  const [demoPrompt, setDemoPrompt] = useState("");

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50 overflow-x-hidden">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <div className="h-7 w-7 rounded-lg bg-gradient-vibe flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-ink-950" strokeWidth={2.5} />
            </div>
            <span className="text-ink-50">Vibe Studio</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-ink-300">
            <a href="#features" className="hover:text-ink-50 transition-colors">
              {tr.nav.features}
            </a>
            <a href="#how" className="hover:text-ink-50 transition-colors">
              {tr.nav.howItWorks}
            </a>
            <a href="#pricing" className="hover:text-ink-50 transition-colors">
              {tr.nav.pricing}
            </a>
            <a href="#faq" className="hover:text-ink-50 transition-colors">
              {tr.nav.faq}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-xs text-ink-200 hover:text-ink-50 px-3 py-1.5 transition-colors">
                  {tr.nav.signin}
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 px-3 py-1.5 transition-colors shadow-glow-amber">
                  {tr.nav.start}
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/app"
                className="text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 px-3 py-1.5 transition-colors shadow-glow-amber inline-flex items-center gap-1"
              >
                Dashboard
                <ArrowRight className="h-3 w-3" />
              </Link>
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 h-[400px] w-[400px] rounded-full bg-amber-500/20 blur-3xl animate-float" />
          <div
            className="absolute top-40 right-20 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute -bottom-20 left-1/3 h-[400px] w-[400px] rounded-full bg-coral-500/15 blur-3xl animate-float"
            style={{ animationDelay: "4s" }}
          />
        </div>
        <div className="absolute inset-x-0 top-0 h-[800px] grain-overlay pointer-events-none opacity-30" />

        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3.5 py-1.5 text-xs text-amber-300 mb-7">
              <Sparkles className="h-3.5 w-3.5" />
              {tr.hero.badge}
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              {tr.hero.titleA} <br />
              <span className="text-gradient">{tr.hero.titleB}</span> {tr.hero.titleC}
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-7 text-lg md:text-xl text-ink-300 max-w-2xl mx-auto leading-relaxed">
              {tr.hero.sub}
            </p>
          </Reveal>

          {/* Mock prompt input */}
          <Reveal delay={350}>
            <div className="mt-10 max-w-2xl mx-auto">
              <div className="rounded-2xl border border-ink-700 bg-ink-900/60 backdrop-blur-md p-3 shadow-glow-amber">
                <textarea
                  value={demoPrompt}
                  onChange={(e) => setDemoPrompt(e.target.value)}
                  placeholder={tr.hero.placeholder}
                  rows={2}
                  className="w-full bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none px-2 py-1 resize-none"
                />
                <div className="flex items-center justify-between mt-2 px-1">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="rounded-md bg-amber-500/15 text-amber-300 px-2 py-0.5">
                      ⚡ {tr.hero.tierFast}
                    </span>
                    <span className="rounded-md bg-cyan-500/15 text-cyan-300 px-2 py-0.5">
                      🏆 {tr.hero.tierPro}
                    </span>
                    <span className="rounded-md bg-coral-500/15 text-coral-300 px-2 py-0.5">
                      ✨ {tr.hero.tierMax}
                    </span>
                  </div>
                  <SignUpButton mode="modal">
                    <button className="rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 px-4 py-1.5 text-xs font-semibold shadow-glow-amber transition-all">
                      <ArrowRight className="h-3.5 w-3.5 inline" />
                    </button>
                  </SignUpButton>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={500}>
            <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
              <SignUpButton mode="modal">
                <button className="group inline-flex items-center gap-2 rounded-xl bg-gradient-amber text-ink-950 px-7 py-3.5 text-base font-semibold shadow-glow-amber hover:shadow-[0_0_60px_-8px_rgba(245,158,11,0.6)] transition-all hover:-translate-y-0.5">
                  {tr.hero.cta}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </SignUpButton>
              <button className="inline-flex items-center gap-2 text-sm text-ink-300 hover:text-ink-50 px-5 py-3.5 transition-colors group">
                <div className="h-8 w-8 rounded-full bg-ink-800 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <Play className="h-3.5 w-3.5 text-amber-400 fill-current ml-0.5" />
                </div>
                {tr.hero.ctaSecondary}
              </button>
            </div>
          </Reveal>

          <Reveal delay={650}>
            <div className="mt-12 inline-flex items-center gap-5 text-xs text-ink-400 flex-wrap justify-center">
              {tr.hero.microcopy.split(" · ").map((m, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-amber-500" />
                  {m}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Bottom gradient line */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      </section>

      {/* STATS */}
      <section className="border-y border-ink-800 bg-ink-900/30">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { n: 24300, s: "+", label: tr.stats.generations },
            { n: 1850, s: "+", label: tr.stats.users },
            { n: 130, s: "+", label: tr.stats.models },
            { n: 99, s: "%", label: tr.stats.uptime },
          ].map((it, i) => (
            <Reveal key={i} delay={i * 80} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-amber-400">
                <CountUp to={it.n} suffix={it.s} />
              </div>
              <div className="mt-1 text-xs text-ink-400">{it.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MODELS MARQUEE */}
      <section className="py-10">
        <Reveal className="text-center mb-2">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
            {tr.models.eyebrow}
          </div>
          <h3 className="mt-2 text-2xl md:text-3xl font-bold">{tr.models.title}</h3>
          <p className="mt-2 text-sm text-ink-400">{tr.models.sub}</p>
        </Reveal>
        <ModelMarquee />
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <Reveal className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400 mb-3">
            {tr.nav.features}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            {tr.features.title} <br />
            <span className="text-amber-400">{tr.features.titleAccent}</span>
          </h2>
          <p className="mt-4 text-ink-300 text-lg">{tr.features.sub}</p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tr.features.list.map((f, i) => {
            const accents = [
              { icon: MessageSquare, color: "amber" },
              { icon: Film, color: "cyan" },
              { icon: Users, color: "coral" },
              { icon: Music, color: "amber" },
              { icon: Wand2, color: "cyan" },
              { icon: Layers, color: "coral" },
            ] as const;
            const a = accents[i] || accents[0];
            const colorMap: Record<string, { bg: string; ring: string; icon: string }> = {
              amber: { bg: "bg-amber-500/10", ring: "ring-amber-500/20", icon: "text-amber-400" },
              cyan: { bg: "bg-cyan-500/10", ring: "ring-cyan-500/20", icon: "text-cyan-400" },
              coral: { bg: "bg-coral-500/10", ring: "ring-coral-500/20", icon: "text-coral-400" },
            };
            const c = colorMap[a.color];
            const Icon = a.icon;
            return (
              <Reveal
                key={i}
                delay={i * 70}
                className="group rounded-2xl border border-ink-700 bg-ink-900/60 p-6 hover:border-ink-600 hover:bg-ink-900 hover:-translate-y-1 transition-all"
              >
                <div
                  className={`h-11 w-11 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`h-5 w-5 ${c.icon}`} />
                </div>
                <div className="text-base font-semibold text-ink-50">{f.title}</div>
                <p className="mt-2 text-sm text-ink-300 leading-relaxed">{f.desc}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-24">
        <Reveal className="text-center mb-16">
          <div className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400 mb-3">
            {tr.howItWorks.eyebrow}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{tr.howItWorks.title}</h2>
        </Reveal>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connector line */}
          <div className="hidden md:block absolute left-[16%] right-[16%] top-12 h-px bg-gradient-to-r from-amber-500/30 via-cyan-500/30 to-coral-500/30" />
          {tr.howItWorks.steps.map((s, i) => (
            <Reveal key={i} delay={i * 150} className="relative text-center">
              <div className="mx-auto h-24 w-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 ring-1 ring-amber-500/20 flex items-center justify-center text-3xl font-bold text-amber-300 mb-5 backdrop-blur-sm relative z-10">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="text-lg font-semibold text-ink-50">{s.title}</div>
              <p className="mt-2 text-sm text-ink-300 leading-relaxed max-w-xs mx-auto">
                {s.desc}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <Reveal className="text-center mb-12">
          <div className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400 mb-3">
            {tr.useCases.eyebrow}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{tr.useCases.title}</h2>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tr.useCases.list.map((u, i) => {
            const Icon = USE_ICONS[i] || Hash;
            return (
              <Reveal
                key={i}
                delay={i * 60}
                className="rounded-xl border border-ink-700 bg-ink-900/40 p-5 hover:border-amber-500/40 hover:bg-ink-900 transition-all group"
              >
                <Icon className="h-5 w-5 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-semibold text-ink-50">{u.title}</div>
                <div className="mt-1 text-xs text-ink-400">{u.desc}</div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <Reveal className="text-center mb-16">
          <div className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400 mb-3">
            {tr.pricing.eyebrow}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{tr.pricing.title}</h2>
          <p className="mt-4 text-ink-300 text-lg">{tr.pricing.sub}</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: "Free",
              icon: Zap,
              iconColor: "text-amber-400",
              price: "₺0",
              period: tr.pricing.free,
              credits: `100 ${tr.pricing.credits}`,
              perks: tr.pricing.perks.free,
              cta: tr.pricing.ctaFree,
              highlighted: false,
            },
            {
              name: "Pro",
              icon: Crown,
              iconColor: "text-amber-400",
              price: "$19",
              period: tr.pricing.perMonth,
              credits: `5,000 ${tr.pricing.credits}`,
              perks: tr.pricing.perks.pro,
              cta: tr.pricing.ctaPro,
              highlighted: true,
            },
            {
              name: "Max",
              icon: Star,
              iconColor: "text-cyan-400",
              price: "$49",
              period: tr.pricing.perMonth,
              credits: `15,000 ${tr.pricing.credits}`,
              perks: tr.pricing.perks.max,
              cta: tr.pricing.ctaMax,
              highlighted: false,
            },
          ].map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 100}
              className={
                t.highlighted
                  ? "relative rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/[0.06] to-ink-900 p-6 shadow-glow-amber hover:-translate-y-1 transition-all"
                  : "rounded-2xl border border-ink-700 bg-ink-900/60 p-6 hover:border-ink-600 hover:-translate-y-1 transition-all"
              }
            >
              {t.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-ink-950 text-[10px] font-bold uppercase tracking-wider">
                  {tr.pricing.popular}
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <t.icon className={`h-5 w-5 ${t.iconColor}`} strokeWidth={2.2} />
                <div className="text-lg font-semibold text-ink-50">{t.name}</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-ink-50">{t.price}</span>
                <span className="text-sm text-ink-400">{t.period}</span>
              </div>
              <div
                className={`mt-1 text-sm font-medium ${t.highlighted ? "text-amber-300" : "text-cyan-300"}`}
              >
                {t.credits}
              </div>
              <ul className="mt-6 space-y-2.5">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-ink-200">
                    <Check
                      className={`h-4 w-4 mt-0.5 shrink-0 ${
                        t.highlighted ? "text-amber-400" : "text-cyan-400"
                      }`}
                      strokeWidth={2.5}
                    />
                    {p}
                  </li>
                ))}
              </ul>
              <SignUpButton mode="modal">
                <button
                  className={
                    t.highlighted
                      ? "mt-7 w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-ink-950 font-semibold px-4 py-3 transition-colors"
                      : "mt-7 w-full rounded-xl border border-ink-600 hover:border-cyan-500/40 hover:bg-ink-800 text-ink-100 font-medium px-4 py-3 transition-all"
                  }
                >
                  {t.cta}
                </button>
              </SignUpButton>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
        <Reveal className="text-center mb-12">
          <div className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400 mb-3">
            {tr.faq.eyebrow}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{tr.faq.title}</h2>
        </Reveal>
        <div className="space-y-3">
          {tr.faq.list.map((f, i) => (
            <Reveal key={f.q} delay={i * 50}>
              <details className="group rounded-xl border border-ink-700 bg-ink-900/60 hover:border-ink-600 transition-colors">
                <summary className="cursor-pointer list-none flex items-center justify-between text-base font-medium text-ink-100 px-5 py-4">
                  <span>{f.q}</span>
                  <ChevronDown className="h-4 w-4 text-ink-400 group-open:text-amber-400 group-open:rotate-180 transition-all" />
                </summary>
                <p className="px-5 pb-4 text-sm text-ink-300 leading-relaxed">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="absolute inset-0 bg-gradient-hero opacity-50 rounded-3xl pointer-events-none" />
        <Reveal className="relative">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            {tr.cta.title} <span className="text-gradient">{tr.cta.titleAccent}</span> {tr.cta.titleEnd}
          </h2>
          <p className="mt-4 text-ink-300 text-lg">{tr.cta.sub}</p>
          <div className="mt-8">
            <SignUpButton mode="modal">
              <button className="group inline-flex items-center gap-2 rounded-xl bg-gradient-amber text-ink-950 px-7 py-3.5 text-base font-semibold shadow-glow-amber hover:shadow-[0_0_60px_-8px_rgba(245,158,11,0.6)] transition-all hover:-translate-y-0.5">
                {tr.cta.btn}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </SignUpButton>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-ink-800 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-md bg-gradient-vibe flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-ink-950" strokeWidth={2.5} />
              </div>
              <span className="text-ink-100 font-semibold">Vibe Studio</span>
            </div>
            <p className="text-ink-400 text-xs leading-relaxed max-w-sm">
              {tr.footer.tagline}. Türkiye'de geliştirildi · KVKK & GDPR uyumlu.
            </p>
            <p className="text-ink-500 text-xs mt-3">© 2026 Vibe Studio</p>
          </div>
          <div>
            <div className="text-ink-100 font-semibold text-xs uppercase tracking-wider mb-3">Hukuki</div>
            <ul className="space-y-2 text-xs text-ink-400">
              <li><a href="/legal/privacy" className="hover:text-ink-100">Gizlilik Politikası</a></li>
              <li><a href="/legal/kvkk" className="hover:text-ink-100">KVKK Aydınlatma</a></li>
              <li><a href="/legal/gdpr" className="hover:text-ink-100">GDPR Notice</a></li>
              <li><a href="/legal/cookies" className="hover:text-ink-100">Çerez Politikası</a></li>
            </ul>
          </div>
          <div>
            <div className="text-ink-100 font-semibold text-xs uppercase tracking-wider mb-3">Şartlar</div>
            <ul className="space-y-2 text-xs text-ink-400">
              <li><a href="/legal/terms" className="hover:text-ink-100">Kullanım Şartları</a></li>
              <li><a href="/legal/refund" className="hover:text-ink-100">İade & Cayma</a></li>
              <li><a href="/legal/dpa" className="hover:text-ink-100">Veri İşleme (DPA)</a></li>
              <li><a href="/legal/imprint" className="hover:text-ink-100">Künye / Impressum</a></li>
            </ul>
          </div>
          <div>
            <div className="text-ink-100 font-semibold text-xs uppercase tracking-wider mb-3">Hesabım</div>
            <ul className="space-y-2 text-xs text-ink-400">
              <li><a href="/settings/brand-kit" className="hover:text-ink-100">Marka Kiti</a></li>
              <li><a href="/settings/privacy" className="hover:text-ink-100">Verilerim & Silme</a></li>
              <li><a href="mailto:destek@videoone.com.tr" className="hover:text-ink-100">Destek</a></li>
              <li><a href="mailto:kvkk@videoone.com.tr" className="hover:text-ink-100">KVKK Talep</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-ink-800 py-4">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-ink-500">
            <span>Made with ❤️ in 🇹🇷 · {tr.footer.copyright}</span>
            <span>Bu site Cloudflare R2 (EU) + Stripe (EU) + Coolify (TR) altyapısı kullanır.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
