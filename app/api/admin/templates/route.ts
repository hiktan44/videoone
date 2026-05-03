// POST /api/admin/templates
// Body: { jobId?, projectId?, name, category, description?, gradient?, makePublic? }
// Sadece admin: bir başarılı job veya proje → public template'e dönüştürür.
//
// İki yol:
//   1. jobId verilirse: O job'un resultUrl'inden tek-klipli yeni şablon-proje oluşturur
//   2. projectId verilirse: Mevcut projenin kopyasını isTemplate=true + isPublic=true yapar
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const DEFAULT_GRADIENT = "from-purple-500 via-pink-500 to-amber-400";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Sadece admin" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const category = String(body.category || "Genel");
  const description = body.description ? String(body.description) : null;
  const gradient = String(body.gradient || DEFAULT_GRADIENT);
  const makePublic = body.makePublic !== false;
  if (!name) return NextResponse.json({ error: "name gerekli" }, { status: 400 });

  // Yol 1: jobId
  if (body.jobId) {
    const job = await prisma.generationJob.findUnique({ where: { id: String(body.jobId) } });
    if (!job) return NextResponse.json({ error: "Job bulunamadı" }, { status: 404 });
    if (job.status !== "succeeded" || !job.resultUrl) {
      return NextResponse.json({ error: "Sadece başarılı job'lar şablon olabilir" }, { status: 400 });
    }
    const meta = (job.metadata as any) || {};
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name,
        gradient,
        isTemplate: true,
        isPublic: makePublic,
        templateCategory: category,
        thumbnailUrl: job.resultUrl,
        settings: {
          aspectRatio: meta.aspectRatio || "16:9",
          videoResolution: "720p",
          videoModel: meta.model || "Veo 3.1 Fast",
          captionsEnabled: true,
          globalStyle: meta.globalStyle || "",
          globalStyleEnabled: !!meta.globalStyle,
          templateDescription: description,
          templateSourcePrompt: job.prompt,
        },
        clips: {
          create: [
            {
              trackId: "video",
              label: name.slice(0, 40),
              startTime: 0,
              duration: meta.duration || 5,
              sourceUrl: job.resultUrl,
              gradient: gradient,
            },
          ],
        },
      },
    });
    return NextResponse.json({ ok: true, templateId: project.id }, { status: 201 });
  }

  // Yol 2: projectId — mevcut projenin kopyasını şablon yap
  if (body.projectId) {
    const src = await prisma.project.findUnique({
      where: { id: String(body.projectId) },
      include: { clips: true, characters: true },
    });
    if (!src) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });

    const exportableClips = src.clips.filter((c) => c.trackId === "video" && c.sourceUrl);
    if (exportableClips.length === 0) {
      return NextResponse.json({ error: "En az 1 video klipli proje gerekli" }, { status: 400 });
    }

    const settings = (src.settings as any) || {};
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name,
        gradient,
        isTemplate: true,
        isPublic: makePublic,
        templateCategory: category,
        thumbnailUrl: exportableClips[0].sourceUrl || undefined,
        settings: {
          ...settings,
          templateDescription: description,
        },
        clips: {
          create: src.clips.map((c) => ({
            trackId: c.trackId,
            label: c.label,
            startTime: c.startTime,
            duration: c.duration,
            sourceUrl: c.sourceUrl,
            gradient: c.gradient,
            text: c.text,
            transitionAfter: c.transitionAfter,
          })),
        },
      },
    });
    return NextResponse.json({ ok: true, templateId: project.id }, { status: 201 });
  }

  return NextResponse.json({ error: "jobId veya projectId gerekli" }, { status: 400 });
}

// GET /api/admin/templates -> mevcut public şablonları listele
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Sadece admin" }, { status: 403 });

  const templates = await prisma.project.findMany({
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
      _count: { select: { clips: true } },
    },
  });
  return NextResponse.json({ templates });
}

// DELETE /api/admin/templates?id=...
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Sadece admin" }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
