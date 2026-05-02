// GET /api/health/kie -> Kie API key + bağlantı testi
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const hasKey = !!process.env.KIE_API_KEY;
  const keyLen = process.env.KIE_API_KEY?.length || 0;
  if (!hasKey) {
    return NextResponse.json({
      ok: false,
      reason: "KIE_API_KEY environment variable is not set",
      coolifyHint: "Coolify → App → Environment → Add KIE_API_KEY",
    }, { status: 503 });
  }
  // Light ping — Kie auth check (recordInfo random taskId 404 dönerse OK)
  try {
    const res = await fetch("https://api.kie.ai/api/v1/jobs/recordInfo?taskId=ping", {
      headers: { Authorization: `Bearer ${process.env.KIE_API_KEY}` },
      cache: "no-store",
    });
    const text = await res.text();
    return NextResponse.json({
      ok: res.status < 500,
      status: res.status,
      keyLen,
      response: text.slice(0, 300),
    }, { status: res.status < 500 ? 200 : 502 });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      reason: e instanceof Error ? e.message : "fetch error",
      keyLen,
    }, { status: 502 });
  }
}
