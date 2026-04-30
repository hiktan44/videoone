"use client";

import { useStore } from "@/lib/store";
import type { Effect } from "@/lib/mocks";
import clsx from "clsx";
import {
  Sparkles,
  Sunrise,
  Sunset,
  ZoomIn,
  Vibrate,
  Aperture,
  Sun,
  Moon,
  Film,
} from "lucide-react";

const items: { id: Effect; label: string; desc: string; Icon: typeof Sparkles; color: string }[] = [
  { id: "fade-in", label: "İçeri Solma", desc: "Klip yumuşak başlasın", Icon: Sunrise, color: "text-amber-400" },
  { id: "fade-out", label: "Dışarı Solma", desc: "Klip yumuşak bitsin", Icon: Sunset, color: "text-coral-400" },
  { id: "zoom-out-from-black", label: "Siyahtan Yakınlaştır", desc: "Sahne karadan açılır", Icon: Aperture, color: "text-amber-400" },
  { id: "zoom-in", label: "Yakınlaştırma", desc: "Yavaşça yakınlaş", Icon: ZoomIn, color: "text-cyan-400" },
  { id: "shake", label: "Sallama", desc: "Hafif kamera titremesi", Icon: Vibrate, color: "text-coral-400" },
  { id: "vignette", label: "Vinyet", desc: "Köşeleri karartır", Icon: Moon, color: "text-ink-300" },
  { id: "color-grade-warm", label: "Sıcak Tonlama", desc: "Amber/turuncu hava", Icon: Sun, color: "text-amber-400" },
  { id: "color-grade-cool", label: "Soğuk Tonlama", desc: "Mavi/cyan hava", Icon: Aperture, color: "text-cyan-400" },
  { id: "film-grain", label: "Film Grain", desc: "Sinematik dane efekti", Icon: Film, color: "text-ink-200" },
];

export function EffectsTab() {
  const selectedClipId = useStore((s) => s.selectedClipId);
  const clips = useStore((s) => s.clips);
  const updateClip = useStore((s) => s.updateClip);

  const selected = clips.find((c) => c.id === selectedClipId);
  const currentEffects: Effect[] = selected?.effects || [];

  const toggle = (id: Effect) => {
    if (!selectedClipId) return;
    const next = currentEffects.includes(id)
      ? currentEffects.filter((e) => e !== id)
      : [...currentEffects, id];
    updateClip(selectedClipId, { effects: next });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 border-b border-ink-800">
        <div className="text-sm font-semibold text-ink-50">Efektler</div>
        {selected ? (
          <div className="mt-1 text-[11px] text-ink-400">
            <span className="text-amber-300">{selected.label}</span> klibine efekt uygula (birden fazla seçilebilir)
          </div>
        ) : (
          <div className="mt-1 text-[11px] text-ink-400">
            Timeline'dan bir klibe tıkla, sonra efekt seç.
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
        {items.map((it) => {
          const active = currentEffects.includes(it.id);
          return (
            <button
              key={it.id}
              onClick={() => toggle(it.id)}
              disabled={!selectedClipId}
              className={clsx(
                "w-full rounded-lg p-3 text-xs text-left flex items-center gap-3 transition-all",
                active
                  ? "border-2 border-amber-500 bg-amber-500/5"
                  : "border border-ink-700 bg-ink-900/40 hover:border-ink-600 hover:bg-ink-900",
                !selectedClipId && "opacity-40 cursor-not-allowed"
              )}
            >
              <div className="h-10 w-10 rounded-lg bg-ink-800 flex items-center justify-center shrink-0">
                <it.Icon className={clsx("h-5 w-5", it.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={clsx("font-medium", active ? "text-amber-200" : "text-ink-100")}>
                  {it.label}
                </div>
                <div className="text-[10px] text-ink-400 mt-0.5">{it.desc}</div>
              </div>
              {active && (
                <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
