import { NextResponse } from "next/server";
import { createTask } from "@/lib/kie";
import { chargeForGeneration } from "@/lib/charge-helper";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const prompt = String(body?.prompt ?? "").trim();
    const modelDisplayName = String(body?.model ?? "GPT Image 2");
    const imageUrls: string[] | undefined = Array.isArray(body?.imageUrls)
      ? body.imageUrls.filter((s: any) => typeof s === "string" && s)
      : undefined;
    const aspect_ratio: string | undefined = body?.aspect_ratio || body?.aspectRatio;

    if (!prompt && (!imageUrls || imageUrls.length === 0)) {
      return NextResponse.json(
        { error: "İstek metni (prompt) veya referans görsel gerekli." },
        { status: 400 }
      );
    }

    let charge;
    try {
      charge = await chargeForGeneration({ kind: "image", modelDisplayName });
    } catch {
      return NextResponse.json(
        { error: "Yetersiz kredi. Lütfen plan yükselt veya bekle." },
        { status: 402 }
      );
    }

    const task = await createTask({ prompt, modelDisplayName, imageUrls, aspect_ratio });
    if (task.status === "failed") {
      await charge.refund();
      return NextResponse.json(task, { status: 502 });
    }
    return NextResponse.json(task);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sunucu hatası" },
      { status: 500 }
    );
  }
}
