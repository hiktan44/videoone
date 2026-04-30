"use client";

import { useState, useCallback } from "react";
import { Search, Loader2, Plus, ExternalLink, Music } from "lucide-react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import type { TimelineClip } from "@/lib/mocks";

const tabs = ["Görseller", "Videolar", "Müzik"] as const;
type TabKey = (typeof tabs)[number];

type StockItem = {
  id: number;
  kind: "image" | "video";
  title: string;
  thumbnailUrl: string;
  sourceUrl: string;
  duration?: number;
  author?: string;
  photographer?: string;
  pageUrl?: string;
};

export function StockTab() {
  const addClip = useStore((s) => s.addClip);
  const [active, setActive] = useState<TabKey>(tabs[0]);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(
    async (overrideTab?: TabKey) => {
      const tab = overrideTab ?? active;
      if (tab === "Müzik") {
        setItems([]);
        setError("Müzik araması yakında — Suno entegrasyonu Faz 5 ile geliyor.");
        return;
      }
      const q = query.trim();
      if (!q) return;

      setLoading(true);
      setError(null);
      setHasSearched(true);
      try {
        const endpoint = tab === "Görseller" ? "/api/stock/images" : "/api/stock/videos";
        const res = await fetch(`${endpoint}?q=${encodeURIComponent(q)}&per_page=24`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || `Hata ${res.status}`);
          setItems([]);
        } else {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network hatası");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [query, active]
  );

  const addToTimeline = useCallback(
    (item: StockItem) => {
      const clip: Partial<TimelineClip> & Pick<TimelineClip, "trackId" | "label"> = {
        trackId: "video",
        label: item.title.slice(0, 24) || "Stok klip",
        duration: item.duration ?? 5,
        sourceUrl: item.sourceUrl,
        thumbnailUrl: item.thumbnailUrl,
        gradient: "from-amber-500 to-coral-500",
      };
      addClip(clip);
    },
    [addClip]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-ink-800 space-y-3">
        {/* Tab seçici */}
        <div className="flex items-center gap-1 text-xs">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => {
                setActive(t);
                if (query.trim() && t !== "Müzik") search(t);
              }}
              className={clsx(
                "px-2.5 py-1 rounded-md transition-colors",
                active === t
                  ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/20"
                  : "text-ink-400 hover:text-ink-100 hover:bg-ink-800"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Arama kutusu */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-900 px-2.5 py-1.5 focus-within:border-amber-500/40">
            <Search className="h-3.5 w-3.5 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") search();
              }}
              placeholder={active === "Müzik" ? "Yakında..." : "Aramak için yazın..."}
              disabled={active === "Müzik"}
              className="flex-1 bg-transparent text-xs text-ink-100 placeholder:text-ink-500 focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => search()}
            disabled={loading || !query.trim() || active === "Müzik"}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-ink-950 text-xs px-3 py-1.5 font-semibold transition-colors"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ara"}
          </button>
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {error && (
          <div className="rounded-lg border border-coral-500/30 bg-coral-500/10 px-3 py-2 text-[11px] text-coral-300 mb-3">
            {error}
          </div>
        )}

        {!hasSearched && active !== "Müzik" && (
          <div className="text-center py-12 text-ink-500 text-sm">
            Pexels'tan {active === "Görseller" ? "görsel" : "video"} aramak için yukarıya konu yaz
            (örn. "deniz", "şehir", "kadın").
          </div>
        )}

        {active === "Müzik" && (
          <div className="text-center py-12 space-y-3">
            <Music className="h-10 w-10 text-ink-600 mx-auto" />
            <div className="text-sm text-ink-400">
              Müzik araması yakında — Suno V5 ile AI müzik üretimi gelecek.
            </div>
          </div>
        )}

        {hasSearched && !loading && !error && items.length === 0 && active !== "Müzik" && (
          <div className="text-center py-12 text-ink-500 text-sm">Sonuç bulunamadı.</div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-lg overflow-hidden border border-ink-700 bg-ink-900 hover:border-amber-500/40 transition-all"
            >
              <div
                className="aspect-video bg-cover bg-center relative"
                style={{ backgroundImage: `url(${item.thumbnailUrl})` }}
              >
                {item.kind === "video" && item.duration && (
                  <div className="absolute bottom-1 right-1 text-[9px] bg-ink-950/80 text-ink-100 px-1 py-0.5 rounded">
                    {item.duration}s
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-ink-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => addToTimeline(item)}
                    title="Timeline'a ekle"
                    className="h-8 w-8 rounded-full bg-amber-500 hover:bg-amber-400 text-ink-950 flex items-center justify-center transition-colors"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                  {item.pageUrl && (
                    <a
                      href={item.pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Pexels'ta aç"
                      className="h-8 w-8 rounded-full bg-ink-800 hover:bg-ink-700 text-ink-200 flex items-center justify-center"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
              <div className="px-2 py-1.5">
                <div className="text-[10px] text-ink-300 truncate">
                  {item.author || item.photographer || item.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-ink-500 text-center py-2 border-t border-ink-800">
        Pexels tarafından desteklenmektedir
      </div>
    </div>
  );
}
