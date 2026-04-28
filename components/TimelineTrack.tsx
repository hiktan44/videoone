"use client";

import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { TimelineClipItem } from "./TimelineClipItem";
import type { TimelineClip, TrackId } from "@/lib/mocks";

type Props = {
  trackId: TrackId;
  clips: TimelineClip[];
  pixelsPerSecond: number;
  height: number;
  width: number;
  tone: string;
  label: string;
};

export function TimelineTrack({
  trackId,
  clips,
  pixelsPerSecond,
  height,
  width,
  tone,
  label,
}: Props) {
  const addClip = useStore((s) => s.addClip);
  const setSelectedClip = useStore((s) => s.setSelectedClip);

  const ids = clips.map((c) => c.id);

  // Boş alana çift tıklama → yeni placeholder klip ekle
  const onDoubleClick = () => {
    const base: Partial<TimelineClip> = {
      trackId,
      label:
        trackId === "video"
          ? "Yeni Sahne"
          : trackId === "audio"
            ? "Yeni Ses"
            : "Yeni Altyazı",
      duration: trackId === "subtitle" ? 2 : 3,
      gradient:
        trackId === "video"
          ? "from-zinc-500 to-zinc-700"
          : trackId === "audio"
            ? "from-fuchsia-500 to-purple-500"
            : "from-blue-400 to-blue-600",
      text: trackId === "subtitle" ? "Yeni altyazı" : undefined,
    };
    addClip(base as Omit<TimelineClip, "id">);
  };

  return (
    <div className="flex items-stretch gap-2">
      {/* Sol etiket */}
      <div
        className={clsx(
          "shrink-0 w-20 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wider rounded-md border",
          tone
        )}
        style={{ height }}
      >
        {label}
      </div>

      {/* Track içeriği */}
      <div
        className="relative rounded-md bg-zinc-900/40 border border-zinc-800"
        style={{ width, height }}
        onDoubleClick={onDoubleClick}
        onClick={() => setSelectedClip(null)}
      >
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          {clips.map((clip) => {
            // Not: Sortable horizontal strategy, left offset'i yönetir, ancak
            // biz her klibin startTime'ı ile absolute positioning yapıyoruz.
            // Bu yüzden clip konumunu `left` ile veriyoruz; dnd-kit transform'u
            // yatay sürükleme ipucu olarak kullanır, onDragEnd ile biz yeni
            // sırayı hesaplayıp reorderClipsOnTrack ile commit ederiz.
            return (
              <div
                key={clip.id}
                className="absolute top-0"
                style={{
                  left: clip.startTime * pixelsPerSecond,
                  height,
                }}
              >
                <TimelineClipItem
                  clip={clip}
                  pixelsPerSecond={pixelsPerSecond}
                  trackHeight={height}
                />
              </div>
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
}
