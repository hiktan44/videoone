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
  Trophy,
  Check,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Sohbet Ederek Üret",
    desc: "Türkçe konuş, AI sahne sahne planla. Format, süre, ton — sorularla kişiselleştir.",
  },
  {
    icon: Film,
    title: "130+ AI Modeli",
    desc: "Veo 3.1, Kling 3.0, Seedance, Sora, Hailuo, Runway — hepsi tek arayüzde.",
  },
  {
    icon: Users,
    title: "Karakter & Ses",
    desc: "Anlatıcı, model, müşteri karakterleri yarat. ElevenLabs / InWorld ile gerçekçi ses.",
  },
  {
    icon: Music,
    title: "Suno ile Müzik",
    desc: "Sahnelerine uygun arka müzik AI ile üretilsin, otomatik senkronize olsun.",
  },
  {
    icon: Wand2,
    title: "Sinematik Timeline",
    desc: "Klipleri sürükle-bırak, kes, geçiş ekle. Profesyonel video editörü deneyimi.",
  },
  {
    icon: Sparkles,
    title: "Tek Tık Export",
    desc: "16:9, 9:16, 1:1 — sosyal medyaya göre dışa aktar. Altyazı otomatik üretilir.",
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
    perks: [
      "5-10 video oluşturma",
      "Tüm temel modeller",
      "Türkçe arayüz",
      "Watermark'sız",
    ],
    cta: "Ücretsiz Başla",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ay",
    icon: Trophy,
    iconColor: "text-purple-400",
    credits: "5,000 kredi/ay",
    perks: [
      "Sinematik kaliteli modeller",
      "ElevenLabs Premium ses",
      "Öncelikli üretim",
      "Karakter sistemi",
      "Mp4 export sınırsız",
    ],
    cta: "Pro'ya Geç",
    highlighted: true,
  },
  {
    name: "Max",
    price: "$49",
    period: "/ay",
    icon: Sparkles,
    iconColor: "text-pink-400",
    credits: "15,000 kredi/ay",
    perks: [
      "Veo 3.1, Sora 2 Pro, Kling 3",
      "Suno V5 müzik üretimi",
      "Brand kit & şablonlar",
      "API erişimi",
      "Premium destek",
    ],
    cta: "Max'a Geç",
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
    a: "Evet — arayüz Türkçe, AI Türkçe konuşuyor, altyazı Türkçe çıkıyor. AI video modellerine gönderilen prompt'lar İngilizce'ye çevriliyor (kalite için).",
  },
  {
    q: "Ürettiğim videolar ticari amaçlı kullanılabilir mi?",
    a: "Free planda kişisel kullanım, Pro ve Max planlarında ticari kullanım hakkı dahil. Lansman, reklam, sosyal medya — her yerde kullan.",
  },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            <span className="text-gradient">Vibe Studio</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white">Özellikler</a>
            <a href="#pricing" className="hover:text-white">Fiyatlandırma</a>
            <a href="#faq" className="hover:text-white">SSS</a>
          </nav>
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <button className="text-xs text-zinc-300 hover:text-white px-3 py-1.5">Giriş yap</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-xs font-semibold rounded-lg bg-gradient-vibe text-white px-3 py-1.5">
                Ücretsiz başla
              </button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-hero pointer-events-none opacity-70" />
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs text-purple-200 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Türkiye'nin ilk AI video stüdyosu
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Bir cümle yaz, <br />
            <span className="text-gradient">sinematik video</span> üret
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            Vibe Studio Türkçe komutla AI sahne sahne planlayan, video, ses ve altyazıyı bir
            timeline'a yerleştiren video üretim platformu. Veo, Kling, Sora, Suno — hepsi tek yerde.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <SignUpButton mode="modal">
              <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-vibe text-white px-6 py-3 text-base font-semibold shadow-lg shadow-purple-500/20 hover:opacity-90">
                Hemen başla — 100 kredi hediye
                <ArrowRight className="h-4 w-4" />
              </button>
            </SignUpButton>
            <a
              href="#features"
              className="text-sm text-zinc-400 hover:text-white px-4 py-3"
            >
              Özellikleri gör
            </a>
          </div>
          <div className="mt-10 text-xs text-zinc-500">
            Kart bilgisi gerekmez · Anında üretim · Türkçe destek
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Profesyonel video, dakikalar içinde
          </h2>
          <p className="mt-3 text-zinc-400">
            Sahneleme, üretim, edit, export — hepsi otomatik.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:bg-zinc-900/60 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-vibe/20 flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5 text-purple-300" />
              </div>
              <div className="text-base font-semibold">{f.title}</div>
              <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Basit fiyatlandırma</h2>
          <p className="mt-3 text-zinc-400">
            İhtiyacına göre büyüt. İstediğin zaman iptal et.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={
                t.highlighted
                  ? "rounded-2xl border-2 border-purple-500 bg-zinc-900 p-6 relative"
                  : "rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
              }
            >
              {t.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-vibe text-white text-[10px] font-semibold">
                  EN POPÜLER
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <t.icon className={`h-5 w-5 ${t.iconColor}`} />
                <div className="text-lg font-semibold">{t.name}</div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{t.price}</span>
                <span className="text-sm text-zinc-500">{t.period}</span>
              </div>
              <div className="mt-1 text-sm text-purple-300">{t.credits}</div>
              <ul className="mt-5 space-y-2">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
              <SignUpButton mode="modal">
                <button
                  className={
                    t.highlighted
                      ? "mt-6 w-full rounded-lg bg-gradient-vibe text-white font-semibold px-4 py-2.5 hover:opacity-90"
                      : "mt-6 w-full rounded-lg border border-zinc-700 text-zinc-200 font-medium px-4 py-2.5 hover:bg-zinc-800"
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
      <section id="faq" className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Sıkça Sorulan</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between text-base font-medium">
                {f.q}
                <span className="text-zinc-500 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          İlk videonu <span className="text-gradient">5 dakikada</span> üret
        </h2>
        <p className="mt-3 text-zinc-400">100 kredi ile başla, kartsız kayıt ol.</p>
        <div className="mt-6">
          <SignUpButton mode="modal">
            <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-vibe text-white px-6 py-3 text-base font-semibold shadow-lg shadow-purple-500/20 hover:opacity-90">
              Ücretsiz başla
              <ArrowRight className="h-4 w-4" />
            </button>
          </SignUpButton>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>© 2026 Vibe Studio. Tüm hakları saklıdır.</div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-zinc-300">Gizlilik</a>
            <a href="#" className="hover:text-zinc-300">Kullanım Koşulları</a>
            <a href="mailto:hello@vibestudio.app" className="hover:text-zinc-300">İletişim</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
