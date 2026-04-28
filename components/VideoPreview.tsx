"use client";

import { findClipAtTime, useStore } from "@/lib/store";
import { Maximize2 } from "lucide-react";
import clsx from "clsx";

const aspectClasses: Record<string, string> = {
  "1:1": "aspect-square",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
  "4:3": "aspect-[4/3]",
};

export function VideoPreview() {
  const aspect = useStore((s) => s.settings.aspectRatio);
  const captionsEnabled = useStore((s) => s.settings.captionsEnabled);
  const clips = useStore((s) => s.clips);
  const playhead = useStore((s) => s.playhead);

  const aspectClass = aspectClasses[aspect] ?? "aspect-video";
  const activeSubtitle = captionsEnabled
    ? findClipAtTime(clips, "subtitle", playhead)
    : null;
  const subtitleText = activeSubtitle?.text?.trim();

  return (
    <div className="flex-1 bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className={clsx(
          "relative max-w-full max-h-full w-full",
          aspectClass,
          "rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex items-center justify-center text-center px-6"
        )}
        style={{ maxHeight: "calc(100vh - 380px)" }}
      >
        <div className="space-y-2">
          <div className="text-zinc-500 text-sm">
            Video önizleme
          </div>
          <div className="text-zinc-600 text-xs">
            Sohbet&apos;e komut yazıp video üretin
          </div>
        </div>

        {captionsEnabled && subtitleText ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-6">
            <div
              className="max-w-[90%] rounded-md bg-black/60 px-3 py-1.5 text-center text-sm font-medium text-white"
              style={{
                textShadow:
                  "0 0 4px rgba(0,0,0,0.95), 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
              }}
            >
              {subtitleText}
            </div>
          </div>
        ) : null}
      </div>
      <button
        className="absolute bottom-8 right-8 h-9 w-9 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center"
        title="Tam ekran"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}
