// GET  /api/brand-kit -> mevcut kullanicinin brand kit'i
// PUT  /api/brand-kit -> guncelle (kismi merge)
// DELETE /api/brand-kit -> sifirla
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export type BrandKit = {
  primaryColor?: string;   // #hex
  accentColor?: string;
  bgColor?: string;
  fontFamily?: string;     // "Inter" | "Poppins" | "Montserrat" | "Roboto" | custom
  logoUrl?: string;        // R2 url
  watermark?: boolean;     // true -> exporta logo overlay'i ekle
  watermarkPosition?: "tl" | "tr" | "bl" | "br";
  intro?: string;          // intro video url (export basinda eklenir)
  outro?: string;          // outro url
  defaultAspect?: string;  // "16:9" | "9:16" | ...
  defaultResolution?: string; // "720p" | "1080p" | "4K"
  globalStyle?: string;    // varsayilan sinematik stil
  voicePreference?: string;// kullanici sevdigi voice model
};

export const DEFAULT_BRAND_KIT: BrandKit = {
  primaryColor: "#A855F7",
  accentColor: "#F59E0B",
  bgColor: "#0A0A0B",
  fontFamily: "Inter",
  watermark: false,
  watermarkPosition: "br",
  defaultAspect: "16:9",
  defaultResolution: "720p",
  globalStyle: "",
};

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
  // Sadece izin verilen alanlar
  const allowed: (keyof BrandKit)[] = [
    "primaryColor", "accentColor", "bgColor", "fontFamily", "logoUrl",
    "watermark", "watermarkPosition", "intro", "outro",
    "defaultAspect", "defaultResolution", "globalStyle", "voicePreference",
  ];
  const cleaned: BrandKit = {};
  for (const k of allowed) {
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
