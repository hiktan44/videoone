import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { ProjectsClientList } from "@/components/ProjectsClientList";
import type { GridProject } from "@/components/ProjectGrid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/templates");

  const projects = await prisma.project.findMany({
    where: { userId: user.id, isTemplate: true },
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
      title="Şablonlar"
      subtitle="Tekrar kullanmak için şablona dönüştürdüğün projeler"
    >
      {projects.length === 0 ? (
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="text-ink-300 text-sm mb-4">
            Henüz şablon yok. Bir projeyi şablona dönüştürmek için:
          </div>
          <ol className="text-left text-xs text-ink-400 space-y-1 list-decimal list-inside bg-ink-900 rounded-lg p-4">
            <li>Editöre git, beğendiğin projeyi aç</li>
            <li>Top bar &quot;⋯&quot; menüsünden &quot;Şablona dönüştür&quot;</li>
            <li>Buradan tekrar kullanabilir veya yayımlayabilirsin</li>
          </ol>
        </div>
      ) : (
        <ProjectsClientList initial={grid} filter="templates" />
      )}
    </AppShell>
  );
}
