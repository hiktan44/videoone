import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { Globe, Eye } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/explore");

  // Tüm public projeler — herkesin yayınladığı
  const projects = await prisma.project.findMany({
    where: { isPublic: true },
    orderBy: { updatedAt: "desc" },
    take: 60,
    include: {
      user: { select: { name: true, email: true, channel: { select: { slug: true } } } },
      _count: { select: { clips: true } },
    },
  });

  return (
    <AppShell
      title="Yayınlanan Şablonlar"
      subtitle="Topluluğun paylaştığı public videolardan ilham al"
    >
      {projects.length === 0 ? (
        <div className="text-center py-16 text-ink-500 text-sm">
          Henüz public yayınlanmış proje yok. İlk olmak ister misin?
          <br />
          <Link href="/" className="text-amber-300 hover:text-amber-200 mt-2 inline-block">
            Yeni proje oluştur →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const slug = p.user?.channel?.slug;
            const channelName = p.user?.name || p.user?.email?.split("@")[0] || "anonymous";
            return (
              <Link
                key={p.id}
                href={slug ? `/u/${slug}/${p.id}` : `/editor/${p.id}`}
                className="group rounded-xl overflow-hidden border border-ink-700 bg-ink-900/40 hover:border-amber-500/40 transition-all"
              >
                <div
                  className={
                    p.thumbnailUrl
                      ? "aspect-video bg-cover bg-center relative"
                      : `aspect-video bg-gradient-to-br ${p.gradient} relative`
                  }
                  style={
                    p.thumbnailUrl
                      ? { backgroundImage: `url(${p.thumbnailUrl})` }
                      : undefined
                  }
                >
                  <div className="absolute top-1.5 right-1.5">
                    <div className="rounded-md bg-cyan-500/90 px-1.5 py-0.5 text-[9px] font-bold text-ink-950 inline-flex items-center gap-1">
                      <Globe className="h-2.5 w-2.5" />
                      Public
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold text-ink-100 truncate">{p.name}</div>
                  <div className="mt-0.5 text-[11px] text-ink-400 truncate">
                    @{slug || "anonymous"} · {channelName}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
