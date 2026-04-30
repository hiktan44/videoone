"use client";

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Character } from "@/lib/mocks";

const VOICE_MODELS = [
  "InWorld 1.5 Max",
  "Eleven Labs V3",
  "Eleven Labs Turbo",
  "ElevenLabs TTS Multilingual V2",
  "ElevenLabs Text-to-Dialogue V3",
];

const COLORS = [
  "from-amber-500 to-coral-500",
  "from-cyan-500 to-amber-500",
  "from-coral-500 to-cyan-500",
  "from-amber-400 to-amber-600",
  "from-cyan-400 to-cyan-600",
  "from-coral-400 to-coral-600",
];

type Props = {
  open: boolean;
  onClose: () => void;
  editingId?: string | null;
};

export function AddCharacterModal({ open, onClose, editingId }: Props) {
  const characters = useStore((s) => s.characters);
  const addCharacter = useStore((s) => s.addCharacter);
  const updateCharacter = useStore((s) => s.updateCharacter);

  const editing = editingId ? characters.find((c) => c.id === editingId) : null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voiceModel, setVoiceModel] = useState(VOICE_MODELS[0]);
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description);
      setVoiceModel(editing.voiceModel);
      setColor(editing.color || COLORS[0]);
    } else {
      setName("");
      setDescription("");
      setVoiceModel(VOICE_MODELS[0]);
      setColor(COLORS[0]);
    }
  }, [editing, open]);

  if (!open) return null;

  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() || "")
    .slice(0, 2)
    .join("") || "??";

  const submit = () => {
    if (!name.trim()) return;
    const data: Omit<Character, "id"> = {
      name: name.trim(),
      description: description.trim() || "—",
      voiceModel,
      initials,
      color,
    };
    if (editing) {
      updateCharacter(editing.id, data);
    } else {
      addCharacter(data);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 shadow-glow-amber"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <div className="text-sm font-semibold text-ink-50">
              {editing ? "Karakteri Düzenle" : "Yeni Karakter"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md hover:bg-ink-800 text-ink-400 hover:text-ink-100 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-3">
            <div
              className={`h-14 w-14 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-base font-bold text-ink-950 shrink-0`}
            >
              {initials}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full bg-gradient-to-br ${c} ${
                    color === c ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-ink-900" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">
              İsim
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Anlatıcı"
              className="mt-1 w-full bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sıcak tonlu, profesyonel erkek anlatıcı"
              rows={2}
              className="mt-1 w-full bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Voice model */}
          <div>
            <label className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">
              Ses Modeli
            </label>
            <select
              value={voiceModel}
              onChange={(e) => setVoiceModel(e.target.value)}
              className="mt-1 w-full bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-amber-500/50"
            >
              {VOICE_MODELS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-ink-800">
          <button
            onClick={onClose}
            className="text-xs text-ink-300 hover:text-ink-100 px-3 py-2"
          >
            İptal
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-ink-950 px-4 py-2 transition-colors"
          >
            {editing ? "Kaydet" : "Karakter Oluştur"}
          </button>
        </div>
      </div>
    </div>
  );
}
