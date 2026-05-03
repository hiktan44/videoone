"use client";

import Link from "next/link";
import clsx from "clsx";
import { useRef, useState } from "react";
import { Trash2, Play, Image as ImageIcon } from "lucide-react";
import type { Project } from "@/lib/mocks";

function isVideo(u?: string): boolean {
  return !!u && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);
}
function isImage(u?: string): boolean {
  return !!u && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(u);
}

export function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete?: (id: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hover, setHover] = useState(false);

  // Önizleme — explicit previewUrl > ilk video klip > ilk image klip > thumbnail
  const firstVideo = project.clips?.find((c) => c.trackId === "video" && c.sourceUrl);
  const previewUrl =
    project.previewUrl ||
    (isVideo(firstVideo?.sourceUrl) ? firstVideo?.sourceUrl : undefined);
  const thumbUrl =
    project.thumbnailUrl ||
    (isImage(firstVideo?.sourceUrl) ? firstVideo?.sourceUrl : undefined) ||
    firstVideo?.thumbnailUrl;

  const onEnter = () => {
    setHover(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };
  const onLeave = () => {
    setHover(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:border-purple-500/50 hover:bg-zinc-900/80 transition-all overflow-hidden hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Link href={`/editor/${project.id}`} className="block">
        <div
          className={clsx(
            "aspect-[16/10] relative overflow-hidden",
            !previewUrl && !thumbUrl && `bg-gradient-to-br ${project.gradient}`
          )}
        >
          {previewUrl ? (
            <video
              ref={videoRef}
              src={previewUrl}
              muted
              loop
              playsInline
              poster={thumbUrl}
              className={clsx(
                "absolute inset-0 w-full h-full object-cover transition-transform duration-500",
                hover ? "scale-105" : "scale-100"
              )}
            />
          ) : thumbUrl ? (
            <img
              src={thumbUrl}
              alt={project.name}
              className={clsx(
                "absolute inset-0 w-full h-full object-cover transition-transform duration-500",
                hover ? "scale-110" : "scale-100"
              )}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/40">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}

          {/* Karanlık overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-100 group-hover:opacity-100 transition-opacity" />

          {/* Play ikonu (önizleme varsa hover'da) */}
          {previewUrl && (
            <div
              className={clsx(
                "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity",
                hover ? "opacity-0" : "opacity-100"
              )}
            >
              <div className="h-14 w-14 rounded-full bg-black/60 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
              </div>
            </div>
          )}

          {/* Klip rozeti */}
          {project.clips?.length ? (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-semibold text-white">
              {project.clips.filter((c) => c.trackId === "video").length} sahne
            </div>
          ) : null}
        </div>

        <div className="p-3">
          <div className="text-sm font-medium text-zinc-100 truncate group-hover:text-purple-200 transition-colors">
            {project.name}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {project.updatedLabel}
          </div>
        </div>
      </Link>

      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(project.id);
          }}
          title="Projeyi sil"
          aria-label="Projeyi sil"
          className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-zinc-950/70 backdrop-blur hover:bg-red-600/90 text-zinc-200 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-800 hover:border-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
