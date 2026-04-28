"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Plus, Paperclip, ArrowUp, Sparkles } from "lucide-react";
import clsx from "clsx";

const quickActions = [
  "Her ana mesaj için örnek senaryo üret",
  "Görsel örneklerle bir storyboard oluştur",
  "Sosyal medya için 15 saniyelik tanıtım klibi düzenle",
];

export function ChatTab() {
  const messages = useStore((s) => s.chatMessages);
  const addMessage = useStore((s) => s.addChatMessage);
  const [text, setText] = useState("");
  const [rating, setRating] = useState<number | null>(null);

  function send() {
    if (!text.trim()) return;
    addMessage({ role: "user", content: text.trim() });
    setText("");
    setTimeout(() => {
      addMessage({
        role: "assistant",
        content:
          "Anladım! Sahneleri ve sesleri istediğiniz şekilde güncelliyorum. Birkaç saniye içinde önizlemeyi göreceksiniz.",
        meta: "12 saniye çalıştı · şimdi",
      });
    }, 600);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Sohbet</div>
        <button
          className="h-7 w-7 rounded-md hover:bg-zinc-800 text-zinc-400 flex items-center justify-center"
          title="Yeni konuşma"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={clsx(
              "flex gap-2",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {m.role === "assistant" && (
              <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-vibe flex items-center justify-center text-[10px] font-bold">
                VS
              </div>
            )}
            <div
              className={clsx(
                "max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                m.role === "user"
                  ? "bg-gradient-vibe text-white"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-100"
              )}
            >
              {m.content}
              {m.meta ? (
                <div className="mt-1.5 text-[10px] text-zinc-400">{m.meta}</div>
              ) : null}
            </div>
          </div>
        ))}

        <div className="pt-2 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 px-1">
            Hızlı eylemler
          </div>
          {quickActions.map((a) => (
            <button
              key={a}
              onClick={() => setText(a)}
              className="w-full text-left text-[12px] text-zinc-300 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 px-3 py-2"
            >
              {a}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 mt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[12px] text-zinc-200 font-medium">
              Bu video sizi ne kadar memnun etti?
            </div>
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
            placeholder="Bir komut yazın..."
            rows={2}
            className="flex-1 bg-transparent text-[13px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none px-1 py-1 resize-none"
          />
          <button
            onClick={send}
            className="h-8 w-8 rounded-md bg-gradient-vibe text-white flex items-center justify-center"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
