"use client";

import { useEffect } from "react";

// Layout'a koyun. Login olmus kullanicida vibe_ref cookie varsa /api/referral'a POST eder
// ve cookie'yi siler. Sessizdir — UI gostermez.
export function ReferralAttribution() {
  useEffect(() => {
    try {
      const m = document.cookie.match(/(?:^|; )vibe_ref=([^;]+)/);
      if (!m) return;
      const code = decodeURIComponent(m[1]);
      if (!code) return;
      fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          // Basari ya da "zaten kullanildi" -> cookie'yi temizle
          if (data?.ok || data?.error) {
            document.cookie = "vibe_ref=; path=/; max-age=0";
          }
        })
        .catch(() => {});
    } catch {}
  }, []);
  return null;
}
