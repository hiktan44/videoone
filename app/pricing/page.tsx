"use client";

import { useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Check, Zap, Crown, Star, ArrowLeft, Loader2 } from "lucide-react";

const tiers = [
  {
    id: "free" as const,
    name: "Free",
    price: "₺0",
    period: "ücretsiz",
    icon: Zap,
    iconColor: "text-amber-400",
    credits: "100 kredi/ay",
    perks: [
      "5-10 video oluşturma",
      "Tüm temel modeller",
      "Türkçe arayüz",
      "Watermark'sız",
    ],
    cta: "Mevcut planın",
    highlighted: false,
  },
  {
    id: "pro" as const,
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
    id: "max" as const,
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

export default function PricingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (planId: "pro" | "max") => {
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Checkout başlatılamadı");
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network hatası");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      {/* Header */}
      <header className="border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-ink-300 hover:text-ink-50">
            <ArrowLeft className="h-4 w-4" />
            Ana Sayfa
          </Link>
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <div className="h-7 w-7 rounded-lg bg-gradient-vibe flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-ink-950" strokeWidth={2.5} />
            </div>
            Vibe Studio
          </Link>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400 mb-3">
            Fiyatlandırma
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Basit fiyatlandırma. <br />
            <span className="text-amber-400">İptal ücretsiz.</span>
          </h1>
          <p className="mt-4 text-ink-300 text-lg">
            İhtiyacına göre büyüt. İstediğin zaman iptal et.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 rounded-lg border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div
              key={t.id}
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
              {t.id === "free" ? (
                <button
                  disabled
                  className="mt-7 w-full rounded-xl border border-ink-700 text-ink-400 font-medium px-4 py-3 cursor-default"
                >
                  {t.cta}
                </button>
              ) : !isLoaded ? (
                <button disabled className="mt-7 w-full rounded-xl bg-ink-800 text-ink-400 px-4 py-3">
                  Yükleniyor...
                </button>
              ) : !isSignedIn ? (
                <SignInButton mode="modal">
                  <button
                    className={
                      t.highlighted
                        ? "mt-7 w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-ink-950 font-semibold px-4 py-3 transition-colors"
                        : "mt-7 w-full rounded-xl border border-ink-600 hover:border-cyan-500/40 hover:bg-ink-800 text-ink-100 font-medium px-4 py-3 transition-all"
                    }
                  >
                    Giriş yap ve {t.cta.toLowerCase()}
                  </button>
                </SignInButton>
              ) : (
                <button
                  onClick={() => checkout(t.id as "pro" | "max")}
                  disabled={loading === t.id}
                  className={
                    t.highlighted
                      ? "mt-7 w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-ink-950 font-semibold px-4 py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      : "mt-7 w-full rounded-xl border border-ink-600 hover:border-cyan-500/40 hover:bg-ink-800 text-ink-100 font-medium px-4 py-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  }
                >
                  {loading === t.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Yönlendiriliyor...
                    </>
                  ) : (
                    t.cta
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-ink-500">
          Ödemeler Stripe ile güvenle işlenir · Her plan istediğin zaman iptal edilebilir
        </div>
      </main>
    </div>
  );
}
