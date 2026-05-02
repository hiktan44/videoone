import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { Globe, ArrowRight, Tv } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ChannelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/channel");

  let channel = await prisma.channel.findUnique({
    where: { userId: user.id },
  });

  // Yoksa otomatik oluştur
  if (!channel) {
    const baseSlug =
      (user.name || user.email.split("@")[0])
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 30) || `user-${user.id.slice(0, 6)}`;
    let slug = baseSlug;
    let suffix = 0;
    while (await prisma.channel.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
    channel = await prisma.channel.create({
      data: { userId: user.id, slug },
    });
  }

  const publishedCount = await prisma.project.count({
    where: { userId: user.id, isPublic: true },
  });

  const publicUrl = `/u/${channel.slug}`;
  const fullUrl =
    (process.env.NEXT_PUBLIC_APP_URL || "https://videoone.com.tr") + publicUrl;

  return (
    <AppShell title="Kanalım" subtitle="Yayınladığın videoları takip eden herkesin gördüğü yer">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kanal kart */}
        <div className="rounded-2xl border border-ink-700 bg-ink-900/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-vibe flex items-center justify-center text-xl font-bold text-ink-950">
              {(user.name || user.email).slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold text-ink-50">
                {user.name || user.email.split("@")[0]}
              </div>
              <div className="text-xs text-ink-400">@{channel.slug}</div>
            </div>
          </div>
          <div className="text-xs text-ink-300 mb-4">
            <Tv className="h-3.5 w-3.5 inline mr-1 text-cyan-400" />
            {publishedCount} yayınlanmış video
          </div>
          <Link
            href={publicUrl}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Globe className="h-4 w-4" />
            Public Kanalı Görüntüle
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* URL kart */}
        <div className="rounded-2xl border border-ink-700 bg-ink-900/40 p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">
            Kanal Linkin
          </div>
          <div className="rounded-lg bg-ink-950 border border-ink-700 px-3 py-2 text-xs text-cyan-300 font-mono break-all mb-3">
            {fullUrl}
          </div>
          <div className="text-[11px] text-ink-400 leading-relaxed">
            Bu link'i sosyal medyada paylaş — ziyaretçiler tüm yayınladığın
            videoları tek yerden izleyebilir. Yeni video yayınladığında otomatik listeye eklenir.
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/shared"
          className="text-sm text-ink-300 hover:text-amber-300 transition-colors"
        >
          ← Yayınlanan projelerim
        </Link>
      </div>
    </AppShell>
  );
}
