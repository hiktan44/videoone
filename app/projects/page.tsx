import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ProjectsClientList } from "@/components/ProjectsClientList";
import type { GridProject } from "@/components/ProjectGrid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/projects");

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { clips: true } } },
  });

  const grid: GridProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    gradient: p.gradient,
    isPublic: p.isPublic,
    starred: p.starred,
    isTemplate: p.isTemplate,
    thumbnailUrl: p.thumbnailUrl,
    updatedAt: p.updatedAt.toISOString(),
    _count: p._count,
  }));

  return (
    <AppShell title="Tüm Projeler" subtitle={`${projects.length} proje · en yeniler üstte`}>
      <ProjectsClientList initial={grid} emptyText="Henüz proje oluşturmadın. Anasayfadan başla." />
    </AppShell>
  );
}
