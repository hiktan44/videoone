"use client";

import { useCallback, useRef, useState } from "react";
import {
  ImagePlus, Loader2, X, Link as LinkIcon, Upload, Music2, Video as VideoIcon, Play,
} from "lucide-react";
import clsx from "clsx";

export type RefKind = "image" | "audio" | "video";

export type ReferenceAsset = {
  url: string;
  name?: string;
  kind: RefKind;
  localPreview?: string; // ObjectURL - sadece UI
};

const ACCEPT_MAP: Record<RefKind, string> = {
  image: "image/*",
  audio: "audio/*",
  video: "video/*",
};

const MAX_BYTES_MAP: Record<RefKind, number> = {
  image: 30 * 1024 * 1024,   // 30 MB
  audio: 50 * 1024 * 1024,   // 50 MB
  video: 100 * 1024 * 1024,  // 100 MB
};

const LABEL_MAP: Record<RefKind, { tr: string; placeholder: string; ctaIcon: string }> = {
  image: { tr: "Görsel", placeholder: "Görsel sürükle bırak veya seç", ctaIcon: "🖼" },
  audio: { tr: "Ses", placeholder: "Ses dosyası sürükle bırak veya seç", ctaIcon: "🎵" },
  video: { tr: "Video", placeholder: "Video sürükle bırak veya seç", ctaIcon: "🎬" },
};

type Props = {
  kind: RefKind;
  refs: ReferenceAsset[];
  onChange: (refs: ReferenceAsset[]) => void;
  max?: number;
  compact?: boolean;
};

// Cok amacli yukleme bileseni: gorsel / ses / video.
// Kie /api/file-stream-upload her tipi destekledigi icin tek endpoint kullaniyoruz.
// Donen downloadUrl 3 gun gecerli, ardindan jobs/createTask cagrisinda input alani olarak yollanir.
export function ReferenceUploader({ kind, refs, onChange, max = 4, compact = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlField, setShowUrlField] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = ACCEPT_MAP[kind];
  const maxBytes = MAX_BYTES_MAP[kind];
  const label = LABEL_MAP[kind];

  const uploadFile = useCallback(
    async (file: File) => {
      if (refs.length >= max) {
        setError(`En fazla ${max} ${label.tr.toLowerCase()} eklenebilir.`);
        return;
      }
      // Mime ipucu
      const matchesKind =
        (kind === "image" && file.type.startsWith("image/")) ||
        (kind === "audio" && file.type.startsWith("audio/")) ||
        (kind === "video" && file.type.startsWith("video/"));
      if (!matchesKind && file.type) {
        setError(`Beklenen tip: ${kind}, gelen: ${file.type}`);
        return;
      }
      if (file.size > maxBytes) {
        setError(`Dosya ${Math.round(maxBytes / 1024 / 1024)} MB sınırını aşıyor.`);
        return;
      }
      setError(null);
      setBusy(true);
      const localPreview = URL.createObjectURL(file);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/kie/upload", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.url) {
          throw new Error(data?.error || `Yükleme başarısız (HTTP ${res.status}).`);
        }
        onChange([...refs, { url: data.url, name: file.name, kind, localPreview }]);
      } catch (e) {
        URL.revokeObjectURL(localPreview);
        setError(e instanceof Error ? e.message : "Bilinmeyen hata");
      } finally {
        setBusy(false);
      }
    },
    [refs, onChange, max, kind, maxBytes, label.tr]
  );

  const uploadUrl = useCallback(async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (refs.length >= max) {
      setError(`En fazla ${max} ${label.tr.toLowerCase()} eklenebilir.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/kie/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      const finalUrl = data?.url || trimmed;
      onChange([...refs, { url: finalUrl, name: data?.fileName || trimmed.slice(-40), kind }]);
      setUrlInput("");
      setShowUrlField(false);
    } catch {
      onChange([...refs, { url: trimmed, name: trimmed.slice(-40), kind }]);
      setUrlInput("");
      setShowUrlField(false);
    } finally {
      setBusy(false);
    }
  }, [urlInput, refs, onChange, max, kind, label.tr]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const remove = useCallback(
    (idx: number) => {
      const next = [...refs];
      const r = next.splice(idx, 1)[0];
      if (r?.localPreview) URL.revokeObjectURL(r.localPreview);
      onChange(next);
    },
    [refs, onChange]
  );

  return (
    <div
      className={clsx(
        "rounded-lg border border-dashed transition-colors",
        dragOver ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 bg-zinc-950/40",
        compact ? "p-2" : "p-3"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div className="flex flex-wrap items-center gap-2">
        {refs.map((r, i) => (
          <AssetThumb key={r.url + i} asset={r} onRemove={() => remove(i)} />
        ))}

        {refs.length < max ? (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="h-14 px-3 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 flex items-center gap-1.5 text-xs disabled:opacity-50"
              title={`${label.tr} seç`}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                kind === "image" ? <ImagePlus className="h-3.5 w-3.5" /> :
                kind === "audio" ? <Music2 className="h-3.5 w-3.5" /> :
                <VideoIcon className="h-3.5 w-3.5" />}
              {label.tr}
            </button>
            <button
              type="button"
              onClick={() => setShowUrlField((s) => !s)}
              disabled={busy}
              className="h-14 px-3 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 flex items-center gap-1.5 text-xs disabled:opacity-50"
              title="URL yapıştır"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              URL
            </button>
          </>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {showUrlField && refs.length < max ? (
        <div className="mt-2 flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && uploadUrl()}
            placeholder={`https://... ${label.tr.toLowerCase()} URL'si`}
            className="flex-1 text-xs bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={uploadUrl}
            disabled={busy || !urlInput.trim()}
            className="px-3 py-1.5 text-xs rounded-md bg-gradient-vibe text-white disabled:opacity-50 flex items-center gap-1"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Ekle
          </button>
        </div>
      ) : null}

      {!compact && refs.length === 0 ? (
        <div className="mt-2 text-[11px] text-zinc-500 text-center">
          {label.placeholder}. Yüklenen dosyalar 3 gün saklanır.
        </div>
      ) : null}

      {error ? <div className="mt-2 text-[11px] text-rose-400">{error}</div> : null}
    </div>
  );
}

// Tip-aware kucuk preview kutusu
function AssetThumb({ asset, onRemove }: { asset: ReferenceAsset; onRemove: () => void }) {
  const src = asset.localPreview || asset.url;
  return (
    <div className="relative group w-14 h-14 rounded-md overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
      {asset.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={asset.name || "ref"}
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ) : asset.kind === "video" ? (
        <div className="relative w-full h-full bg-black">
          <video
            src={src}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center text-white/70">
            <Play className="h-5 w-5" />
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-fuchsia-700 to-purple-800 flex items-center justify-center">
          <Music2 className="h-5 w-5 text-white" />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center"
        aria-label="Kaldır"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}
