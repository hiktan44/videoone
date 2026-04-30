// GET /api/jobs/[id]/stream
// Server-Sent Events (SSE) — bir job'in ilerlemesini Redis pub/sub uzerinden stream eder.
// event: progress  data: { status, progress, resultUrl?, error? }
// event: done                                                 (job tamamlandiginda)

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subscribeToJob } from "@/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;

  const job = await prisma.generationJob.findFirst({ where: { id, userId: user.id } });
  if (!job) return new Response("Not found", { status: 404 });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));

      // Ilk durum push
      send("progress", {
        status: job.status,
        progress: job.progress,
        resultUrl: job.resultUrl,
        error: job.error,
      });

      // Eger zaten tamamlanmissa direkt kapat
      if (job.status === "succeeded" || job.status === "failed") {
        send("done", { final: true });
        controller.close();
        return;
      }

      let unsubscribe: (() => void) | null = null;
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      unsubscribe = subscribeToJob(id, (update) => {
        send("progress", update);
        if (update.status === "succeeded" || update.status === "failed") {
          send("done", { final: true });
          clearInterval(heartbeat);
          unsubscribe?.();
          try {
            controller.close();
          } catch {}
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
