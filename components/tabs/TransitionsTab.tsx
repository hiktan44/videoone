"use client";

import { useStore } from "@/lib/store";
import type { Transition } from "@/lib/mocks";
import clsx from "clsx";

const items: { id: Transition; label: string; preview: string }[] = [
  { id: "smooth-fade", label: "Yumuşak Geçiş", preview: "from-amber-500/20 to-cyan-500/20" },
  { id: "fade-to-black", label: "Siyaha Solma", preview: "from-ink-100/20 to-ink-950" },
  { id: "hard-cut", label: "Sert Kesim", preview: "from-coral-500/20 to-coral-500/40" },
  { id: "whip-pan", label: "Hızlı Kaydır", preview: "from-cyan-500/30 to-amber-500/30" },
  { id: "match-cut", label: "Eşleştirme Kesimi", preview: "from-amber-500/20 to-amber-500/40" },
  { id: "dissolve", label: "Eritme", preview: "from-cyan-500/20 to-coral-500/20" },
  { id: "morph", label: "Dönüşüm", preview: "from-amber-500/30 to-cyan-500/30" },
  { id: "zoom-blur", label: "Yakınlaştırma Bulanıklığı", preview: "from-coral-500/30 to-amber-500/30" },
  { id: "slide-left", label: "Sola Kaydır", preview: "from-ink-700 to-amber-500/30" },
  { id: "slide-right", label: "Sağa Kaydır", preview: "from-amber-500/30 to-ink-700" },
  { id: "circle", label: "Daire", preview: "from-cyan-500/30 to-cyan-500/10" },
  { id: "linear-blur", label: "Doğrusal Bulanıklık", preview: "from-ink-500/40 to-ink-700" },
  { id: "simple-zoom", label: "Basit Yakınlaştır", preview: "from-amber-500/40 to-amber-500/10" },
  { id: "water-drop", label: "Su Damlası", preview: "from-cyan-500/40 to-cyan-500/10" },
  { id: "glitch", label: "Glitch", preview: "from-coral-500/40 to-cyan-500/40" },
  { id: "page-curl", label: "Sayfa Çevir", preview: "from-amber-500/20 to-ink-700" },
];

export function TransitionsTab() {
  const selectedClipId = useStore((s) => s.selectedClipId);
  const clips = useStore((s) => s.clips);
  const updateClip = useStore((s) => s.updateClip);

  const selected = clips.find((c) => c.id === selectedClipId);
  const currentTransition = selected?.transitionAfter;

  const apply = (id: Transition) => {
    if (!selectedClipId) return;
    updateClip(selectedClipId, {
      transitionAfter: currentTransition === id ? undefined : id,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 border-b border-ink-800">
        <div className="text-sm font-semibold text-ink-50">Geçişler</div>
        {selected ? (
          <div className="mt-1 text-[11px] text-ink-400">
            <span className="text-amber-300">{selected.label}</span> sahnesinden sonra uygulanacak geçiş
          </div>
        ) : (
          <div className="mt-1 text-[11px] text-ink-400">
            Önce timeline'da bir klibe tıkla, sonra bir geçiş seç.
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        <div className="grid grid-cols-2 gap-2">
          {items.map((it) => {
            const active = currentTransition === it.id;
            return (
              <button
                key={it.id}
                onClick={() => apply(it.id)}
                disabled={!selectedClipId}
                className={clsx(
                  "rounded-lg p-3 text-xs text-left transition-all",
                  active
                    ? "border-2 border-amber-500 bg-amber-500/5 ring-glow-amber"
                    : "border border-ink-700 bg-ink-900/40 hover:border-ink-600 hover:bg-ink-900",
                  !selectedClipId && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className={clsx("aspect-video rounded-md mb-2 bg-gradient-to-br", it.preview)} />
                <div className={clsx("font-medium", active ? "text-amber-200" : "text-ink-100")}>
                  {it.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
