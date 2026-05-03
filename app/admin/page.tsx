// /admin — Sadece role=admin gorebilir.
// DB istatistikleri + PostHog analitikleri + son kullanicilar.

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAnalyticsSummary, getRecentEvents, isPostHogServerConfigured } from "@/lib/posthog-server";
import {
  Users,
  Folder,
  Coins,
  Activity,
  TrendingUp,
  Eye,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/admin");
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-ink-950 text-ink-50 flex items-center justify-center p-4">
        <div className="rounded-2xl border border-coral-500/30 bg-coral-500/10 p-8 max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-coral-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-coral-200">Erişim Yok</h1>
          <p className="mt-2 text-sm text-ink-300">Bu sayfa sadece admin rolüne sahip kullanıcılar içindir.</p>
          <p className="mt-3 text-xs text-ink-400">
            Hesabını admin yapmak için DB'de manuel:
            <br />
            <code className="text-amber-300 break-all">
              UPDATE &quot;User&quot; SET role=&apos;admin&apos; WHERE email=&apos;{user.email}&apos;;
            </code>
          </p>
          <Link href="/" className="mt-6 inline-block text-sm text-amber-300 hover:text-amber-200">
            ← Ana sayfa
          </Link>
        </div>
      </div>
    );
  }

  // Paralel data fetch
  const [
    userCount,
    projectCount,
    jobsByStatus,
    activeSubscriptions,
    creditTotal,
    recentUsers,
    analytics,
    recentEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.generationJob.groupBy({ by: ["status"], _count: true }),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.user.aggregate({ _sum: { creditBalance: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        creditBalance: true,
        createdAt: true,
        _count: { select: { projects: true, jobs: true } },
      },
    }),
    getAnalyticsSummary(),
    getRecentEvents(15),
  ]);

  const phConfigured = isPostHogServerConfigured();
  const phData = "error" in analytics ? null : analytics;
  const phError = "error" in analytics ? analytics.error : null;

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      <header className="border-b border-ink-800 bg-ink-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-ink-300 hover:text-ink-50">
              ← Ana Sayfa
            </Link>
            <span className="text-ink-600">/</span>
            <span className="text-sm font-bold text-amber-300">Admin Panel</span>
            <Link
              href="/admin/users"
              className="ml-4 text-xs text-cyan-300 hover:text-cyan-200"
            >
              Kullanıcılar →
            </Link>
            <Link
              href="/admin/templates"
              className="ml-2 text-xs text-amber-300 hover:text-amber-200"
            >
              Şablonlar →
            </Link>
          </div>
          <div className="text-xs text-ink-400">
            <span className="text-amber-300">{user.email}</span>
            <span className="ml-2 text-[10px] uppercase tracking-wider rounded bg-amber-500/15 px-2 py-0.5 text-amber-300">
              admin
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-ink-100">Platform Özeti</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI icon={Users} label="Toplam Kullanıcı" value={userCount.toString()} accent="amber" />
            <KPI icon={Folder} label="Toplam Proje" value={projectCount.toString()} accent="cyan" />
            <KPI
              icon={Coins}
              label="Toplam Kredi"
              value={(creditTotal._sum.creditBalance || 0).toLocaleString("tr-TR")}
              accent="amber"
            />
            <KPI
              icon={CheckCircle2}
              label="Aktif Abonelik"
              value={activeSubscriptions.toString()}
              accent="emerald"
            />
          </div>
        </section>

        {/* Job durumu */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-ink-100">Üretim İşleri</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {["queued", "running", "succeeded", "failed", "refunded"].map((s) => {
              const count = jobsByStatus.find((j) => j.status === s)?._count || 0;
              const colorMap: Record<string, string> = {
                queued: "text-ink-300",
                running: "text-amber-300",
                succeeded: "text-emerald-400",
                failed: "text-coral-400",
                refunded: "text-cyan-300",
              };
              return (
                <div key={s} className="rounded-xl border border-ink-700 bg-ink-900/40 p-4">
                  <div className={`text-2xl font-bold ${colorMap[s]}`}>{count}</div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-400 mt-1">{s}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PostHog Analytics */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-ink-100">PostHog Analitik (7 gün)</h2>
            {phConfigured && process.env.POSTHOG_PROJECT_ID && (
              <a
                href={`https://eu.posthog.com/project/${process.env.POSTHOG_PROJECT_ID}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1"
              >
                PostHog Dashboard <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </div>

          {!phConfigured && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              <strong>PostHog server-side henüz yapılandırılmamış.</strong> Coolify env vars'a ekle (Runtime ✅, Buildtime ❌):
              <pre className="mt-2 text-[11px] text-ink-200 bg-ink-950 p-2 rounded overflow-x-auto">{`POSTHOG_PERSONAL_API_KEY=phx_...
POSTHOG_PROJECT_ID=170639
POSTHOG_HOST=https://eu.posthog.com`}</pre>
            </div>
          )}

          {phError && (
            <div className="rounded-xl border border-coral-500/30 bg-coral-500/10 p-4 text-sm text-coral-200">
              ⚠️ {phError}
            </div>
          )}

          {phData && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <KPI
                  icon={Activity}
                  label="Event Toplam 7d"
                  value={phData.totalEvents7d.toLocaleString("tr-TR")}
                  accent="cyan"
                />
                <KPI
                  icon={TrendingUp}
                  label="Event 24h"
                  value={phData.totalEvents24h.toLocaleString("tr-TR")}
                  accent="amber"
                />
                <KPI
                  icon={Users}
                  label="Tekil Kullanıcı 7d"
                  value={phData.uniqueUsers7d.toString()}
                  accent="amber"
                />
                <KPI
                  icon={CheckCircle2}
                  label="Kayıt 7d"
                  value={phData.signups7d.toString()}
                  accent="emerald"
                />
                <KPI
                  icon={Eye}
                  label="Aktif Oturum (1h)"
                  value={phData.activeRecentSessions.toString()}
                  accent="coral"
                />
              </div>

              {phData.topEvents.length > 0 && (
                <div className="mt-4 rounded-xl border border-ink-700 bg-ink-900/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">
                    En Çok Tetiklenen Event&apos;ler (7g)
                  </div>
                  <div className="space-y-1.5">
                    {phData.topEvents.map((e) => {
                      const max = phData.topEvents[0]?.count || 1;
                      const pct = (e.count / max) * 100;
                      return (
                        <div key={e.event} className="flex items-center gap-2">
                          <code className="text-xs text-ink-200 w-44 truncate">{e.event}</code>
                          <div className="flex-1 h-2 bg-ink-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-amber" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-xs text-amber-300 tabular-nums w-16 text-right">
                            {e.count.toLocaleString("tr-TR")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Recent events */}
        {recentEvents.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3 text-ink-100">Son Etkinlikler (PostHog)</h2>
            <div className="rounded-xl border border-ink-700 bg-ink-900/40 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-ink-900 text-ink-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2">Zaman</th>
                    <th className="text-left px-3 py-2">Event</th>
                    <th className="text-left px-3 py-2">Distinct ID</th>
                    <th className="text-left px-3 py-2">URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800">
                  {recentEvents.map((e, i) => (
                    <tr key={i} className="hover:bg-ink-900/60">
                      <td className="px-3 py-1.5 text-ink-300 tabular-nums">
                        {e.timestamp ? new Date(e.timestamp).toLocaleString("tr-TR") : "-"}
                      </td>
                      <td className="px-3 py-1.5">
                        <code className="text-amber-300">{e.event}</code>
                      </td>
                      <td className="px-3 py-1.5 text-ink-400 truncate max-w-[180px]">
                        {e.distinctId}
                      </td>
                      <td className="px-3 py-1.5 text-ink-500 truncate max-w-[300px]">{e.url || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Son kullanıcılar */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-ink-100">Son Kayıt Olanlar</h2>
            <Link
              href="/admin/users"
              className="text-xs text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1"
            >
              Tümünü yönet <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-xl border border-ink-700 bg-ink-900/40 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-ink-900 text-ink-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">İsim</th>
                  <th className="text-left px-3 py-2">Plan</th>
                  <th className="text-right px-3 py-2">Kredi</th>
                  <th className="text-right px-3 py-2">Proje</th>
                  <th className="text-right px-3 py-2">İş</th>
                  <th className="text-right px-3 py-2">Kayıt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {recentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-ink-900/60">
                    <td className="px-3 py-1.5 text-ink-100">{u.email}</td>
                    <td className="px-3 py-1.5 text-ink-300">{u.name || "—"}</td>
                    <td className="px-3 py-1.5">
                      <span
                        className={
                          u.plan === "pro"
                            ? "text-amber-300 font-medium"
                            : u.plan === "max"
                            ? "text-cyan-300 font-medium"
                            : "text-ink-400"
                        }
                      >
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right text-amber-300 tabular-nums">
                      {u.creditBalance.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-3 py-1.5 text-right text-ink-400 tabular-nums">
                      {u._count.projects}
                    </td>
                    <td className="px-3 py-1.5 text-right text-ink-400 tabular-nums">
                      {u._count.jobs}
                    </td>
                    <td className="px-3 py-1.5 text-right text-ink-400 tabular-nums">
                      {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  accent: "amber" | "cyan" | "coral" | "emerald";
}) {
  const colorMap = {
    amber: { bg: "bg-amber-500/10", ring: "ring-amber-500/20", text: "text-amber-300", icon: "text-amber-400" },
    cyan: { bg: "bg-cyan-500/10", ring: "ring-cyan-500/20", text: "text-cyan-300", icon: "text-cyan-400" },
    coral: { bg: "bg-coral-500/10", ring: "ring-coral-500/20", text: "text-coral-300", icon: "text-coral-400" },
    emerald: {
      bg: "bg-emerald-500/10",
      ring: "ring-emerald-500/20",
      text: "text-emerald-300",
      icon: "text-emerald-400",
    },
  };
  const c = colorMap[accent];
  return (
    <div className={`rounded-xl border border-ink-700 ${c.bg} p-4 ring-1 ${c.ring}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${c.icon}`} />
        <div className="text-[10px] uppercase tracking-wider text-ink-400">{label}</div>
      </div>
      <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
    </div>
  );
}
