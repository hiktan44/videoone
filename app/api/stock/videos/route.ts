// GET /api/stock/videos?q=...&page=1&per_page=24
import { NextResponse } from "next/server";
import { searchVideos, pickBestVideoFile } from "@/lib/pexels";

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
    const data = await searchVideos(q, perPage, page);
    const items = data.items
      .map((v) => {
        const file = pickBestVideoFile(v);
        if (!file) return null;
        return {
          id: v.id,
          kind: "video" as const,
          title: `${v.user?.name || "Pexels"} · ${v.duration}s`,
          thumbnailUrl: v.image,
          sourceUrl: file.url,
          duration: v.duration,
          width: file.width,
          height: file.height,
          author: v.user?.name,
          pageUrl: v.url,
        };
      })
      .filter(Boolean);
    return NextResponse.json({ items, total: data.total });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Pexels hatası" },
      { status: 502 }
    );
  }
}
