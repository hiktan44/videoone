// GET /api/stock/images?q=...&page=1&per_page=24
import { NextResponse } from "next/server";
import { searchImages } from "@/lib/pexels";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!process.env.PEXELS_API_KEY) {
    return NextResponse.json({ error: "PEXELS_API_KEY tanımlı değil" }, { status: 503 });
  }
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const perPage = Math.min(40, Math.max(1, Number(url.searchParams.get("per_page") || 24)));
  if (!q) return NextResponse.json({ items: [], total: 0 });

  try {
    const data = await searchImages(q, perPage, page);
    const items = data.items.map((p) => ({
      id: p.id,
      kind: "image" as const,
      title: p.alt || `Görsel ${p.id}`,
      thumbnailUrl: p.src.medium,
      sourceUrl: p.src.large,
      originalUrl: p.src.original,
      photographer: p.photographer,
      pageUrl: p.url,
    }));
    return NextResponse.json({ items, total: data.total });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Pexels hatası" },
      { status: 502 }
    );
  }
}
