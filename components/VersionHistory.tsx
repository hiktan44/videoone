"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Save, History, RotateCcw, Trash2, Loader2, ArrowLeftRight, Check } from "lucide-react";
import { useStore } from "@/lib/store";

type VersionMeta = {
  id: string;
  label: string | null;
  createdAt: string;
};

type Snapshot = {
  clips: any[];
  characters: any[];
  settings: any;
  mediaItems: any[];
  name?: string;
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
}

function diffSummary(a: Snapshot | null, b: Snapshot | null): string[] {
  if (!a || !b) return [];
  const out: string[] = [];
  const ac = (a.clips || []).length, bc = (b.clips || []).length;
  if (ac !== bc) out.push(`Klip sayısı: ${ac} → ${bc}`);
  const ach = (a.characters || []).length, bch = (b.characters || []).length;
  if (ach !== bch) out.push(`Karakter sayısı: ${ach} → ${bch}`);
  const am = (a.mediaItems || []).length, bm = (b.mediaItems || []).length;
  if (am !== bm) out.push(`Medya sayısı: ${am} → ${bm}`);
  // Settings key-by-key diff
  const allKeys = new Set([
    ...Object.keys(a.settings || {}),
    ...Object.keys(b.settings || {}),
  ]);
  for (const k of allKeys) {
    const av = JSON.stringify((a.settings as any)?.[k]);
    const bv = JSON.stringify((b.settings as any)?.[k]);
    if (av !== bv) out.push(`Ayar ${k}: ${av} → ${bv}`);
  }
  // Klip içerik diff (basit)
  const ai = new Map((a.clips || []).map((c: any) => [c.id, c]));
  const bi = new Map((b.clips || []).map((c: any) => [c.id, c]));
  for (const [id, ac2] of ai) {
    if (!bi.has(id)) out.push(`Silindi: "${(ac2 as any).label || id}"`);
  }
  for (const [id, bc2] of bi) {
    if (!ai.has(id)) out.push(`Eklendi: "${(bc2 as any).label || id}"`);
  }
  return out.slice(0, 30);
}

export function VersionHistory({ projectId, open, onClose }: { projectId: string; open: boolean; onClose: () => void }) {
  const [versions, setVersions] = useState<VersionMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<{ a: Snapshot | null; b: Snapshot | null }>({ a: null, b: null });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/versions`);
      const d = await r.json();
      setVersions(d.versions || []);
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { if (open) refresh(); }, [open, refresh]);

  const saveCurrent = async () => {
    setSaving(true);
    try {
      const s = useStore.getState();
      const snapshot: Snapshot = {
        clips: s.clips, characters: s.characters, settings: s.settings, mediaItems: s.mediaItems, name: s.currentProjectName,
      };
      const r = await fetch(`/api/projects/${projectId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || `Manuel — ${new Date().toLocaleString("tr-TR")}`, snapshot }),
      });
      if (r.ok) {
        setLabel("");
        await refresh();
      }
    } finally { setSaving(false); }
  };

  const restore = async (versionId: string) => {
    if (!confirm("Bu versiyona geri dönmek istediğinden emin misin? (Mevcut değişiklikler kaybolur, ama yedek alınır)")) return;
    // Önce geçerli durumu otomatik yedek olarak kaydet
    const s = useStore.getState();
    await fetch(`/api/projects/${projectId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: `Otomatik yedek — geri dönmeden önce`,
        snapshot: { clips: s.clips, characters: s.characters, settings: s.settings, mediaItems: s.mediaItems },
      }),
    });
    const r = await fetch(`/api/projects/${projectId}/versions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    if (!r.ok) return;
    const { snapshot } = await r.json();
    useStore.setState({
      clips: snapshot.clips || [],
      characters: snapshot.characters || [],
      settings: snapshot.settings || {},
      mediaItems: snapshot.mediaItems || [],
    });
    await refresh();
    onClose();
  };

  const remove = async (versionId: string) => {
    if (!confirm("Bu versiyonu silmek istediğinden emin misin?")) return;
    await fetch(`/api/projects/${projectId}/versions/${versionId}`, { method: "DELETE" });
    await refresh();
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const next = [...prev, id].slice(-2);
      return next;
    });
  };

  useEffect(() => {
    if (compareIds.length !== 2) { setCompareData({ a: null, b: null }); return; }
    Promise.all(
      compareIds.map((vid) =>
        fetch(`/api/projects/${projectId}/versions/${vid}`).then((r) => r.json())
      )
    ).then(([va, vb]) => {
      setCompareData({ a: va?.version?.snapshot || null, b: vb?.version?.snapshot || null });
    });
  }, [compareIds, projectId]);

  if (!open) return null;

  const diffs = compareIds.length === 2 ? diffSummary(compareData.a, compareData.b) : [];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-[460px] bg-zinc-950 border-l border-zinc-800 flex flex-col text-zinc-100">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-purple-400" />
            <div className="text-base font-semibold">Sürüm Geçmişi</div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-zinc-800 space-y-2">
          <div className="text-xs text-zinc-400">Anlık görüntü kaydet</div>
          <div className="flex gap-2">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Etiket (opsiyonel)"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-purple-500/60"
            />
            <button
              onClick={saveCurrent}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Kaydet
            </button>
          </div>
          <div className="text-[11px] text-zinc-500">
            Cmd/Ctrl+Z geri al · Cmd/Ctrl+Shift+Z ileri al — otomatik undo stack ayrı çalışır.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-zinc-400 text-sm flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Yükleniyor...
            </div>
          ) : versions.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-sm">Henüz kayıt yok.</div>
          ) : (
            <ul className="divide-y divide-zinc-900">
              {versions.map((v) => {
                const selectedForCompare = compareIds.includes(v.id);
                return (
                  <li key={v.id} className="p-3 hover:bg-zinc-900/50">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCompare(v.id)}
                        className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 ${selectedForCompare ? "bg-purple-500 border-purple-400" : "border-zinc-700"}`}
                        title="Karşılaştır için seç (max 2)"
                      >
                        {selectedForCompare && <Check className="h-3 w-3 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{v.label || "İsimsiz sürüm"}</div>
                        <div className="text-[11px] text-zinc-500">{fmtDate(v.createdAt)}</div>
                      </div>
                      <button onClick={() => restore(v.id)} title="Geri dön" className="text-zinc-400 hover:text-emerald-400 p-1">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove(v.id)} title="Sil" className="text-zinc-400 hover:text-rose-400 p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {compareIds.length === 2 && (
          <div className="border-t border-zinc-800 p-4 max-h-[40%] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
              <ArrowLeftRight className="h-4 w-4 text-amber-400" />
              Karşılaştırma
            </div>
            {diffs.length === 0 ? (
              <div className="text-xs text-zinc-500">Anlamlı fark bulunamadı.</div>
            ) : (
              <ul className="text-xs text-zinc-300 space-y-1">
                {diffs.map((d, i) => <li key={i} className="font-mono">• {d}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
