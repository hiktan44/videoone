"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Search, Plus, Pencil, Trash2, Mic } from "lucide-react";
import clsx from "clsx";
import { AddCharacterModal } from "@/components/AddCharacterModal";
import { LipsyncModal } from "@/components/LipsyncModal";

export function CharactersTab() {
  const characters = useStore((s) => s.characters);
  const removeCharacter = useStore((s) => s.removeCharacter);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lipsyncOpen, setLipsyncOpen] = useState(false);

  const filtered = characters.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase())
  );

  const openNew = () => {
    setEditingId(null);
    setModalOpen(true);
  };
  const openEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };
  const remove = (id: string, name: string) => {
    if (confirm(`"${name}" karakterini silmek istiyor musun?`)) {
      removeCharacter(id);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="px-3 pt-3 pb-2 border-b border-ink-800 space-y-2.5">
          <div className="text-sm font-semibold text-ink-50">Karakterler</div>
          <div className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Karakter ara..."
              className="flex-1 bg-transparent text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={openNew}
              className="rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 px-3 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Karakter
            </button>
            <button
              onClick={() => setLipsyncOpen(true)}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 px-3 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Mic className="h-3.5 w-3.5" strokeWidth={2.5} />
              Dudak Senkronu
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-ink-500 text-xs">
              {query ? "Eşleşen karakter yok." : "Henüz karakter yok. Yukarıdaki butonla ekle."}
            </div>
          )}
          {filtered.map((c) => (
            <div
              key={c.id}
              className="group flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900/40 hover:border-ink-600 hover:bg-ink-900 p-2.5 transition-all"
            >
              <div
                className={clsx(
                  "h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-[11px] font-bold text-ink-950 shrink-0",
                  c.color || "from-amber-500 to-coral-500"
                )}
              >
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-ink-50 truncate">{c.name}</div>
                <div className="text-[11px] text-ink-400 truncate">{c.description}</div>
                <div className="mt-1 inline-block text-[10px] rounded bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 ring-1 ring-cyan-500/20">
                  {c.voiceModel}
                </div>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(c.id)}
                  title="Düzenle"
                  className="h-7 w-7 rounded-md hover:bg-ink-800 text-ink-300 hover:text-amber-300 flex items-center justify-center"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => remove(c.id, c.name)}
                  title="Sil"
                  className="h-7 w-7 rounded-md hover:bg-coral-500/15 text-ink-300 hover:text-coral-400 flex items-center justify-center"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <AddCharacterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingId={editingId}
      />
      <LipsyncModal open={lipsyncOpen} onClose={() => setLipsyncOpen(false)} />
    </>
  );
}
