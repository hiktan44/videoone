"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  Scissors,
  Trash2,
  MousePointer2,
  Play,
  Pause,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Camera,
  Clock,
  Maximize2,
  Share2,
  Download,
} from "lucide-react";
import clsx from "clsx";
import { useStore, getClipsByTrack, getTimelineDuration } from "@/lib/store";
import type { TrackId } from "@/lib/mocks";
import { TimelineRuler } from "./TimelineRuler";
import { TimelineTrack } from "./TimelineTrack";

const TRACK_HEIGHTS: Record<TrackId, number> = {
  video: 48,
  audio: 28,
  subtitle: 28,
};

const TRACK_LABELS: Record<TrackId, string> = {
  video: "Video",
  audio: "Ses",
  subtitle: "Altyazı",
};

const TRACK_TONES: Record<TrackId, string> = {
  video: "bg-purple-900/30 border-purple-700/40 text-purple-200",
  audio: "bg-fuchsia-900/30 border-fuchsia-700/40 text-fuchsia-200",
  subtitle: "bg-blue-900/30 border-blue-700/40 text-blue-200",
};

function formatMs(total: number): string {
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  const ms = Math.floor((total - Math.floor(total)) * 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(ms).padStart(3, "0")}`;
}

export function Timeline() {
  const clips = useStore((s) => s.clips);
  const pixelsPerSecond = useStore((s) => s.pixelsPerSecond);
  const playhead = useStore((s) => s.playhead);
  const isPlaying = useStore((s) => s.isPlaying);
  const selectedClipId = useStore((s) => s.selectedClipId);
  const togglePlay = useStore((s) => s.togglePlay);
  const setZoom = useStore((s) => s.setZoom);
  const reorderClipsOnTrack = useStore((s) => s.reorderClipsOnTrack);
  const splitClip = useStore((s) => s.splitClip);
  const removeClip = useStore((s) => s.removeClip);

  const totalDuration = useMemo(() => getTimelineDuration(clips), [clips]);

  const videoClips = useMemo(() => getClipsByTrack(clips, "video"), [clips]);
  const audioClips = useMemo(() => getClipsByTrack(clips, "audio"), [clips]);
  const subtitleClips = useMemo(() => getClipsByTrack(clips, "subtitle"), [clips]);

  // İçerik genişliği - min 900px'lik görsel stili koru
  const contentWidth = Math.max(
    900,
    Math.ceil((totalDuration + 5) * pixelsPerSecond)
  );

  // --- Oynatma: requestAnimationFrame ---
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
      return;
    }
    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const s = useStore.getState();
      const total = getTimelineDuration(s.clips);
      const next = s.playhead + dt;
      if (next >= total) {
        s.setPlayhead(total);
        if (s.isPlaying) s.togglePlay();
        return;
      }
      s.setPlayhead(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [isPlaying]);

  // --- DnD-kit ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    // Hangi track'te?
    const activeClip = clips.find((c) => c.id === activeId);
    const overClip = clips.find((c) => c.id === overId);
    if (!activeClip || !overClip) return;
    if (activeClip.trackId !== overClip.trackId) return;

    const trackClips = getClipsByTrack(clips, activeClip.trackId);
    const oldIndex = trackClips.findIndex((c) => c.id === activeId);
    const newIndex = trackClips.findIndex((c) => c.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const newOrder = arrayMove(trackClips, oldIndex, newIndex).map((c) => c.id);
    reorderClipsOnTrack(activeClip.trackId, newOrder);
  };

  const handleSplit = () => {
    if (!selectedClipId) return;
    splitClip(selectedClipId, playhead);
  };
  const handleDelete = () => {
    if (!selectedClipId) return;
    removeClip(selectedClipId);
  };
  const handleZoomIn = () => setZoom(pixelsPerSecond + 20);
  const handleZoomOut = () => setZoom(pixelsPerSecond - 20);

  // Genel playhead (tracklerin üzerinde)
  const playheadX = playhead * pixelsPerSecond;

  return (
    <div className="h-[240px] shrink-0 bg-zinc-950 border-t border-zinc-900 flex flex-col">
      {/* Üst toolbar */}
      <div className="h-10 px-2 flex items-center gap-1 border-b border-zinc-900 text-zinc-400">
        <ToolBtn title="Kes" onClick={handleSplit} disabled={!selectedClipId}>
          <Scissors className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Sil" onClick={handleDelete} disabled={!selectedClipId}>
          <Trash2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Seç">
          <MousePointer2 className="h-4 w-4" />
        </ToolBtn>
        <span className="mx-1 h-5 w-px bg-zinc-800" />
        <ToolBtn
          title={isPlaying ? "Duraklat" : "Oynat"}
          onClick={togglePlay}
          highlight
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </ToolBtn>
        <span className="text-[11px] text-zinc-300 font-mono ml-1.5">
          {formatMs(playhead)}
        </span>
        <span className="mx-1 h-5 w-px bg-zinc-800" />
        <ToolBtn title="Geri Al">
          <Undo2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Yinele">
          <Redo2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Yakınlaştır" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Uzaklaştır" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </ToolBtn>
        <span className="mx-1 h-5 w-px bg-zinc-800" />
        <ToolBtn title="Çekim">
          <Camera className="h-4 w-4" />
        </ToolBtn>
        <span className="text-[11px] text-zinc-400 ml-0.5">1x</span>
        <ToolBtn title="Süre">
          <Clock className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Tam Ekran">
          <Maximize2 className="h-4 w-4" />
        </ToolBtn>

        <div className="flex-1" />

        <button
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-vibe text-white text-xs font-semibold px-3 py-1.5 mr-1"
          title="Dışa Aktar"
        >
          <Download className="h-3.5 w-3.5" />
          Dışa Aktar
        </button>
        <ToolBtn title="Yayınla">
          <Share2 className="h-4 w-4" />
        </ToolBtn>
      </div>

      {/* Alt scroll alanı */}
      <div className="flex-1 overflow-x-auto scrollbar-thin">
        <div style={{ minWidth: contentWidth + 96 }} className="relative">
          {/* Ruler — sol etiket kolonuna ofset için padding */}
          <div className="pl-[88px] relative">
            <TimelineRuler
              pixelsPerSecond={pixelsPerSecond}
              totalDuration={totalDuration}
              width={contentWidth}
            />
          </div>

          {/* Tracklar */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <div className="px-2 py-2 space-y-1.5 relative">
              <TimelineTrack
                trackId="video"
                clips={videoClips}
                pixelsPerSecond={pixelsPerSecond}
                height={TRACK_HEIGHTS.video}
                width={contentWidth}
                tone={TRACK_TONES.video}
                label={TRACK_LABELS.video}
              />
              <TimelineTrack
                trackId="audio"
                clips={audioClips}
                pixelsPerSecond={pixelsPerSecond}
                height={TRACK_HEIGHTS.audio}
                width={contentWidth}
                tone={TRACK_TONES.audio}
                label={TRACK_LABELS.audio}
              />
              <TimelineTrack
                trackId="subtitle"
                clips={subtitleClips}
                pixelsPerSecond={pixelsPerSecond}
                height={TRACK_HEIGHTS.subtitle}
                width={contentWidth}
                tone={TRACK_TONES.subtitle}
                label={TRACK_LABELS.subtitle}
              />

              {/* Tracklar üstündeki playhead dikey çizgi */}
              <div
                className="pointer-events-none absolute top-0 bottom-0 w-px bg-red-500/70"
                style={{ left: 88 + playheadX }}
              />
            </div>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({
  title,
  children,
  highlight,
  onClick,
  disabled,
}: {
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
        disabled
          ? "opacity-40 cursor-not-allowed text-zinc-500"
          : highlight
            ? "bg-zinc-800 text-white"
            : "hover:bg-zinc-900 text-zinc-400 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
