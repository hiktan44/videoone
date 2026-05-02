// GET  /api/brand-kit -> mevcut kullanicinin brand kit'i
// PUT  /api/brand-kit -> guncelle (kismi merge)
// DELETE /api/brand-kit -> sifirla
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_BRAND_KIT, BRAND_KIT_FIELDS, type BrandKit } from "@/lib/brand-kit";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { brandKit: true } });
  const kit = (u?.brandKit as BrandKit) || DEFAULT_BRAND_KIT;
  return NextResponse.json({ brandKit: { ...DEFAULT_BRAND_KIT, ...kit } });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Partial<BrandKit>;
  const cleaned: BrandKit = {};
  for (const k of BRAND_KIT_FIELDS) {
    if (k in body) (cleaned as any)[k] = (body as any)[k];
  }
  const existing = await prisma.user.findUnique({ where: { id: user.id }, select: { brandKit: true } });
  const merged = { ...((existing?.brandKit as BrandKit) || {}), ...cleaned };
  await prisma.user.update({ where: { id: user.id }, data: { brandKit: merged } });
  return NextResponse.json({ brandKit: { ...DEFAULT_BRAND_KIT, ...merged } });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.update({ where: { id: user.id }, data: { brandKit: {} } });
  return NextResponse.json({ ok: true, brandKit: DEFAULT_BRAND_KIT });
}
