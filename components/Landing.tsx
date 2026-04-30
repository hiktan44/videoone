"use client";

import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
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
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Sohbet ederek üret",
    desc: "Türkçe konuş, AI sahne sahne planlasın. Format, süre, ton — sorularla kişiselleştir.",
    accent: "amber",
  },
  {
    icon: Film,
    title: "130+ AI modeli",
    desc: "Veo 3.1, Kling 3.0, Seedance, Sora 2, Hailuo, Runway — hepsi tek arayüzde.",
    accent: "cyan",
  },
  {
    icon: Users,
    title: "Karakter & ses",
    desc: "Anlatıcı, model, müşteri karakterleri yarat. ElevenLabs ve InWorld ile fotogerçekçi ses.",
    accent: "coral",
  },
  {
    icon: Music,
    title: "Suno ile müzik",
    desc: "Sahnelerine uygun arka müzik AI ile üretilsin, otomatik senkronize olsun.",
    accent: "amber",
  },
  {
    icon: Wand2,
    title: "Sinematik timeline",
    desc: "Klipleri sürükle-bırak, kes, geçiş ekle. Profesyonel video editörü deneyimi.",
    accent: "cyan",
  },
  {
    icon: Layers,
    title: "Tek tık export",
    desc: "16:9, 9:16, 1:1 — sosyal medyaya göre dışa aktar. Altyazı otomatik üretilir.",
    accent: "coral",
  },
];

const tiers = [
  {
    name: "Free",
    price: "₺0",
    period: "ücretsiz başla",
    icon: Zap,
    iconColor: "text-amber-400",
    credits: "100 kredi/ay",
    perks: ["5-10 video oluşturma", "Tüm temel modeller", "Türkçe arayüz", "Watermark'sız"],
    cta: "Ücretsiz başla",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ay",
    icon: Crown,
    iconColor: "text-amber-400",
    credits: "5,000 kredi/ay",
    perks: [
      "Sinematik kaliteli modeller",
      "ElevenLabs Premium ses",
      "Öncelikli üretim",
      "Karakter sistemi",
      "Sınırsız MP4 export",
    ],
    cta: "Pro'ya geç",
    highlighted: true,
  },
  {
    name: "Max",
    price: "$49",
    period: "/ay",
    icon: Star,
    iconColor: "text-cyan-400",
    credits: "15,000 kredi/ay",
    perks: [
      "Veo 3.1, Sora 2 Pro, Kling 3",
      "Suno V5 müzik üretimi",
      "Brand kit & şablonlar",
      "API erişimi",
      "Premium destek",
    ],
    cta: "Max'a geç",
    highlighted: false,
  },
];

const faqs = [
  {
    q: "Vibe Studio nasıl çalışıyor?",
    a: "Türkçe bir prompt yazıyorsun (örn. \"İstanbul'da gün batımında 15 saniyelik tanıtım\"). AI sana sorularla yardım ediyor: format, süre, stil. Sonra sahne sahne video, ses ve altyazı üretip timeline'a yerleştiriyor.",
  },
  {
    q: "Hangi AI modellerini kullanıyor?",
    a: "Görsel için Flux, Seedream, Imagen 4. Video için Veo 3.1, Kling 3.0, Seedance, Sora 2, Hailuo. Ses için ElevenLabs, InWorld. Müzik için Suno V5. Hepsi tek API anahtarı ile (Kie.ai).",
  },
  {
    q: "Krediler nasıl harcanıyor?",
    a: "Hız/kalite katmanına göre değişir: Hızlı modda dakikası ~18 kredi, Pro modda ~190, Max modda ~600. 15s tanıtım Pro modda yaklaşık 50 kredi.",
  },
  {
    q: "Türkçe destek var mı?",
    a: "Evet — arayüz Türkçe, AI Türkçe konuşuyor, altyazı Türkçe çıkıyor. AI video modellerine giden prompt'lar İngilizce'ye çevriliyor (kalite için).",
  },
  {
    q: "Ürettiğim videolar ticari kullanılabilir mi?",
    a: "Free planda kişisel kullanım, Pro ve Max planlarında ticari kullanım hakkı dahil. Lansman, reklam, sosyal medya — her yerde kullan.",
  },
];

const accentClasses: Record<string, { bg: string; ring: string; icon: string }> = {
  amber: {
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    icon: "text-amber-400",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    ring: "ring-cyan-500/20",
    icon: "text-cyan-400",
  },
  coral: {
    bg: "bg-coral-500/10",
    ring: "ring-coral-500/20",
    icon: "text-coral-400",
  },
};

