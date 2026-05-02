"use client";

import { useState, useCallback } from "react";
import { ProjectGrid, type GridProject } from "@/components/ProjectGrid";

type Props = {
  initial: GridProject[];
  filter?: "all" | "starred" | "shared" | "templates";
  emptyText?: string;
};

export function ProjectsClientList({ initial, filter = "all", emptyText }: Props) {
  const [projects, setProjects] = useState(initial);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/projects", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    let list: GridProject[] = (data.projects || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      gradient: p.gradient,
      isPublic: p.isPublic,
      starred: p.starred ?? false,
      isTemplate: p.isTemplate ?? false,
      thumbnailUrl: p.thumbnailUrl,
      updatedAt: p.updatedAt,
      _count: p._count,
    }));
    if (filter === "starred") list = list.filter((p) => p.starred);
    if (filter === "shared") list = list.filter((p) => p.isPublic);
    if (filter === "templates") list = list.filter((p) => p.isTemplate);
    setProjects(list);
  }, [filter]);

  return <ProjectGrid projects={projects} onUpdate={refresh} emptyText={emptyText} />;
}
