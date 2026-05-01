"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";
import { Plus, Paperclip, ArrowUp, Sparkles, Loader2 } from "lucide-react";
import clsx from "clsx";

type ToolCall = {
  name: string;
  args: Record<string, unknown>;
};

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: string;
  toolCalls?: ToolCall[];
  streaming?: boolean;
};

const FALLBACK_QUICK_ACTIONS = [
  "15 saniyelik İstanbul tanıtım videosu",
  "30s ürün lansmanı için sahne planı",
  "Yumuşak geçişlerle moda reels",
];

export function ChatTab() {
  const projectId = useStore((s) => s.projectId);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Geçmişi yükle (DB'den) — yalnızca cuid (DB) projeler için
  useEffect(() => {
    if (!projectId) return;
    const isApiId = /^c[a-z0-9]{20,}$/i.test(projectId);
    if (!isApiId) return; // localStorage projesi → boş chat
    fetch(`/api/projects/${projectId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.project?.chatMessages) return;
        const loaded: ChatMsg[] = data.project.chatMessages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          meta: m.meta,
          toolCalls: Array.isArray(m.toolArgs) ? (m.toolArgs as ToolCall[]) : undefined,
        }));
        setMessages(loaded);
      })
      .catch(() => {});
  }, [projectId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages]);

  const send = useCallback(
    async (overrideText?: string) => {
      const content = (overrideText ?? text).trim();
      if (!content || streaming) return;

      const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", content };
      const assistantId = `a-${Date.now()}`;
      const assistantMsg: ChatMsg = { id: assistantId, role: "assistant", content: "", streaming: true };
      setMessages((m) => [...m, userMsg, assistantMsg]);
      setText("");
      setStreaming(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, message: content }),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "");
          setMessages((m) =>
            m.map((mm) =>
              mm.id === assistantId
                ? { ...mm, content: `Hata: ${errText || res.status}`, streaming: false }
                : mm
            )
          );
          setStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE parse: "event: name\ndata: {...}\n\n"
          let idx;
          while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const block = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const eventLine = block.split("\n").find((l) => l.startsWith("event:"));
            const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
            if (!eventLine || !dataLine) continue;
            const event = eventLine.slice(6).trim();
            let data: any = null;
            try {
              data = JSON.parse(dataLine.slice(5).trim());
            } catch {
              continue;
            }

            if (event === "token") {
              setMessages((m) =>
                m.map((mm) =>
                  mm.id === assistantId ? { ...mm, content: mm.content + (data.text || "") } : mm
                )
              );
            } else if (event === "tool") {
              setMessages((m) =>
                m.map((mm) =>
                  mm.id === assistantId
                    ? {
                        ...mm,
                        toolCalls: [...(mm.toolCalls || []), { name: data.name, args: data.args }],
                      }
                    : mm
                )
              );
            } else if (event === "done") {
              setMessages((m) =>
                m.map((mm) => (mm.id === assistantId ? { ...mm, streaming: false } : mm))
              );
            } else if (event === "error") {
              setMessages((m) =>
                m.map((mm) =>
                  mm.id === assistantId ? { ...mm, content: `Hata: ${data.message}`, streaming: false } : mm
                )
              );
            }
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network hatası";
        setMessages((m) =>
          m.map((mm) => (mm.id === assistantId ? { ...mm, content: `Hata: ${msg}`, streaming: false } : mm))
        );
      } finally {
        setStreaming(false);
      }
    },
    [text, streaming, projectId]
  );

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const quickReply = lastAssistant?.toolCalls?.find((t) => t.name === "select_quick_reply");
  const proposeStory = lastAssistant?.toolCalls?.find((t) => t.name === "propose_storyboard");

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between border-b border-zinc-900">
        <div className="text-sm font-semibold">Sohbet</div>
        <button
          onClick={() => setMessages([])}
          className="h-7 w-7 rounded-md hover:bg-zinc-800 text-zinc-400 flex items-center justify-center"
          title="Yeni konuşma"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-[12px] text-zinc-500 text-center py-8">
            Bir video fikri yazarak başla — sana sahne sahne yardımcı olayım.
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={clsx("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
            {m.role === "assistant" && (
              <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-vibe flex items-center justify-center text-[10px] font-bold">
                VS
              </div>
            )}
            <div
              className={clsx(
                "max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words",
                m.role === "user"
                  ? "bg-gradient-vibe text-white"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-100"
              )}
            >
              {m.content}
              {m.streaming && (
                <span className="inline-block ml-1">
                  <Loader2 className="h-3 w-3 inline animate-spin text-zinc-500" />
                </span>
              )}
              {m.meta && <div className="mt-1.5 text-[10px] text-zinc-400">{m.meta}</div>}
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="mt-2 space-y-1">
                  {m.toolCalls.map((tc, i) => (
                    <div
                      key={i}
                      className="text-[10px] text-purple-300/80 bg-purple-500/10 rounded px-1.5 py-0.5 inline-block mr-1"
                    >
                      ⚙ {tc.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Quick Reply Chips */}
        {!streaming && quickReply && Array.isArray(quickReply.args.chips) && (
          <div className="pl-9 pt-1 space-y-1.5">
            {(quickReply.args.chips as string[]).map((chip) => (
              <button
                key={chip}
                onClick={() => send(chip)}
                className="block w-full text-left text-[12px] text-zinc-200 rounded-lg border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 px-3 py-1.5"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Storyboard Approval */}
        {!streaming && proposeStory && (
          <div className="pl-9 pt-1">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
              <div className="text-[12px] font-semibold text-emerald-300">Sahne Planı Hazır</div>
              <div className="text-[11px] text-zinc-300">
                {String(proposeStory.args.topic || "")} — {String(proposeStory.args.totalDurationSec || "")}s,{" "}
                {String(proposeStory.args.aspectRatio || "")}, {String(proposeStory.args.sceneCount || "")} sahne
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => send("Evet, üret")}
                  className="text-[11px] font-semibold bg-gradient-vibe text-white rounded px-2 py-1"
                >
                  Üret
                </button>
                <button
                  onClick={() => send("Bir saniye, değiştirelim")}
                  className="text-[11px] text-zinc-300 border border-zinc-700 rounded px-2 py-1 hover:bg-zinc-800"
                >
                  Düzenle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Boş başlangıç chip'leri */}
        {messages.length === 0 && (
          <div className="pt-2 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 px-1">Hızlı başlangıç</div>
            {FALLBACK_QUICK_ACTIONS.map((a) => (
              <button
                key={a}
                onClick={() => send(a)}
                disabled={streaming}
                className="w-full text-left text-[12px] text-zinc-300 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 px-3 py-2 disabled:opacity-50"
              >
                {a}
              </button>
            ))}
          </div>
        )}

        {/* Memnuniyet widget'i — sadece tamamlanmış üretimden sonra göster */}
        {messages.length > 4 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 mt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] text-zinc-200 font-medium">Bu video sizi ne kadar memnun etti?</div>
              <div className="text-[10px] rounded bg-purple-500/15 text-purple-300 px-1.5 py-0.5 inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                +10 kredi
              </div>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={clsx(
                    "h-7 rounded-md text-[11px] font-medium transition-colors",
                    rating === n
                      ? "bg-gradient-vibe text-white"
                      : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-900 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2">
          <button className="h-8 w-8 rounded-md hover:bg-zinc-800 text-zinc-400 flex items-center justify-center">
            <Paperclip className="h-4 w-4" />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={streaming ? "AI yazıyor…" : "Bir komut yazın..."}
            rows={2}
            disabled={streaming}
            className="flex-1 bg-transparent text-[13px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none px-1 py-1 resize-none disabled:opacity-50"
          />
          <button
            onClick={() => send()}
            disabled={streaming || !text.trim()}
            className="h-8 w-8 rounded-md bg-gradient-vibe text-white flex items-center justify-center disabled:opacity-50"
          >
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
