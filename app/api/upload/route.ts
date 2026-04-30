// POST /api/upload
// Body: { kind: "image"|"video"|"audio"|"speech"|"music", filename: string, contentType: string, sizeBytes?: number, projectId?: string }
// Doner: { uploadUrl, key, publicUrl, assetId }
//
// Tarayici uploadUrl'e direkt PUT eder (R2'ye), tamamlandiktan sonra UI url'i kullanir.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { presignUpload, isConfigured, buildKey } from "@/lib/r2";

export const runtime = "nodejs";

const ALLOWED_KINDS = ["image", "video", "audio", "speech", "music"] as const;
const MAX_BYTES = 200 * 1024 * 1024; // 200MB

export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "R2 yapılandırılmamış" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const kind = String(body.kind || "");
  const filename = String(body.filename || "asset");
  const contentType = String(body.contentType || "application/octet-stream");
  const sizeBytes = Number(body.sizeBytes || 0);
  const projectId = body.projectId ? String(body.projectId) : undefined;

  if (!ALLOWED_KINDS.includes(kind as any)) {
    return NextResponse.json({ error: "Geçersiz kind" }, { status: 400 });
  }
  if (sizeBytes && sizeBytes > MAX_BYTES) {
    return NextResponse.json({ error: "Dosya çok büyük (max 200MB)" }, { status: 413 });
  }
  if (projectId) {
    const owns = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
    if (!owns) return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
  }

  const ext = filename.includes(".") ? filename.split(".").pop()! : "bin";
  const key = buildKey(user.id, kind, ext);
  const presigned = await presignUpload(key, contentType);

  // DB'ye placeholder asset olustur (yukleme bittikten sonra UI guncelleyecek)
  const asset = await prisma.mediaAsset.create({
    data: {
      userId: user.id,
      projectId,
      kind,
      title: filename.slice(0, 120),
      url: presigned.publicUrl ?? presigned.uploadUrl,
      storageKey: key,
      sizeBytes: sizeBytes || null,
    },
  });

  return NextResponse.json({
    assetId: asset.id,
    uploadUrl: presigned.uploadUrl,
    key,
    publicUrl: presigned.publicUrl,
  });
}
