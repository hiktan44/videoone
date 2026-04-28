"use client";

import { useStore } from "@/lib/store";
import type { TimelineClip } from "@/lib/mocks";
import { Trash2 } from "lucide-react";
import { formatSrtTime } from "@/lib/srt";

type Props = {
  clip: TimelineClip;
};

// Tek bir altyazı klibini düzenleyen satır bileşeni.
export function SubtitleEditor({ clip }: Props) {
  const updateClip = useStore((s) => s.updateClip);
  const removeClip = useStore((s) => s.removeClip);

  const start = formatSrtTime(clip.startTime).replace(",", ".");
  const end = formatSrtTime(clip.startTime + clip.duration).replace(",", ".");

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2 space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500 font-mono">
        <span>{start}</span>
        <span>→</span>
        <span>{end}</span>
        <button
          onClick={() => removeClip(clip.id)}
          className="ml-auto h-6 w-6 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center"
          title="Altyazıyı sil"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        type="text"
        value={clip.text ?? ""}
        onChange={(e) => updateClip(clip.id, { text: e.target.value })}
        placeholder="Altyazı metni..."
        className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
      />
    </div>
  );
}
