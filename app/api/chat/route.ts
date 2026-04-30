// POST /api/chat
// Body: { projectId?: string, message: string }
// Stream: Server-Sent Events
//   event: token   data: {"text": "..."}              -> assistant metni parça parça
//   event: tool    data: {"name": "...", "args": {}}  -> tool çağrısı yakalandı
//   event: done    data: {"messageId": "..."}         -> stream bitti, DB'ye yazıldı
//   event: error   data: {"message": "..."}           -> hata

import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CHAT_SYSTEM_PROMPT, CHAT_TOOLS } from "@/lib/openai-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENAI_MODEL || "gpt-5";
const MAX_HISTORY = 30;

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY tanımlı değil" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const projectId = body.projectId ? String(body.projectId) : null;
  const userMessage = String(body.message || "").trim();
  if (!userMessage) {
    return new Response(JSON.stringify({ error: "Mesaj boş olamaz" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Proje sahibi kontrolü (varsa)
  if (projectId) {
    const owns = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
    if (!owns) {
      return new Response(JSON.stringify({ error: "Proje bulunamadı" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
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

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sse(event, data)));

      let fullText = "";
      const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

      try {
        const completion = await openai.chat.completions.create({
          model: MODEL,
          stream: true,
          tools: CHAT_TOOLS,
          messages: [
            { role: "system", content: CHAT_SYSTEM_PROMPT },
            ...history,
            { role: "user", content: userMessage },
          ],
        });

        // Tool çağrılarını biriktir (stream parçalarda gelir)
        const toolCallBuffers: Record<number, { name: string; argsStr: string }> = {};

        for await (const chunk of completion) {
          const choice = chunk.choices?.[0];
          if (!choice) continue;
          const delta = choice.delta;

          if (delta?.content) {
            fullText += delta.content;
            send("token", { text: delta.content });
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolCallBuffers[idx]) toolCallBuffers[idx] = { name: "", argsStr: "" };
              if (tc.function?.name) toolCallBuffers[idx].name = tc.function.name;
              if (tc.function?.arguments) toolCallBuffers[idx].argsStr += tc.function.arguments;
            }
          }
        }

        // Tool çağrılarını parse et ve stream'e gönder
        for (const buf of Object.values(toolCallBuffers)) {
          if (!buf.name) continue;
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(buf.argsStr);
          } catch {}
          toolCalls.push({ name: buf.name, args });
          send("tool", { name: buf.name, args });
        }

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
