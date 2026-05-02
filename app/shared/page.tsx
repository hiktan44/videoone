import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ProjectsClientList } from "@/components/ProjectsClientList";
import type { GridProject } from "@/components/ProjectGrid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SharedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/shared");

  const projects = await prisma.project.findMany({
    where: { userId: user.id, isPublic: true },
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
    <AppShell
      title="Paylaşılanlar"
      subtitle="Public yayınladığın projeler — herkes görebilir"
    >
      <ProjectsClientList
        initial={grid}
        filter="shared"
        emptyText="Henüz public yayınlanmış proje yok. Editor'de Yayınla butonuna bas."
      />
    </AppShell>
  );
}
