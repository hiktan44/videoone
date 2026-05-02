"use client";

import { findClipAtTime, useStore } from "@/lib/store";
import { Maximize2 } from "lucide-react";
import clsx from "clsx";
import { useMemo } from "react";
import type { Effect, Transition } from "@/lib/mocks";

const aspectClasses: Record<string, string> = {
  "1:1": "aspect-square",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
  "4:3": "aspect-[4/3]",
};

// Effect → CSS filter / animation map
function effectStyles(effects: Effect[] = []): React.CSSProperties {
  const filters: string[] = [];
  const styles: React.CSSProperties = {};
  for (const e of effects) {
    switch (e) {
      case "color-grade-warm":
        filters.push("saturate(1.2) sepia(0.15) hue-rotate(-10deg)");
        break;
      case "color-grade-cool":
        filters.push("saturate(1.1) hue-rotate(15deg) brightness(0.95)");
        break;
      case "vignette":
        styles.boxShadow = "inset 0 0 80px rgba(0,0,0,0.6)";
        break;
      case "film-grain":
        // Approximation via texture overlay handled separately
        break;
      case "shake":
        styles.animation = "shake 0.3s ease-in-out infinite";
        break;
      case "zoom-in":
        styles.transform = "scale(1.05)";
        styles.transition = "transform 4s ease-out";
        break;
    }
  }
  if (filters.length) styles.filter = filters.join(" ");
  return styles;
}

// Transition window (last 0.5s of clip): CSS classes
function transitionClass(transition: Transition | undefined, fadeIn: boolean): string {
  if (!transition) return "";
  if (transition === "fade-to-black" || transition === "smooth-fade")
    return fadeIn ? "animate-[fadeIn_0.5s_ease-in-out]" : "animate-[fadeOut_0.5s_ease-in-out]";
  if (transition === "dissolve")
    return fadeIn ? "animate-[fadeIn_0.7s_ease-in]" : "animate-[fadeOut_0.7s_ease-out]";
  if (transition === "zoom-blur")
    return fadeIn ? "animate-[zoomIn_0.5s_ease-out]" : "animate-[zoomOut_0.5s_ease-in]";
  if (transition === "slide-left")
    return fadeIn ? "animate-[slideInLeft_0.5s_ease-out]" : "animate-[slideOutLeft_0.5s_ease-in]";
  if (transition === "slide-right")
    return fadeIn ? "animate-[slideInRight_0.5s_ease-out]" : "animate-[slideOutRight_0.5s_ease-in]";
  return "";
}

export function VideoPreview() {
  const aspect = useStore((s) => s.settings.aspectRatio);
  const captionsEnabled = useStore((s) => s.settings.captionsEnabled);
  const clips = useStore((s) => s.clips);
  const playhead = useStore((s) => s.playhead);
  const isPlaying = useStore((s) => s.isPlaying);

  const aspectClass = aspectClasses[aspect] ?? "aspect-video";
  const activeVideo = useMemo(
    () => findClipAtTime(clips, "video", playhead),
    [clips, playhead]
  );
  const activeSubtitle = captionsEnabled
    ? findClipAtTime(clips, "subtitle", playhead)
    : null;
  const subtitleText = activeSubtitle?.text?.trim();

  // Transition window detection (son 0.5s'de fadeOut, ilk 0.3s'de fadeIn)
  let transitionStyle = "";
  if (activeVideo) {
    const localT = playhead - activeVideo.startTime;
    const remaining = activeVideo.duration - localT;
    if (remaining < 0.5 && activeVideo.transitionAfter) {
      transitionStyle = transitionClass(activeVideo.transitionAfter, false);
    } else if (localT < 0.3) {
      transitionStyle = "animate-[fadeIn_0.3s_ease-in-out]";
    }
  }

  const effectStyle = activeVideo ? effectStyles(activeVideo.effects) : {};
  const showFilmGrain = activeVideo?.effects?.includes("film-grain");

  return (
    <div className="flex-1 bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className={clsx(
          "relative max-w-full max-h-full w-full overflow-hidden",
          aspectClass,
          "rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex items-center justify-center text-center px-6"
        )}
        style={{ maxHeight: "calc(100vh - 380px)" }}
      >
        {activeVideo?.sourceUrl && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(activeVideo.sourceUrl) ? (
          <video
            key={activeVideo.id}
            src={activeVideo.sourceUrl}
            autoPlay={isPlaying}
            muted
            loop
            playsInline
            className={clsx("absolute inset-0 w-full h-full object-cover", transitionStyle)}
            style={effectStyle}
          />
        ) : activeVideo?.sourceUrl && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(activeVideo.sourceUrl) ? (
          <img
            key={activeVideo.id}
            src={activeVideo.sourceUrl}
            alt={activeVideo.label || ""}
            className={clsx("absolute inset-0 w-full h-full object-cover", transitionStyle)}
            style={effectStyle}
          />
        ) : activeVideo?.sourceUrl ? (
          // Bilinmeyen uzantilar — once video dene, hata olursa img'a dus
          <video
            key={activeVideo.id}
            src={activeVideo.sourceUrl}
            autoPlay={isPlaying}
            muted
            loop
            playsInline
            className={clsx("absolute inset-0 w-full h-full object-cover", transitionStyle)}
            style={effectStyle}
            onError={(e) => {
              // <video> calismadi -> arkaplan img olarak ayarla
              const parent = (e.currentTarget.parentElement as HTMLElement | null);
              if (parent && activeVideo.sourceUrl) {
                e.currentTarget.style.display = "none";
                parent.style.backgroundImage = `url(${activeVideo.sourceUrl})`;
                parent.style.backgroundSize = "cover";
                parent.style.backgroundPosition = "center";
              }
            }}
          />
        ) : activeVideo?.thumbnailUrl ? (
          <div
            className={clsx("absolute inset-0 bg-cover bg-center", transitionStyle)}
            style={{
              backgroundImage: `url(${activeVideo.thumbnailUrl})`,
              ...effectStyle,
            }}
          />
        ) : (
          <div className="space-y-2">
            <div className="text-zinc-500 text-sm">Video önizleme</div>
            <div className="text-zinc-600 text-xs">
              Sohbet&apos;e komut yazıp video üretin
            </div>
          </div>
        )}

        {/* Film grain overlay */}
        {showFilmGrain && (
          <div
            className="absolute inset-0 pointer-events-none opacity-15 mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
        )}

        {/* Vignette overlay */}
        {activeVideo?.effects?.includes("vignette") && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: "inset 0 0 100px 30px rgba(0,0,0,0.7)" }}
          />
        )}

        {/* Subtitle */}
        {captionsEnabled && subtitleText ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-6 z-10">
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

        {/* Active transition badge */}
        {activeVideo?.transitionAfter && (
          <div className="absolute top-2 right-2 rounded-md bg-amber-500/90 text-ink-950 text-[10px] font-bold px-2 py-0.5">
            ↪ {activeVideo.transitionAfter}
          </div>
        )}
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
