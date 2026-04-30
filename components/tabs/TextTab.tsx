"use client";

import { useState } from "react";
import { Type, AlignLeft, Plus } from "lucide-react";
import { useStore } from "@/lib/store";

export function TextTab() {
  const addClip = useStore((s) => s.addClip);
  const playhead = useStore((s) => s.playhead);
  const [draftHeading, setDraftHeading] = useState("");
  const [draftBody, setDraftBody] = useState("");

  const insertHeading = () => {
    const text = draftHeading.trim();
    if (!text) return;
    addClip({
      trackId: "subtitle",
      label: "Başlık",
      duration: 3,
      startTime: playhead,
      text,
      gradient: "from-amber-500 to-coral-500",
    });
    setDraftHeading("");
  };

  const insertBody = () => {
    const text = draftBody.trim();
    if (!text) return;
    addClip({
      trackId: "subtitle",
      label: "Gövde",
      duration: 4,
      startTime: playhead,
      text,
      gradient: "from-cyan-500 to-amber-500",
    });
    setDraftBody("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 border-b border-ink-800">
        <div className="text-sm font-semibold text-ink-50">Metin Ekle</div>
        <div className="mt-1 text-[11px] text-ink-400">
          Playhead konumuna metin klibi yerleştirilir.
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        {/* Heading */}
        <div className="rounded-xl border border-ink-700 bg-ink-900/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Type className="h-4 w-4 text-amber-400" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-50">Başlık</div>
              <div className="text-[10px] text-ink-400">Büyük, vurgulu üst başlık</div>
            </div>
          </div>
          <textarea
            value={draftHeading}
            onChange={(e) => setDraftHeading(e.target.value)}
            placeholder="Örn. Yeni Sezon Geliyor"
            rows={2}
            className="w-full bg-ink-950 border border-ink-700 rounded-lg px-2.5 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-amber-500/50"
          />
          <button
            onClick={insertHeading}
            disabled={!draftHeading.trim()}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-ink-950 text-xs font-semibold py-2 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Başlık Ekle
          </button>
        </div>

        {/* Body */}
        <div className="rounded-xl border border-ink-700 bg-ink-900/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <AlignLeft className="h-4 w-4 text-cyan-400" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-50">Gövde Metni</div>
              <div className="text-[10px] text-ink-400">Açıklama ve detay metni</div>
            </div>
          </div>
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            placeholder="Örn. Tüm modeller şimdi %30 indirimli"
            rows={3}
            className="w-full bg-ink-950 border border-ink-700 rounded-lg px-2.5 py-2 text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={insertBody}
            disabled={!draftBody.trim()}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-cyan-200 text-xs font-semibold py-2 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Gövde Metni Ekle
          </button>
        </div>
      </div>
    </div>
  );
}
