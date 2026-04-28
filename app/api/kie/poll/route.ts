import { NextResponse } from "next/server";
import { getTaskStatus } from "@/lib/kie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = (searchParams.get("taskId") ?? "").trim();
  const family = (searchParams.get("family") ?? "").trim() || undefined;

  if (!taskId) {
    return NextResponse.json(
      { error: "taskId parametresi gerekli." },
      { status: 400 }
    );
  }

  const task = await getTaskStatus(taskId, family);
  return NextResponse.json(task, {
    headers: { "Cache-Control": "no-store" },
  });
}
