// GET /api/health/kie-video?model=Kling%203.0%20Pro
// Default model'le veya verilenle bir test video task'ı dener, Kie'nin döndüğü RAW response'u gösterir.
// Auth gerekmez (sadece teşhis için, kredi düşürmez).
import { NextResponse } from "next/server";
import { getMapping } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!process.env.KIE_API_KEY) {
    return NextResponse.json({ ok: false, reason: "KIE_API_KEY yok" }, { status: 503 });
  }
  const url = new URL(req.url);
  const modelDisplay = url.searchParams.get("model") || "Veo 3.1 Fast";
  const mapping = getMapping(modelDisplay);

  // Veo özel endpoint
  let endpoint = "https://api.kie.ai/api/v1/jobs/createTask";
  let body: any = {
    model: mapping.jobsModelId,
    input: { prompt: "test, silent, no text", aspect_ratio: "16:9", duration: 5 },
  };
  if (mapping.family === "veo") {
    endpoint = "https://api.kie.ai/api/v1/veo/generate";
    body = { model: mapping.veoModel, prompt: "test, silent, no text", aspect_ratio: "16:9", duration: 5 };
  }

  let kieResp: any;
  let httpStatus = 0;
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    httpStatus = r.status;
    const text = await r.text();
    try { kieResp = JSON.parse(text); } catch { kieResp = text; }
  } catch (e) {
    return NextResponse.json({
      ok: false,
      reason: "fetch error",
      error: e instanceof Error ? e.message : "?",
      requestEndpoint: endpoint,
      requestBody: body,
    }, { status: 502 });
  }

  return NextResponse.json({
    ok: httpStatus < 400,
    httpStatus,
    modelDisplay,
    mapping,
    requestEndpoint: endpoint,
    requestBody: body,
    kieResponse: kieResp,
  });
}
