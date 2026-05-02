"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const LS_KEY = "vibe-studio:locale";

export function useLocale(): [Locale, (l: Locale) => void] {
  const [locale, setLocaleState] = useState<Locale>("tr");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LS_KEY) as Locale | null;
    if (saved === "tr" || saved === "en") setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, l);
    }
  };

  return [locale, setLocale];
}

export function LanguageToggle() {
  const [locale, setLocale] = useLocale();
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-ink-700 bg-ink-900/40 p-0.5 text-xs">
      <button
        onClick={() => setLocale("tr")}
        className={
          locale === "tr"
            ? "px-2 py-1 rounded bg-amber-500 text-ink-950 font-semibold"
            : "px-2 py-1 text-ink-300 hover:text-ink-50"
        }
      >
        TR
      </button>
      <button
        onClick={() => setLocale("en")}
        className={
          locale === "en"
            ? "px-2 py-1 rounded bg-amber-500 text-ink-950 font-semibold"
            : "px-2 py-1 text-ink-300 hover:text-ink-50"
        }
      >
        EN
      </button>
    </div>
  );
}

export function LanguageToggleCompact() {
  const [locale, setLocale] = useLocale();
  return (
    <button
      onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
      className="h-8 w-8 rounded-md hover:bg-ink-800 text-ink-400 hover:text-ink-50 flex items-center justify-center transition-colors"
      title={locale === "tr" ? "Switch to English" : "Türkçe'ye geç"}
    >
      <Languages className="h-4 w-4" />
    </button>
  );
}
