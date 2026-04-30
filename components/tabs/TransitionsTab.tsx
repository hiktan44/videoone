"use client";

import { AlphaBanner } from "../AlphaBanner";

const items = [
  "Sola Kaydır",
  "Sağa Kaydır",
  "Siyah Geçiş",
  "Sayfa Çevir",
  "Daire",
  "Doğrusal Bulanıklık",
  "Basit Yakınlaştır",
  "Su Damlası",
  "Glitch",
  "Morf",
];

export function TransitionsTab() {
  return (
    <div>
      <AlphaBanner text="Alpha: Geçişler henüz timeline'a uygulanmıyor — Faz 3B ile aktif olacak." />
      <div className="p-3 space-y-3">
      <p className="text-[12px] text-zinc-400">
        İki sahne arasına eklemek için bir geçiş seçin. Geçişler zaman çizelgesinde otomatik uygulanır.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => (
          <button
            key={it}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 p-3 text-xs text-zinc-200 text-left"
          >
            <div className="aspect-video rounded-md bg-gradient-to-br from-zinc-800 to-zinc-900 mb-2" />
            {it}
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}
