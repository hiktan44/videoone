"use client";

import { useRef, useState } from "react";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import clsx from "clsx";
import { Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { TimelineClipItem } from "./TimelineClipItem";
import type { TimelineClip, TrackId } from "@/lib/mocks";

async function presignAndUpload(file: File, kind: "video" | "audio" | "image"): Promise<string | null> {
  try {
    const r = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, filename: file.name, contentType: file.type, sizeBytes: file.size }),
    });
    const d = await r.json();
    if (!r.ok || !d.uploadUrl) { alert(d.error || "Upload başlatılamadı"); return null; }
    const put = await fetch(d.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!put.ok) { alert("R2 PUT hatası"); return null; }
    return d.publicUrl;
  } catch (e) {
    alert(e instanceof Error ? e.message : "Yükleme hatası");
    return null;
  }
}

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
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const ids = clips.map((c) => c.id);

  const handleDroppedFiles = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      const arr = Array.from(files);
      for (const file of arr) {
        const isVideo = file.type.startsWith("video/");
        const isAudio = file.type.startsWith("audio/");
        const isImage = file.type.startsWith("image/");
        // Track tipine uygunluk kontrolü
        if (trackId === "video" && !(isVideo || isImage)) {
          alert(`${file.name}: Video track'a sadece video veya görsel dosyası ekleyebilirsiniz.`);
          continue;
        }
        if (trackId === "audio" && !isAudio) {
          alert(`${file.name}: Ses track'a sadece ses dosyası ekleyebilirsiniz.`);
          continue;
        }
        if (trackId === "subtitle") continue;
        const kind = isAudio ? "audio" : isVideo ? "video" : "image";
        const url = await presignAndUpload(file, kind);
        if (!url) continue;
        // Süre tahmin: video/audio için 5 sn varsayılan (gerçek süreyi browser'dan okuyabilirdik ama sade tutalım)
        let durationGuess = 5;
        if (isImage) durationGuess = 4;
        try {
          if (isVideo || isAudio) {
            const el = isVideo ? document.createElement("video") : document.createElement("audio");
            el.preload = "metadata";
            el.src = URL.createObjectURL(file);
            await new Promise<void>((resolve) => {
              el.onloadedmetadata = () => resolve();
              setTimeout(resolve, 1500);
            });
            if (Number.isFinite(el.duration) && el.duration > 0) durationGuess = el.duration;
          }
        } catch {}
        addClip({
          trackId,
          label: file.name.slice(0, 40),
          duration: durationGuess,
          sourceUrl: url,
          gradient: trackId === "audio" ? "from-fuchsia-500 to-purple-500" : "from-cyan-500 to-blue-500",
        });
      }
    } finally { setUploading(false); }
  };

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
        className={clsx(
          "relative rounded-md bg-zinc-900/40 border transition-colors",
          isDragOver ? "border-cyan-400 bg-cyan-500/10 border-2 border-dashed" : "border-zinc-800"
        )}
        style={{ width, height }}
        onDoubleClick={onDoubleClick}
        onClick={() => setSelectedClip(null)}
        onDragOver={(e) => {
          if (trackId === "subtitle") return;
          e.preventDefault();
          if (!isDragOver) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          if (trackId === "subtitle") return;
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files?.length) handleDroppedFiles(e.dataTransfer.files);
        }}
      >
        {/* Boş track ise upload CTA */}
        {clips.length === 0 && trackId !== "subtitle" && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInput.current?.click(); }}
            className="absolute inset-2 rounded-md border-2 border-dashed border-zinc-700 hover:border-cyan-500/60 hover:bg-cyan-500/5 flex items-center justify-center gap-2 text-zinc-500 hover:text-cyan-300 text-xs transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Yükleniyor..." : `Dosya yükle veya sürükleyip bırak (${trackId === "audio" ? "ses" : "video / görsel"})`}
          </button>
        )}
        {clips.length > 0 && isDragOver && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-cyan-300 text-xs font-semibold">
            Bırak — sona ekle
          </div>
        )}
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={trackId === "audio" ? "audio/*" : "video/*,image/*"}
          hidden
          onChange={(e) => {
            if (e.target.files?.length) handleDroppedFiles(e.target.files);
            (e.target as HTMLInputElement).value = "";
          }}
        />
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
