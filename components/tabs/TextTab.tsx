"use client";

import { Type, AlignLeft } from "lucide-react";
import { AlphaBanner } from "../AlphaBanner";

export function TextTab() {
  return (
    <div>
      <AlphaBanner text="Alpha: Metin overlay henüz timeline'a uygulanmıyor — Faz 3C ile aktif olacak." />
      <div className="p-3 space-y-3">
      <p className="text-[12px] text-zinc-400">
        Videoya başlık veya gövde metni ekleyin.
      </p>
      <button className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 p-4 text-left">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium">Başlık Ekle</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-500">
          Büyük, vurgulu üst başlık
        </div>
      </button>
      <button className="w-full rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 p-4 text-left">
        <div className="flex items-center gap-2">
          <AlignLeft className="h-4 w-4 text-pink-400" />
          <span className="text-sm font-medium">Gövde Metni Ekle</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-500">
          Açıklama ve detay metni
        </div>
      </button>
      </div>
    </div>
  );
}
