"use client";

import Link from "next/link";
import clsx from "clsx";
import { Trash2 } from "lucide-react";
import type { Project } from "@/lib/mocks";

export function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80 transition-colors overflow-hidden">
      <Link href={`/editor/${project.id}`} className="block">
        <div
          className={clsx(
            "aspect-[16/10] bg-gradient-to-br relative",
            project.gradient
          )}
        >
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
        </div>
        <div className="p-3">
          <div className="text-sm font-medium text-zinc-100 truncate">
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
