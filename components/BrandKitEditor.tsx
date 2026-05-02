"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Save, RotateCcw, Upload, Check } from "lucide-react";

type BrandKit = {
  primaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  watermark?: boolean;
  watermarkPosition?: "tl" | "tr" | "bl" | "br";
  intro?: string;
  outro?: string;
  defaultAspect?: string;
  defaultResolution?: string;
  globalStyle?: string;
  voicePreference?: string;
};

const FONTS = ["Inter", "Poppins", "Montserrat", "Roboto", "Plus Jakarta Sans", "Manrope", "DM Sans"];
const ASPECTS = ["16:9", "9:16", "1:1", "4:3"];
const RESOLUTIONS = ["720p", "1080p", "4K"];

export function BrandKitEditor() {
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "intro" | "outro" | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const introInput = useRef<HTMLInputElement>(null);
  const outroInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/brand-kit")
      .then((r) => r.json())
      .then((d) => setKit(d.brandKit || {}))
      .catch(() => setKit({}))
      .finally(() => setLoading(false));
  }, []);

  const update = (patch: Partial<BrandKit>) => setKit((prev) => ({ ...(prev || {}), ...patch }));

  const save = async () => {
    if (!kit) return;
    setSaving(true);
    try {
      const r = await fetch("/api/brand-kit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kit),
      });
      const d = await r.json();
      if (r.ok) {
        setKit(d.brandKit);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
      }
    } finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm("Marka kitini sıfırlamak istediğinizden emin misiniz?")) return;
    const r = await fetch("/api/brand-kit", { method: "DELETE" });
    const d = await r.json();
    setKit(d.brandKit);
  };

  const uploadFile = async (file: File, target: "logo" | "intro" | "outro") => {
    setUploading(target);
    try {
      const kind = target === "logo" ? "image" : "video";
      const presign = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, filename: file.name, contentType: file.type, sizeBytes: file.size }),
      });
      const pd = await presign.json();
      if (!presign.ok || !pd.uploadUrl) {
        alert(pd.error || "Yükleme başlatılamadı");
        return;
      }
      const put = await fetch(pd.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) { alert("Yükleme başarısız"); return; }
      if (target === "logo") update({ logoUrl: pd.publicUrl });
      else if (target === "intro") update({ intro: pd.publicUrl });
      else update({ outro: pd.publicUrl });
    } finally { setUploading(null); }
  };

  if (loading) return <div className="flex items-center gap-2 text-ink-300"><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...</div>;
  if (!kit) return <div className="text-rose-400">Yüklenemedi.</div>;

  return (
    <div className="space-y-6">
      {/* Renkler */}
      <Section title="Renkler" subtitle="Logo, butonlar ve vurgular için.">
        <div className="grid grid-cols-3 gap-4">
          <ColorField label="Birincil" value={kit.primaryColor || "#A855F7"} onChange={(v) => update({ primaryColor: v })} />
          <ColorField label="Vurgu" value={kit.accentColor || "#F59E0B"} onChange={(v) => update({ accentColor: v })} />
          <ColorField label="Arkaplan" value={kit.bgColor || "#0A0A0B"} onChange={(v) => update({ bgColor: v })} />
        </div>
      </Section>

      {/* Font */}
      <Section title="Font" subtitle="Altyazı ve metin overlay'lerinde kullanılır.">
        <div className="flex flex-wrap gap-2">
          {FONTS.map((f) => {
            const active = (kit.fontFamily || "Inter") === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => update({ fontFamily: f })}
                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${active ? "border-purple-500 bg-purple-500/15 text-white" : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}`}
                style={{ fontFamily: f }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Logo */}
      <Section title="Logo" subtitle="Watermark olarak ihracatlarda kullanılabilir (PNG önerilir).">
        <div className="flex items-center gap-4">
          {kit.logoUrl ? (
            <div className="h-20 w-20 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center overflow-hidden">
              <img src={kit.logoUrl} alt="logo" className="max-h-full max-w-full" />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 flex items-center justify-center text-ink-500 text-xs">
              Logo yok
            </div>
          )}
          <div className="flex-1 space-y-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "logo"); }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading === "logo"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200"
            >
              {uploading === "logo" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Logo yükle
            </button>
            {kit.logoUrl && (
              <button onClick={() => update({ logoUrl: undefined })} className="text-xs text-rose-400 hover:text-rose-300">
                Kaldır
              </button>
            )}
            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={!!kit.watermark} onChange={(e) => update({ watermark: e.target.checked })} />
                Export'larda watermark uygula
              </label>
              {kit.watermark && (
                <select
                  value={kit.watermarkPosition || "br"}
                  onChange={(e) => update({ watermarkPosition: e.target.value as any })}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
                >
                  <option value="tl">Sol Üst</option>
                  <option value="tr">Sağ Üst</option>
                  <option value="bl">Sol Alt</option>
                  <option value="br">Sağ Alt</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Intro / Outro */}
      <Section title="Intro / Outro" subtitle="Her ihracatın başına/sonuna otomatik eklenecek video.">
        <div className="grid grid-cols-2 gap-4">
          <VideoSlot label="Intro" url={kit.intro} uploading={uploading === "intro"}
            onUpload={() => introInput.current?.click()}
            onRemove={() => update({ intro: undefined })}
            inputRef={introInput}
            onFile={(f) => uploadFile(f, "intro")} />
          <VideoSlot label="Outro" url={kit.outro} uploading={uploading === "outro"}
            onUpload={() => outroInput.current?.click()}
            onRemove={() => update({ outro: undefined })}
            inputRef={outroInput}
            onFile={(f) => uploadFile(f, "outro")} />
        </div>
      </Section>

      {/* Default proje ayarları */}
      <Section title="Yeni Proje Varsayılanları">
        <div className="grid grid-cols-2 gap-4">
          <Field label="En-Boy">
            <select value={kit.defaultAspect || "16:9"} onChange={(e) => update({ defaultAspect: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-2 text-sm">
              {ASPECTS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Çözünürlük">
            <select value={kit.defaultResolution || "720p"} onChange={(e) => update({ defaultResolution: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-2 text-sm">
              {RESOLUTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Global Sinematik Stil (opsiyonel)" className="mt-4">
          <textarea
            value={kit.globalStyle || ""}
            onChange={(e) => update({ globalStyle: e.target.value })}
            placeholder="Örn: cinematic 4k, warm tones, soft lighting"
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm resize-none"
          />
        </Field>
      </Section>

      {/* Aksiyonlar */}
      <div className="flex items-center gap-3 sticky bottom-4 bg-ink-950/80 backdrop-blur p-3 -mx-3 rounded-xl border border-zinc-800">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : savedFlash ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {savedFlash ? "Kaydedildi" : "Kaydet"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-3 py-2 text-sm text-zinc-300"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Sıfırla
        </button>
      </div>

      {/* Preview */}
      <Section title="Önizleme">
        <div
          className="rounded-xl border border-zinc-800 p-6"
          style={{ background: kit.bgColor, fontFamily: kit.fontFamily }}
        >
          <div className="flex items-center gap-3 mb-4">
            {kit.logoUrl && <img src={kit.logoUrl} alt="" className="h-8" />}
            <div className="text-2xl font-bold" style={{ color: kit.primaryColor }}>
              Vibe Studio Marka Önizleme
            </div>
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-white font-semibold"
            style={{ background: kit.accentColor }}
          >
            Örnek CTA
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
      <div className="mb-4">
        <div className="text-lg font-semibold text-ink-50">{title}</div>
        {subtitle && <div className="text-xs text-ink-400 mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs uppercase tracking-wider text-ink-400 mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-ink-400 mb-1.5">{label}</div>
      <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 rounded cursor-pointer bg-transparent border-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-ink-100 focus:outline-none font-mono"
        />
      </div>
    </div>
  );
}

function VideoSlot({
  label, url, uploading, onUpload, onRemove, inputRef, onFile,
}: {
  label: string; url?: string; uploading: boolean;
  onUpload: () => void; onRemove: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onFile: (f: File) => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 p-3">
      <div className="text-xs text-ink-400 mb-2">{label}</div>
      {url ? (
        <video src={url} controls className="w-full aspect-video rounded mb-2 bg-black" />
      ) : (
        <div className="aspect-video rounded bg-zinc-950 border border-dashed border-zinc-700 flex items-center justify-center text-ink-500 text-xs mb-2">
          Yok
        </div>
      )}
      <input ref={inputRef} type="file" accept="video/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onUpload}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200"
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {url ? "Değiştir" : "Yükle"}
        </button>
        {url && (
          <button onClick={onRemove} className="text-xs text-rose-400 hover:text-rose-300">Kaldır</button>
        )}
      </div>
    </div>
  );
}
