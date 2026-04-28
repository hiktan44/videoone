"use client";

import { useRef } from "react";
import { useStore } from "@/lib/store";

type Props = {
  pixelsPerSecond: number;
  totalDuration: number;
  width: number;
};

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TimelineRuler({ pixelsPerSecond, totalDuration, width }: Props) {
  const playhead = useStore((s) => s.playhead);
  const setPlayhead = useStore((s) => s.setPlayhead);
  const draggingRef = useRef(false);
  const rulerRef = useRef<HTMLDivElement | null>(null);

  // Saniyelik tick'leri göster: sonlu bir üst sınır
  const maxSeconds = Math.max(
    30,
    Math.ceil(totalDuration) + 10,
    Math.ceil(width / Math.max(1, pixelsPerSecond))
  );
  const ticks: number[] = [];
  for (let i = 0; i <= maxSeconds; i++) ticks.push(i);

  const handleFromClientX = (clientX: number) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = clientX - rect.left + rulerRef.current.scrollLeft;
    const t = Math.max(0, x / pixelsPerSecond);
    setPlayhead(t);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    handleFromClientX(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      ref={rulerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative h-7 border-b border-zinc-800 bg-zinc-950 cursor-col-resize select-none"
      style={{ width }}
    >
      {ticks.map((s) => {
        const isMajor = s % 5 === 0;
        return (
          <div
            key={s}
            className={
              isMajor
                ? "absolute top-0 bottom-0 border-l border-zinc-600"
                : "absolute top-3 bottom-0 border-l border-zinc-800"
            }
            style={{ left: s * pixelsPerSecond }}
          >
            {isMajor ? (
              <span className="absolute left-1 top-0.5 text-[10px] text-zinc-400 font-mono">
                {formatTime(s)}
              </span>
            ) : null}
          </div>
        );
      })}

      {/* Playhead (ruler üst kısmında) */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"
        style={{ left: playhead * pixelsPerSecond }}
      >
        <div className="absolute -top-0.5 -left-1 w-2.5 h-2.5 rotate-45 bg-red-500" />
      </div>
    </div>
  );
}
