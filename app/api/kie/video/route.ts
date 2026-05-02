import { NextResponse } from "next/server";
import { createTask } from "@/lib/kie";
import { chargeForGeneration } from "@/lib/charge-helper";

export const runtime = "nodejs";

function asStringArray(v: unknown): string[] | undefined {
  return Array.isArray(v) ? (v.filter((s) => typeof s === "string" && s) as string[]) : undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const prompt = String(body?.prompt ?? "").trim();
    const modelDisplayName = String(body?.model ?? "Veo 3.1 Fast");
    const imageUrls = asStringArray(body?.imageUrls);
    const audioUrls = asStringArray(body?.audioUrls);
    const videoUrls = asStringArray(body?.videoUrls);
    const taskIdInput: string | undefined =
      typeof body?.taskIdInput === "string" ? body.taskIdInput : undefined;
    const aspect_ratio: string | undefined = body?.aspect_ratio || body?.aspectRatio;
    const duration: number | undefined =
      typeof body?.duration === "number" ? body.duration : undefined;

    const hasAnyInput =
      prompt ||
      (imageUrls && imageUrls.length) ||
      (audioUrls && audioUrls.length) ||
      (videoUrls && videoUrls.length) ||
      taskIdInput;
    if (!hasAnyInput) {
      return NextResponse.json(
        { error: "Prompt, görsel, ses, video veya task_id girdilerinden en az biri gerekli." },
        { status: 400 }
      );
    }

    let charge;
    try {
      charge = await chargeForGeneration({
        kind: "video",
        durationSec: duration || 5,
        modelDisplayName,
      });
    } catch {
      return NextResponse.json(
        { error: "Yetersiz kredi. Lütfen plan yükselt veya bekle." },
        { status: 402 }
      );
    }

    const task = await createTask({
      prompt,
      modelDisplayName,
      imageUrls,
      audioUrls,
      videoUrls,
      taskIdInput,
      aspect_ratio,
      duration,
    });
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
