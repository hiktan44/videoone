import { NextResponse } from "next/server";
import { createTask } from "@/lib/kie";

export const runtime = "nodejs";

function asStringArray(v: unknown): string[] | undefined {
  return Array.isArray(v) ? v.filter((s) => typeof s === "string" && s) as string[] : undefined;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const prompt = String(body?.prompt ?? "").trim();
  const modelDisplayName = String(body?.model ?? "Google Veo 3.1 Fast");
  const imageUrls = asStringArray(body?.imageUrls);
  const audioUrls = asStringArray(body?.audioUrls);
  const videoUrls = asStringArray(body?.videoUrls);
  const taskIdInput: string | undefined = typeof body?.taskIdInput === "string" ? body.taskIdInput : undefined;
  const aspect_ratio: string | undefined = body?.aspect_ratio || body?.aspectRatio;
  const duration: number | undefined = typeof body?.duration === "number" ? body.duration : undefined;

  const hasAnyInput =
    prompt || (imageUrls && imageUrls.length) || (audioUrls && audioUrls.length) ||
    (videoUrls && videoUrls.length) || taskIdInput;
  if (!hasAnyInput) {
    return NextResponse.json(
      { error: "Prompt, görsel, ses, video veya task_id girdilerinden en az biri gerekli." },
      { status: 400 }
    );
  }

  const task = await createTask({
    prompt, modelDisplayName, imageUrls, audioUrls, videoUrls, taskIdInput, aspect_ratio, duration,
  });
  if (task.status === "failed") {
    return NextResponse.json(task, { status: 502 });
  }
  return NextResponse.json(task);
}
