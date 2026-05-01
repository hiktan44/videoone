"use client";

import { useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { Scissors } from "lucide-react";
import { useStore } from "@/lib/store";
import type { TimelineClip } from "@/lib/mocks";

type Props = {
  clip: TimelineClip;
  pixelsPerSecond: number;
  trackHeight: number;
};

function formatSec(s: number): string {
  if (s < 1) return `${(s * 1000).toFixed(0)}ms`;
  return `${s.toFixed(s < 10 ? 1 : 0)}s`;
}

export function TimelineClipItem({ clip, pixelsPerSecond, trackHeight }: Props) {
  const selectedClipId = useStore((s) => s.selectedClipId);
  const setSelectedClip = useStore((s) => s.setSelectedClip);
  const resizeClip = useStore((s) => s.resizeClip);
  const splitClip = useStore((s) => s.splitClip);
  const playhead = useStore((s) => s.playhead);

  const isSelected = selectedClipId === clip.id;
  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startDurRef = useRef(clip.duration);
  const [editingDuration, setEditingDuration] = useState(false);
  const [draftValue, setDraftValue] = useState(clip.duration.toFixed(1));

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: clip.id,
  });

  const width = Math.max(20, clip.duration * pixelsPerSecond);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width,
    height: trackHeight,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isSelected ? 20 : 1,
  };

  const showSplit =
    isSelected &&
    playhead > clip.startTime + 0.2 &&
    playhead < clip.startTime + clip.duration - 0.2;
  const splitOffsetPx = (playhead - clip.startTime) * pixelsPerSecond;

  const onResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    resizingRef.current = true;
    startXRef.current = e.clientX;
    startDurRef.current = clip.duration;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizingRef.current) return;
    const dx = e.clientX - startXRef.current;
    // 0.1s adim ile yumuşak resize
    const newDur = Math.max(0.5, Math.round((startDurRef.current + dx / pixelsPerSecond) * 10) / 10);
    resizeClip(clip.id, newDur);
  };
  const onResizeUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizingRef.current) return;
    resizingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const commitDuration = () => {
    const v = parseFloat(draftValue);
    if (Number.isFinite(v) && v >= 0.1) {
      resizeClip(clip.id, Math.round(v * 10) / 10);
    }
    setEditingDuration(false);
  };

  const gradient = clip.gradient ?? "from-amber-500/60 to-coral-500/60";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedClip(clip.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setDraftValue(clip.duration.toFixed(1));
        setEditingDuration(true);
      }}
      className={clsx(
        "group absolute top-0 rounded-md bg-gradient-to-br overflow-hidden cursor-grab active:cursor-grabbing ring-1 transition-shadow",
        gradient,
        isSelected
          ? "ring-2 ring-amber-500 shadow-glow-amber"
          : "ring-white/10 hover:ring-amber-500/40"
      )}
    >
      {/* Etiket */}
      <div className="absolute inset-x-0 bottom-0 px-1.5 py-0.5 text-[10px] text-white bg-black/50 truncate">
        {clip.text ?? clip.label}
      </div>

      {/* Süre rozeti (sağ üst, hover'da görünür / her zaman seçiliyse) */}
      <div
        className={clsx(
          "absolute top-1 right-1 z-30 transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {editingDuration ? (
          <input
            autoFocus
            type="number"
            step="0.1"
            min="0.1"
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onBlur={commitDuration}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitDuration();
              if (e.key === "Escape") setEditingDuration(false);
            }}
            className="w-14 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500 text-ink-950 font-semibold focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDraftValue(clip.duration.toFixed(1));
              setEditingDuration(true);
            }}
            title="Süreyi düzenle (çift tıkla)"
            className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-black/60 text-amber-300 hover:bg-amber-500 hover:text-ink-950 transition-colors"
          >
            {formatSec(clip.duration)}
          </button>
        )}
      </div>

      {/* Split butonu */}
      {showSplit ? (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            splitClip(clip.id, playhead);
          }}
          title="Kes"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-amber-500 text-ink-950 flex items-center justify-center shadow hover:scale-110 transition-transform z-30"
          style={{ left: splitOffsetPx }}
        >
          <Scissors className="w-3 h-3" strokeWidth={2.5} />
        </button>
      ) : null}

      {/* Sağ kenar resize handle */}
      <div
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        onPointerCancel={onResizeUp}
        className="absolute top-0 right-0 h-full w-2 cursor-ew-resize bg-amber-500/0 hover:bg-amber-500/60 z-20 transition-colors"
        title="Boyutlandır (drag)"
      />
    </div>
  );
}
