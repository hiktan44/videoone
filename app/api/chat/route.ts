// POST /api/chat
// Body: { projectId?: string, message: string }
// Stream: Server-Sent Events
//   event: token   data: {"text": "..."}              -> assistant metni parça parça
//   event: tool    data: {"name": "...", "args": {}}  -> tool çağrısı yakalandı
//   event: done    data: {"messageId": "..."}         -> stream bitti, DB'ye yazıldı
//   event: error   data: {"message": "..."}           -> hata

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CHAT_SYSTEM_PROMPT, CHAT_TOOLS } from "@/lib/openai-tools";
import { chatCompletionStream } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HISTORY = 30;

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (!process.env.KIE_API_KEY && !process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "KIE_API_KEY veya OPENAI_API_KEY tanımlı değil" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const rawProjectId = body.projectId ? String(body.projectId) : null;
  const userMessage = String(body.message || "").trim();
  if (!userMessage) {
    return new Response(JSON.stringify({ error: "Mesaj boş olamaz" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Proje DB'de varsa kullan, yoksa null'a düşür (chat hala çalışsın, mesajlar kaydedilmesin)
  let projectId: string | null = null;
  if (rawProjectId) {
    const owns = await prisma.project.findFirst({
      where: { id: rawProjectId, userId: user.id },
    });
    if (owns) {
      projectId = rawProjectId;
    }
    // owns null ise = LS-only proje, projectId null bırakılır
  }

  // Geçmiş mesajları al
  let history: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];
  if (projectId) {
    const past = await prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      take: MAX_HISTORY,
    });
    history = past
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  }

  // Kullanıcı mesajını DB'ye kaydet
  if (projectId) {
    await prisma.chatMessage.create({
      data: { projectId, role: "user", content: userMessage },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sse(event, data)));

      let fullText = "";
      const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

      try {
        await chatCompletionStream(
          {
            messages: [
              { role: "system", content: CHAT_SYSTEM_PROMPT },
              ...history,
              { role: "user", content: userMessage },
            ],
            tools: CHAT_TOOLS as any,
            temperature: 0.7,
          },
          (event, data) => {
            if (event === "token") {
              fullText += data.text || "";
              send("token", { text: data.text });
            } else if (event === "tool") {
              toolCalls.push({ name: data.name, args: data.args });
              send("tool", { name: data.name, args: data.args });
            }
          }
        );

        // DB'ye assistant mesajını kaydet
        let savedMessageId: string | null = null;
        if (projectId) {
          const saved = await prisma.chatMessage.create({
            data: {
              projectId,
              role: "assistant",
              content: fullText,
              toolName: toolCalls[0]?.name ?? null,
              toolArgs: toolCalls.length > 0 ? (toolCalls as unknown as object) : undefined,
            },
          });
          savedMessageId = saved.id;
        }

        send("done", { messageId: savedMessageId });
        controller.close();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
        send("error", { message: msg });
        controller.close();
      }
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
