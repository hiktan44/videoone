"use client";

import { AlphaBanner } from "../AlphaBanner";

const items = ["İçeri Solma", "Dışarı Solma", "Siyahtan Yakınlaştır"];

export function EffectsTab() {
  return (
    <div>
      <AlphaBanner text="Alpha: Efektler henüz timeline'a uygulanmıyor — Faz 3B ile aktif olacak." />
      <div className="p-3 space-y-3">
        <p className="text-[12px] text-zinc-400">
          Klipleriniz için sinematik efektler. Bir efekti tıklayarak seçili klibe uygulayın.
        </p>
        <div className="space-y-2">
          {items.map((it) => (
            <button
              key={it}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 p-3 text-xs text-zinc-200 text-left flex items-center gap-3"
            >
              <div className="h-10 w-16 rounded-md bg-gradient-to-br from-purple-500/30 to-pink-500/30" />
              {it}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
