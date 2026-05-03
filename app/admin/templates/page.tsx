// /admin/templates — Admin: başarılı üretimleri şablona dönüştür
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminTemplatesClient } from "@/components/AdminTemplatesClient";
import { AlertCircle } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/admin/templates");
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-ink-950 text-ink-50 flex items-center justify-center p-4">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 max-w-md text-center">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-rose-200">Erişim Yok</h1>
          <p className="mt-2 text-sm text-ink-300">Bu sayfa sadece admin rolüne sahip kullanıcılar içindir.</p>
          <Link href="/" className="mt-6 inline-block text-sm text-amber-300 hover:text-amber-200">
            ← Ana sayfa
          </Link>
        </div>
      </div>
    );
  }

  // Son 100 başarılı üretim (video/image kind, resultUrl var)
  const succeeded = await prisma.generationJob.findMany({
    where: {
      status: "succeeded",
      resultUrl: { not: null },
      kind: { in: ["video", "image"] },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      userId: true,
      kind: true,
      prompt: true,
      resultUrl: true,
      metadata: true,
      createdAt: true,
      user: { select: { email: true, name: true } },
    },
  });

  // Mevcut public şablonlar
  const existingTemplates = await prisma.project.findMany({
    where: { isTemplate: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      gradient: true,
      isPublic: true,
      templateCategory: true,
      thumbnailUrl: true,
      createdAt: true,
    },
  });

  // Plain JSON için Date'i string'e çevir
  const succeededSerial = succeeded.map((j) => ({
    ...j,
    createdAt: j.createdAt.toISOString(),
    metadata: j.metadata as any,
  }));
  const templatesSerial = existingTemplates.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      <header className="border-b border-ink-800 bg-ink-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-ink-300 hover:text-ink-50">
              ← Admin
            </Link>
            <span className="text-ink-600">/</span>
            <span className="text-sm font-bold text-amber-300">Şablon Yönetimi</span>
          </div>
          <div className="text-xs text-ink-400">{user.email}</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Şablon Galerisi Yönetimi</h1>
          <p className="text-sm text-ink-400 mt-1">
            Başarılı üretimleri public şablona dönüştürün — kullanıcılar Genel Şablonlar
            sekmesinden bunları kullanabilir.
          </p>
        </div>
        <AdminTemplatesClient
          succeededJobs={succeededSerial}
          existingTemplates={templatesSerial}
        />
      </main>
    </div>
  );
}
