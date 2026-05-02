"use client";

import { useEffect, useState } from "react";

const COOKIE_NAME = "vibe_cookie_consent";

type Consent = {
  necessary: boolean; // her zaman true
  analytics: boolean;
  marketing: boolean;
  ts: number;
};

function readConsent(): Consent | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
    if (!m) return null;
    return JSON.parse(decodeURIComponent(m[1]));
  } catch { return null; }
}

function writeConsent(c: Consent) {
  const val = encodeURIComponent(JSON.stringify(c));
  document.cookie = `${COOKIE_NAME}=${val}; path=/; max-age=${365 * 24 * 60 * 60}; sameSite=Lax`;
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const c = readConsent();
    if (!c) setShow(true);
    else {
      // PostHog opt-out kontrolü vs. gerekirse burada
      if (typeof window !== "undefined" && (window as any).posthog) {
        if (!c.analytics) (window as any).posthog?.opt_out_capturing?.();
      }
    }
  }, []);

  const acceptAll = () => {
    writeConsent({ necessary: true, analytics: true, marketing: true, ts: Date.now() });
    setShow(false);
    if (typeof window !== "undefined") (window as any).posthog?.opt_in_capturing?.();
  };
  const rejectNonEssential = () => {
    writeConsent({ necessary: true, analytics: false, marketing: false, ts: Date.now() });
    setShow(false);
    if (typeof window !== "undefined") (window as any).posthog?.opt_out_capturing?.();
  };
  const saveCustom = () => {
    writeConsent({ necessary: true, analytics, marketing, ts: Date.now() });
    setShow(false);
    if (typeof window !== "undefined") {
      if (analytics) (window as any).posthog?.opt_in_capturing?.();
      else (window as any).posthog?.opt_out_capturing?.();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto rounded-2xl border border-zinc-700 bg-zinc-900/95 backdrop-blur-md shadow-2xl p-5 text-zinc-100">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🍪</div>
          <div className="flex-1">
            <h3 className="text-base font-semibold mb-1">Çerez tercihleri</h3>
            <p className="text-sm text-zinc-300 mb-3">
              Bu site, hizmetin çalışması için zorunlu çerezler ve sizinle ilgili özellikleri
              iyileştirmek için isteğe bağlı analitik çerezler kullanır. Detaylar için{" "}
              <a href="/legal/cookies" className="text-amber-300 hover:underline">Çerez Politikası</a>'na bakın.
            </p>

            {details && (
              <div className="space-y-2 mb-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
                <label className="flex items-start gap-2 opacity-60 cursor-not-allowed">
                  <input type="checkbox" checked disabled className="mt-0.5" />
                  <div>
                    <div className="font-semibold">Zorunlu çerezler</div>
                    <div className="text-zinc-400">Oturum, kimlik doğrulama ve ödeme. Devre dışı bırakılamaz.</div>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-0.5" />
                  <div>
                    <div className="font-semibold">Analitik çerezler</div>
                    <div className="text-zinc-400">Anonim sayfa görüntüleme, özellik kullanım ölçümü (PostHog EU).</div>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5" />
                  <div>
                    <div className="font-semibold">Pazarlama çerezleri</div>
                    <div className="text-zinc-400">Kişiselleştirilmiş kampanya / yeniden hedefleme. Şu an aktif iş ortağımız yok.</div>
                  </div>
                </label>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={acceptAll}
                className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 px-4 py-2 text-sm font-semibold text-white"
              >
                Tümünü kabul et
              </button>
              <button
                onClick={rejectNonEssential}
                className="rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm text-zinc-100"
              >
                Yalnızca zorunlu
              </button>
              {details ? (
                <button onClick={saveCustom} className="rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 text-sm text-amber-200">
                  Tercihlerimi kaydet
                </button>
              ) : (
                <button onClick={() => setDetails(true)} className="rounded-lg border border-zinc-700 hover:bg-zinc-800 px-4 py-2 text-sm text-zinc-300">
                  Detayları göster
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
