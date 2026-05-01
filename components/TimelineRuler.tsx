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

function formatTimePrecise(total: number): string {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  const ms = Math.floor((total - Math.floor(total)) * 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export function TimelineRuler({ pixelsPerSecond, totalDuration, width }: Props) {
  const playhead = useStore((s) => s.playhead);
  const setPlayhead = useStore((s) => s.setPlayhead);
  const draggingRef = useRef(false);
  const rulerRef = useRef<HTMLDivElement | null>(null);

  // Hassasiyet: pixelsPerSecond'a göre tick aralığını seç
  // Yüksek zoom (>= 80px/sn) -> 0.1 sn alt-tick + her 0.5sn'de mid + her 1sn'de major
  // Orta zoom (40-80) -> 0.5sn mid + 1sn major
  // Düşük zoom (<40) -> 1sn alt + 5sn major
  const highZoom = pixelsPerSecond >= 80;
  const midZoom = pixelsPerSecond >= 40 && pixelsPerSecond < 80;

  const maxSeconds = Math.max(
    30,
    Math.ceil(totalDuration) + 10,
    Math.ceil(width / Math.max(1, pixelsPerSecond))
  );

  // Tick'ler — adimi zoom'a gore belirle
  const stepFine = highZoom ? 0.1 : midZoom ? 0.5 : 1;
  const stepMid = highZoom ? 0.5 : 1;
  const stepMajor = highZoom ? 1 : midZoom ? 5 : 5;

  const ticks: number[] = [];
  for (let i = 0; i <= maxSeconds * (1 / stepFine); i++) {
    ticks.push(Number((i * stepFine).toFixed(2)));
  }

  const handleFromClientX = (clientX: number) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const x = clientX - rect.left + rulerRef.current.scrollLeft;
    // Snap to 0.1s precision
    const raw = Math.max(0, x / pixelsPerSecond);
    const snapped = Math.round(raw * 10) / 10;
    setPlayhead(snapped);
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
      className="relative h-7 border-b border-ink-700 bg-ink-900 cursor-col-resize select-none"
      style={{ width }}
      title={`Playhead: ${formatTimePrecise(playhead)}`}
    >
      {ticks.map((s) => {
        // Hangi tier? Major / Mid / Fine
        const isMajor = Math.abs(s % stepMajor) < 0.01;
        const isMid = !isMajor && stepMid !== stepFine && Math.abs(s % stepMid) < 0.01;

        let cls: string;
        if (isMajor) cls = "absolute top-0 bottom-0 border-l border-amber-500/40";
        else if (isMid) cls = "absolute top-2 bottom-0 border-l border-ink-500";
        else cls = "absolute top-4 bottom-0 border-l border-ink-700";

        return (
          <div key={s} className={cls} style={{ left: s * pixelsPerSecond }}>
            {isMajor ? (
              <span className="absolute left-1 top-0.5 text-[10px] text-amber-300 font-mono font-medium">
                {formatTime(s)}
              </span>
            ) : isMid && pixelsPerSecond >= 60 ? (
              <span className="absolute left-1 top-2.5 text-[9px] text-ink-400 font-mono">
                {s.toFixed(1)}
              </span>
            ) : null}
          </div>
        );
      })}

      {/* Playhead */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-amber-500 pointer-events-none shadow-glow-amber"
        style={{ left: playhead * pixelsPerSecond }}
      >
        <div className="absolute -top-0.5 -left-1 w-2.5 h-2.5 rotate-45 bg-amber-500" />
      </div>
    </div>
  );
}
