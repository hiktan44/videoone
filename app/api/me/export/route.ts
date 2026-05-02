// GET /api/me/export
// GDPR Madde 20 / KVKK Madde 11 — kullanicinin kisisel verilerinin tasinabilir kopyasi.
// JSON dosyasi olarak indirir (yapilandirilmis, makine-okunabilir).
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [
    profile, projects, jobs, ledger, subscriptions, assets, channel,
    referralsMade, referralReceived, versions, chatMessages,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id } }),
    prisma.project.findMany({
      where: { userId: user.id },
      include: { clips: true, characters: true },
    }),
    prisma.generationJob.findMany({ where: { userId: user.id } }),
    prisma.creditLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.subscription.findMany({ where: { userId: user.id } }),
    prisma.mediaAsset.findMany({ where: { userId: user.id } }),
    prisma.channel.findUnique({ where: { userId: user.id } }).catch(() => null),
    prisma.referral.findMany({ where: { referrerUserId: user.id } }),
    prisma.referral.findUnique({ where: { refereeUserId: user.id } }).catch(() => null),
    prisma.projectVersion.findMany({
      where: { project: { userId: user.id } },
      select: { id: true, projectId: true, label: true, createdAt: true },
    }),
    prisma.chatMessage.findMany({ where: { project: { userId: user.id } } }).catch(() => []),
  ]);

  const dump = {
    metadata: {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      format: "vibe-studio-data-export-v1",
      legal: {
        kvkk: "Türkiye 6698 sayılı KVKK Madde 11 — Veri Sahibinin Hakları kapsamında talep edilmiştir.",
        gdpr: "EU GDPR Article 20 — Right to data portability kapsamında talep edilmiştir.",
        notes: "Bu dosya kişisel verilerinizin makine-okunabilir kopyasıdır. Bir başka servise aktarabilirsiniz.",
      },
    },
    profile,
    projects,
    projectVersions: versions,
    chatMessages,
    generationJobs: jobs,
    creditLedger: ledger,
    subscriptions,
    mediaAssets: assets,
    channel,
    referrals: { made: referralsMade, received: referralReceived },
  };

  const json = JSON.stringify(dump, null, 2);
  const filename = `vibe-studio-data-${user.id}-${new Date().toISOString().slice(0, 10)}.json`;
  return new Response(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
