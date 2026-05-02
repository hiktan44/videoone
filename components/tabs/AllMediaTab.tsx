"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Plus, Image as ImageIcon, Mic, Music, Video, RefreshCw } from "lucide-react";
import clsx from "clsx";

type DbAsset = {
  id: string;
  kind: string;
  title: string;
  url: string;
  durationSec?: number;
  createdAt: string;
};

const addButtons = [
  { icon: ImageIcon, label: "Yeni Görsel" },
  { icon: Mic, label: "Yeni Konuşma" },
  { icon: Music, label: "Yeni Ses" },
  { icon: Video, label: "Yeni Video" },
];

const KIND_GRADIENT: Record<string, string> = {
  image: "from-amber-500 to-rose-500",
  video: "from-purple-500 to-pink-500",
  audio: "from-cyan-500 to-blue-500",
  speech: "from-cyan-400 to-emerald-500",
  music: "from-fuchsia-500 to-purple-500",
};

export function AllMediaTab() {
  const localItems = useStore((s) => s.mediaItems);
  const addClip = useStore((s) => s.addClip);
  const [dbAssets, setDbAssets] = useState<DbAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assets?limit=100");
      if (res.ok) {
        const data = await res.json();
        setDbAssets(data.assets || []);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const sendToTimeline = (a: DbAsset) => {
    const trackId = a.kind === "image" || a.kind === "video" ? "video"
      : a.kind === "speech" || a.kind === "music" ? "audio" : "audio";
    addClip({
      trackId,
      label: a.title.slice(0, 20),
      duration: a.durationSec || 5,
      sourceUrl: a.url,
      gradient: KIND_GRADIENT[a.kind] || "from-purple-500 to-pink-500",
    });
  };

  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {addButtons.map((b) => (
          <button
            key={b.label}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 px-3 py-2.5 text-xs text-zinc-200 inline-flex items-center gap-1.5 justify-center"
          >
            <Plus className="h-3.5 w-3.5" />
            {b.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-1 pt-2">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">
          Medya kütüphanesi {dbAssets.length > 0 ? `(${dbAssets.length})` : ""}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-[11px] text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1"
        >
          <RefreshCw className={clsx("h-3 w-3", loading && "animate-spin")} />
          Yenile
        </button>
      </div>

      {/* DB'den gelen R2 asset'leri */}
      {dbAssets.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {dbAssets.map((a) => (
            <button
              key={a.id}
              onClick={() => sendToTimeline(a)}
              className="text-left rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900/40 hover:border-purple-500/60 cursor-pointer"
              title="Timeline'a ekle"
            >
              <div className={clsx("aspect-video bg-gradient-to-br relative", KIND_GRADIENT[a.kind] || "from-zinc-700 to-zinc-800")}>
                {a.kind === "image" || a.kind === "video" ? (
                  <img src={a.url} alt={a.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                ) : null}
                <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                  {a.kind}
                </div>
              </div>
              <div className="p-2 text-[11px] text-zinc-200 truncate">{a.title}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-zinc-500 px-1 py-3 text-center">
          {loading ? "Yükleniyor..." : "Henüz kayıtlı medya yok. Üretim sonrası burada görünür."}
        </div>
      )}

      {/* Eski yerel mock items (fallback) */}
      {localItems.length > 0 && (
        <>
          <div className="text-[11px] uppercase tracking-wider text-zinc-600 px-1 pt-3">
            Yerel önerilen
          </div>
          <div className="grid grid-cols-2 gap-2">
            {localItems.map((m) => (
              <div key={m.id} className="rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900/40 hover:border-zinc-700 cursor-pointer">
                <div className={clsx("aspect-video bg-gradient-to-br relative", m.gradient)}>
                  <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                    {m.duration}
                  </div>
                </div>
                <div className="p-2 text-[11px] text-zinc-200 truncate">{m.title}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
