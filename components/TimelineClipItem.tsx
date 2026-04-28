"use client";

import { useRef } from "react";
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

  const width = Math.max(12, clip.duration * pixelsPerSecond);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width,
    height: trackHeight,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isSelected ? 20 : 1,
  };

  // Split butonu, seçili klip ve playhead klibin içindeyse görünür
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
    const newDur = Math.max(0.5, startDurRef.current + dx / pixelsPerSecond);
    resizeClip(clip.id, newDur);
  };
  const onResizeUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizingRef.current) return;
    resizingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const gradient = clip.gradient ?? "from-zinc-600 to-zinc-800";

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
      className={clsx(
        "group absolute top-0 rounded-md bg-gradient-to-br overflow-hidden cursor-grab active:cursor-grabbing ring-1 transition-shadow",
        gradient,
        isSelected
          ? "ring-2 ring-white shadow-lg"
          : "ring-white/10 hover:ring-white/30"
      )}
    >
      {/* Etiket */}
      <div className="absolute inset-x-0 bottom-0 px-1.5 py-0.5 text-[10px] text-white bg-black/40 truncate">
        {clip.text ?? clip.label}
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
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow hover:scale-110 transition-transform z-30"
          style={{ left: splitOffsetPx }}
        >
          <Scissors className="w-3 h-3" />
        </button>
      ) : null}

      {/* Sağ kenar resize handle */}
      <div
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        onPointerCancel={onResizeUp}
        className="absolute top-0 right-0 h-full w-1.5 cursor-ew-resize bg-white/0 hover:bg-white/40 z-20"
        title="Boyutlandır"
      />
    </div>
  );
}