export function Landing() {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
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
            <a href="#features" className="hover:text-ink-50 transition-colors">Özellikler</a>
            <a href="#pricing" className="hover:text-ink-50 transition-colors">Fiyatlandırma</a>
            <a href="#faq" className="hover:text-ink-50 transition-colors">SSS</a>
          </nav>
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <button className="text-xs text-ink-200 hover:text-ink-50 px-3 py-1.5 transition-colors">
                Giriş yap
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 px-3 py-1.5 transition-colors shadow-glow-amber">
                Ücretsiz başla
              </button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[700px] bg-gradient-hero pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[700px] grain-overlay pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3.5 py-1.5 text-xs text-amber-300 mb-7">
            <Sparkles className="h-3.5 w-3.5" />
            Türkiye'nin ilk AI video stüdyosu
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Bir cümle yaz, <br />
            <span className="text-gradient">sinematik</span> video üret
          </h1>

          <p className="mt-7 text-lg md:text-xl text-ink-300 max-w-2xl mx-auto leading-relaxed">
            Vibe Studio, Türkçe komutla AI'ın sahne sahne planladığı; video, ses ve altyazıyı bir
            timeline'a yerleştiren video üretim platformu. Veo, Kling, Sora, Suno — hepsi tek yerde.
          </p>

          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <SignUpButton mode="modal">
              <button className="group inline-flex items-center gap-2 rounded-xl bg-gradient-amber text-ink-950 px-7 py-3.5 text-base font-semibold shadow-glow-amber hover:shadow-[0_0_60px_-8px_rgba(245,158,11,0.6)] transition-shadow">
                Hemen başla — 100 kredi hediye
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </SignUpButton>
            <a
              href="#features"
              className="text-sm text-ink-300 hover:text-ink-50 px-5 py-3.5 transition-colors"
            >
              Özellikleri gör →
            </a>
          </div>

          <div className="mt-12 inline-flex items-center gap-5 text-xs text-ink-400">
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-amber-500" />
              Kart bilgisi gerekmez
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-amber-500" />
              Anında üretim
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-amber-500" />
              Türkçe destek
            </span>
          </div>
        </div>

        {/* Decorative glow lines */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400 mb-3">
            Özellikler
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Profesyonel video, <br />
            <span className="text-amber-400">dakikalar içinde</span>
          </h2>
          <p className="mt-4 text-ink-300 text-lg">
            Sahneleme, üretim, edit, export — hepsi otomatik.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const a = accentClasses[f.accent];
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-ink-700 bg-ink-900/60 p-6 hover:border-ink-600 hover:bg-ink-900 transition-all"
              >
                <div
                  className={`h-11 w-11 rounded-xl ${a.bg} ring-1 ${a.ring} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                >
                  <f.icon className={`h-5 w-5 ${a.icon}`} />
                </div>
                <div className="text-base font-semibold text-ink-50">{f.title}</div>
                <p className="mt-2 text-sm text-ink-300 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400 mb-3">
            Fiyatlandırma
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Basit fiyatlandırma</h2>
          <p className="mt-4 text-ink-300 text-lg">
            İhtiyacına göre büyüt. İstediğin zaman iptal et.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={
                t.highlighted
                  ? "relative rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/[0.06] to-ink-900 p-6 shadow-glow-amber"
                  : "rounded-2xl border border-ink-700 bg-ink-900/60 p-6"
              }
            >
              {t.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-ink-950 text-[10px] font-bold uppercase tracking-wider">
                  En popüler
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
              <div className={`mt-1 text-sm font-medium ${t.highlighted ? "text-amber-300" : "text-cyan-300"}`}>
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
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <div className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400 mb-3">
            Yardım
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Sıkça sorulan</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-ink-700 bg-ink-900/60 hover:border-ink-600 transition-colors"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between text-base font-medium text-ink-100 px-5 py-4">
                {f.q}
                <span className="text-ink-400 group-open:text-amber-400 group-open:rotate-180 transition-all">
                  ▾
                </span>
              </summary>
              <p className="px-5 pb-4 text-sm text-ink-300 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="absolute inset-0 bg-gradient-hero opacity-50 rounded-3xl pointer-events-none" />
        <div className="relative">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            İlk videonu <span className="text-gradient">5 dakikada</span> üret
          </h2>
          <p className="mt-4 text-ink-300 text-lg">100 kredi ile başla, kartsız kayıt ol.</p>
          <div className="mt-8">
            <SignUpButton mode="modal">
              <button className="group inline-flex items-center gap-2 rounded-xl bg-gradient-amber text-ink-950 px-7 py-3.5 text-base font-semibold shadow-glow-amber hover:shadow-[0_0_60px_-8px_rgba(245,158,11,0.6)] transition-shadow">
                Ücretsiz başla
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-ink-800 py-10 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ink-400">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-gradient-vibe flex items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 text-ink-950" strokeWidth={2.5} />
            </div>
            © 2026 Vibe Studio · Tüm hakları saklıdır
          </div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-ink-100 transition-colors">Gizlilik</a>
            <a href="#" className="hover:text-ink-100 transition-colors">Kullanım Koşulları</a>
            <a href="mailto:hello@vibestudio.app" className="hover:text-ink-100 transition-colors">
              İletişim
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
