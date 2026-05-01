// /u/[slug]/[projectId] — tek bir public proje izleme sayfasi.

import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles, ArrowLeft } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ slug: string; projectId: string }>;
}) {
  const { slug, projectId } = await params;
  const channel = await prisma.channel.findUnique({
    where: { slug },
    include: { user: true },
  });
  if (!channel) notFound();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: channel.userId, isPublic: true },
    include: {
      jobs: {
        where: { kind: "export", status: "succeeded" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!project) notFound();

  const exportUrl = project.jobs[0]?.resultUrl;
  const displayName = channel.user.name || slug;

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      <header className="border-b border-ink-800 bg-ink-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href={`/u/${slug}`}
            className="text-xs text-ink-300 hover:text-ink-50 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {displayName} kanalı
          </Link>
          <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-tight">
            <div className="h-6 w-6 rounded-md bg-gradient-vibe flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-ink-950" strokeWidth={2.5} />
            </div>
            <span className="text-gradient">Vibe Studio</span>
          </Link>
          <div className="w-32" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Player */}
        <div className="rounded-2xl overflow-hidden border border-ink-700 bg-ink-900 shadow-glow-amber">
          {exportUrl ? (
            <video
              src={exportUrl}
              controls
              autoPlay
              className="w-full aspect-video bg-ink-950"
            />
          ) : (
            <div
              className={`aspect-video bg-gradient-to-br ${project.gradient} flex items-center justify-center`}
            >
              <div className="text-center">
                <div className="text-sm text-ink-100/80">Video henüz export edilmemiş</div>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 flex items-start gap-4">
          <Link
            href={`/u/${slug}`}
            className="h-10 w-10 rounded-full bg-gradient-vibe flex items-center justify-center text-sm font-bold text-ink-950 shrink-0 hover:opacity-90"
          >
            {displayName.slice(0, 2).toUpperCase()}
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-ink-50">{project.name}</h1>
            <Link
              href={`/u/${slug}`}
              className="text-sm text-amber-300 hover:text-amber-200 inline-block mt-0.5"
            >
              {displayName}
            </Link>
            <div className="text-xs text-ink-400 mt-1">
              {new Date(project.updatedAt).toLocaleDateString("tr-TR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-ink-700 bg-gradient-to-r from-amber-500/[0.05] to-cyan-500/[0.05] p-6 text-center">
          <div className="text-sm text-ink-300">Sen de Türkçe AI ile sinematik video üret</div>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 px-4 py-2 text-sm font-semibold"
          >
            <Sparkles className="h-4 w-4" />
            Vibe Studio'yu dene
          </Link>
        </div>
      </main>
    </div>
  );
}
