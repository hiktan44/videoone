"use client";

import { useState, useRef } from "react";
import { Loader2, Check, X, Image as ImageIcon, Play, Trash2 } from "lucide-react";

const CATEGORIES = [
  "Pazarlama",
  "Sosyal Medya",
  "Seyahat",
  "Yemek & İçecek",
  "Moda",
  "Emlak",
  "İş",
  "Sanat",
  "Spor",
  "Eğitim",
  "Belgesel",
  "Müzik",
  "Genel",
];

const GRADIENTS = [
  "from-amber-500 via-orange-500 to-rose-500",
  "from-fuchsia-500 via-pink-500 to-rose-500",
  "from-cyan-400 via-blue-500 to-purple-600",
  "from-blue-500 via-indigo-500 to-purple-600",
  "from-amber-600 via-red-500 to-orange-600",
  "from-purple-600 via-pink-500 to-fuchsia-500",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-indigo-500 via-blue-600 to-cyan-500",
  "from-rose-500 via-purple-600 to-indigo-600",
  "from-orange-500 via-red-500 to-rose-600",
  "from-sky-500 via-cyan-500 to-emerald-500",
  "from-green-600 via-emerald-500 to-teal-500",
];

type Job = {
  id: string;
  kind: string;
  prompt: string;
  resultUrl: string | null;
  metadata?: any;
  createdAt: string;
  user: { email: string; name: string | null };
};

type Template = {
  id: string;
  name: string;
  gradient: string;
  isPublic: boolean;
  templateCategory: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
};

function isVideo(u: string | null | undefined): boolean {
  return !!u && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);
}
function isImage(u: string | null | undefined): boolean {
  return !!u && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(u);
}

export function AdminTemplatesClient({
  succeededJobs,
  existingTemplates,
}: {
  succeededJobs: Job[];
  existingTemplates: Template[];
}) {
  const [templates, setTemplates] = useState<Template[]>(existingTemplates);
  const [tab, setTab] = useState<"promote" | "existing">("promote");
  const [filterUsedJobIds] = useState(
    () => new Set(existingTemplates.filter((t) => t.thumbnailUrl).map((t) => t.thumbnailUrl))
  );

  const removeTemplate = async (id: string) => {
    if (!confirm("Bu şablonu silmek istediğine emin misin?")) return;
    const r = await fetch(`/api/admin/templates?id=${id}`, { method: "DELETE" });
    if (r.ok) setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div>
      <div className="flex gap-1 border-b border-zinc-800 mb-6">
        <button
          onClick={() => setTab("promote")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "promote"
              ? "border-amber-500 text-amber-300"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Üretimleri Şablon Yap ({succeededJobs.length})
        </button>
        <button
          onClick={() => setTab("existing")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "existing"
              ? "border-amber-500 text-amber-300"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Mevcut Şablonlar ({templates.length})
        </button>
      </div>

      {tab === "promote" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {succeededJobs.length === 0 && (
            <div className="col-span-full text-center text-ink-400 py-16">
              Henüz başarılı üretim yok.
            </div>
          )}
          {succeededJobs.map((job) => (
            <PromoteCard
              key={job.id}
              job={job}
              alreadyUsed={filterUsedJobIds.has(job.resultUrl)}
              onPromoted={(t) => setTemplates((prev) => [t, ...prev])}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.length === 0 && (
            <div className="col-span-full text-center text-ink-400 py-16">
              Henüz şablon yok. Soldaki sekmeden üretimleri şablona dönüştürebilirsin.
            </div>
          )}
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className={`aspect-video bg-gradient-to-br ${t.gradient} relative`}>
                {t.thumbnailUrl ? (
                  isVideo(t.thumbnailUrl) ? (
                    <video src={t.thumbnailUrl} muted className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <img src={t.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )
                ) : null}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white">
                  {t.templateCategory || "Genel"}
                </div>
                {t.isPublic && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-500 text-[10px] font-bold text-white">
                    Public
                  </div>
                )}
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="text-sm font-medium text-zinc-100 truncate">{t.name}</div>
                <button onClick={() => removeTemplate(t.id)} className="text-zinc-500 hover:text-rose-400 p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PromoteCard({
  job,
  alreadyUsed,
  onPromoted,
}: {
  job: Job;
  alreadyUsed: boolean;
  onPromoted: (t: Template) => void;
}) {
  const [name, setName] = useState(job.prompt.slice(0, 50));
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [gradient, setGradient] = useState(GRADIENTS[0]);
  const [makePublic, setMakePublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(alreadyUsed);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const url = job.resultUrl || "";
  const vid = isVideo(url);
  const img = isImage(url);

  const submit = async () => {
    if (!name.trim()) { setError("İsim gerekli"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          name: name.trim(),
          category,
          description: description.trim() || undefined,
          gradient,
          makePublic,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || `Hata ${r.status}`);
      } else {
        setDone(true);
        onPromoted({
          id: data.templateId,
          name: name.trim(),
          gradient,
          isPublic: makePublic,
          templateCategory: category,
          thumbnailUrl: url,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network hatası");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-zinc-700 transition-colors">
      {/* Önizleme */}
      <div
        className="aspect-video relative bg-zinc-950 overflow-hidden cursor-pointer"
        onMouseEnter={() => videoRef.current?.play().catch(() => {})}
        onMouseLeave={() => { if (videoRef.current) videoRef.current.pause(); }}
      >
        {vid ? (
          <video ref={videoRef} src={url} muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : img ? (
          <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <ImageIcon className="absolute inset-0 m-auto h-8 w-8 text-zinc-600" />
        )}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white uppercase">
          {job.kind}
        </div>
        {vid && <Play className="absolute inset-0 m-auto h-10 w-10 text-white/80 pointer-events-none drop-shadow-lg" fill="white" />}
      </div>

      <div className="p-3 space-y-2.5">
        <div className="text-[11px] text-zinc-500 line-clamp-2" title={job.prompt}>
          <span className="text-zinc-400">Prompt:</span> {job.prompt}
        </div>
        <div className="text-[10px] text-zinc-600">
          {job.user.email} · {new Date(job.createdAt).toLocaleDateString("tr-TR")}
        </div>

        {done ? (
          <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-200 flex items-center gap-2">
            <Check className="h-3.5 w-3.5" />
            Şablona eklendi
          </div>
        ) : (
          <>
            {/* Kategori — kart üstündeki seçim */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-semibold">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Şablon adı */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-semibold">
                Şablon Adı
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Ürün Lansmanı"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-semibold">
                Açıklama (opsiyonel)
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kısa açıklama"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Gradient seç */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-semibold">
                Renk teması
              </label>
              <div className="grid grid-cols-6 gap-1">
                {GRADIENTS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGradient(g)}
                    className={`h-6 rounded bg-gradient-to-br ${g} ring-2 transition-all ${
                      gradient === g ? "ring-amber-400 scale-110" : "ring-transparent hover:ring-zinc-600"
                    }`}
                  />
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={makePublic} onChange={(e) => setMakePublic(e.target.checked)} />
              Tüm kullanıcılara public
            </label>

            {error && (
              <div className="text-xs text-rose-400 flex items-center gap-1">
                <X className="h-3 w-3" /> {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 px-3 py-2 text-sm font-semibold text-ink-950 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Ekleniyor...</> : "Şablona Ekle"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
