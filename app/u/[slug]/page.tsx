// /u/[slug] — Kullanicinin public kanal sayfasi. Yayinlanan tum projeleri listeler.

import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles, Film, ArrowLeft } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ChannelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const channel = await prisma.channel.findUnique({
    where: { slug },
    include: { user: true },
  });
  if (!channel) notFound();

  const projects = await prisma.project.findMany({
    where: { userId: channel.userId, isPublic: true },
    orderBy: { updatedAt: "desc" },
    include: {
      jobs: {
        where: { kind: "export", status: "succeeded" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const displayName = channel.user.name || slug;

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      <header className="border-b border-ink-800 bg-ink-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-xs text-ink-300 hover:text-ink-50 inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Vibe Studio
          </Link>
          <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-tight">
            <div className="h-6 w-6 rounded-md bg-gradient-vibe flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-ink-950" strokeWidth={2.5} />
            </div>
            <span className="text-gradient">Vibe Studio</span>
          </Link>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Channel header */}
        <div className="flex items-start gap-5 pb-8 border-b border-ink-800">
          <div className="h-20 w-20 rounded-2xl bg-gradient-vibe flex items-center justify-center text-2xl font-bold text-ink-950 shrink-0">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-ink-50">{displayName}</h1>
            <div className="text-sm text-ink-400 mt-1">@{channel.slug}</div>
            {channel.bio && (
              <p className="mt-3 text-sm text-ink-300 leading-relaxed">{channel.bio}</p>
            )}
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-400">
              <Film className="h-3.5 w-3.5" />
              {projects.length} yayınlanmış video
            </div>
          </div>
        </div>

        {/* Projects grid */}
        <div className="mt-8">
          {projects.length === 0 ? (
            <div className="text-center py-16 text-ink-500 text-sm">
              Henüz yayınlanmış video yok.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => {
                const exportJob = p.jobs[0];
                return (
                  <Link
                    key={p.id}
                    href={`/u/${slug}/${p.id}`}
                    className="group rounded-xl overflow-hidden border border-ink-700 bg-ink-900/40 hover:border-amber-500/40 transition-all"
                  >
                    <div
                      className={`aspect-video bg-gradient-to-br ${p.gradient} relative`}
                      style={
                        p.thumbnailUrl
                          ? { backgroundImage: `url(${p.thumbnailUrl})`, backgroundSize: "cover" }
                          : undefined
                      }
                    >
                      {exportJob?.resultUrl && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-ink-950/60">
                          <div className="h-12 w-12 rounded-full bg-amber-500/90 flex items-center justify-center">
                            <Film className="h-5 w-5 text-ink-950" strokeWidth={2.5} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-semibold text-ink-100 truncate">{p.name}</div>
                      <div className="text-[11px] text-ink-400 mt-0.5">
                        {new Date(p.updatedAt).toLocaleDateString("tr-TR")}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-ink-800 py-6 mt-12">
        <div className="max-w-5xl mx-auto px-6 text-center text-xs text-ink-500">
          <Link href="/" className="hover:text-ink-300">
            Vibe Studio ile üretildi
          </Link>
        </div>
      </footer>
    </div>
  );
}
