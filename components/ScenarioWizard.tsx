"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Loader2,
  Plus,
  Trash2,
  X,
  RefreshCw,
  Wand2,
  Check,
  AlertCircle,
  ChevronLeft,
  Film,
} from "lucide-react";
import clsx from "clsx";
import { Dropdown } from "./Dropdown";
import {
  CAMERA_ANGLES,
  TRANSITIONS,
  suggestSceneCount,
  type Storyboard,
  type Scene,
  type CameraAngle,
  type Transition,
} from "@/lib/scenario";
import { KIE_MODEL_FAMILIES, KIE_DEFAULT_MODELS } from "@/lib/models";

// ---------------------------------------------------------------------------
// PipelineState — ileride lib/pipeline.ts olusturulunca oradan alinacak.
// Burada local fallback olarak tanimliyoruz; aribirim ayni kaldigi surece
// `import { type PipelineState } from "@/lib/pipeline"` calisacak.
// ---------------------------------------------------------------------------
export type PipelineSceneStatus = "pending" | "running" | "done" | "failed";
export type PipelineSceneState = {
  sceneId: string;
  index: number;
  title: string;
  status: PipelineSceneStatus;
  error?: string;
};
export type PipelineState = {
  active: "idle" | "running" | "done" | "failed" | "cancelled";
  total: number;
  completed: number;
  scenes: PipelineSceneState[];
  currentIndex?: number; // 1-based, su an isleyen sahne
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
type Props = {
  open: boolean;
  onClose: () => void;
  onApprove: (storyboard: Storyboard) => void;
  pipelineState?: PipelineState;
  onCancel?: () => void;
  // Extended Modu icin: HeroPrompt'tan prefill
  initialTopic?: string;
  initialDurationSec?: number;
  initialModel?: string;
  initialAspectRatio?: string;
  // True ise modal acilir acilmaz Adim 1'i atlar, otomatik senaryo uretmeye baslar
  autoGenerate?: boolean;
};

type Step = 1 | 2 | 3;

const ASPECT_OPTIONS: string[] = ["16:9", "9:16", "1:1", "4:3"];

// Modele gore sahne basina max sure (saniye)
function perSceneMaxFor(modelDisplayName: string): number {
  const n = (modelDisplayName || "").toLowerCase();
  if (n.includes("kling 3.0 pro") || n.includes("seedance 2")) return 15;
  if (n.includes("hailuo") || n.includes("ltx") || n.includes("veo")) return 10;
  if (n.includes("wan")) return 8;
  if (n.includes("grok")) return 6;
  return 10;
}

function defaultVideoModel(): string {
  const list = KIE_MODEL_FAMILIES.video as readonly string[];
  const kling = list.find((m) => m.toLowerCase().includes("kling 3.0 pro"));
  if (kling) return kling;
  return (KIE_DEFAULT_MODELS as any).videoModel || list[0] || "Kling 3.0 Pro";
}

function newSceneId(): string {
  return `sc${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function durationLabel(sec: number): string {
  if (sec < 60) return `${sec} sn`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (s === 0) return `${sec} sn (${m} dk)`;
  return `${sec} sn (${m} dk ${s} sn)`;
}

// ---------------------------------------------------------------------------
// Bilesen
// ---------------------------------------------------------------------------
export function ScenarioWizard({
  open,
  onClose,
  onApprove,
  pipelineState,
  onCancel,
  initialTopic,
  initialDurationSec,
  initialModel,
  initialAspectRatio,
  autoGenerate,
}: Props): JSX.Element | null {
  const [step, setStep] = useState<Step>(1);

  // Adim 1 state — extended modunda HeroPrompt'tan prefill
  const [topic, setTopic] = useState(initialTopic || "");
  const [totalDurationSec, setTotalDurationSec] = useState(initialDurationSec || 60);
  const [modelDisplayName, setModelDisplayName] = useState<string>(initialModel || defaultVideoModel());
  const [aspectRatio, setAspectRatio] = useState<string>(initialAspectRatio || "16:9");
  const [language] = useState<"Türkçe" | "English">("Türkçe");
  const [globalStyle] = useState<string>(
    "cinematic lighting, professional color grading, smooth camera movement"
  );

  // Adim 2 state
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);

  // Genel
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const perSceneMaxSec = useMemo(() => perSceneMaxFor(modelDisplayName), [modelDisplayName]);
  const suggestedSceneCount = useMemo(
    () => suggestSceneCount(totalDurationSec, perSceneMaxSec),
    [totalDurationSec, perSceneMaxSec]
  );

  // pipelineState aktif olunca otomatik adim 3'e gec
  useEffect(() => {
    if (
      pipelineState &&
      (pipelineState.active === "running" ||
        pipelineState.active === "done" ||
        pipelineState.active === "failed")
    ) {
      setStep(3);
    }
  }, [pipelineState]);

  // Modal kapaninca state'i resetle
  useEffect(() => {
    if (!open) {
      setStep(1);
      setStoryboard(null);
      setError(null);
      setGenerating(false);
    }
  }, [open]);

  // Modal her acildiginda HeroPrompt'tan gelen initialler aktarilsin
  useEffect(() => {
    if (open) {
      if (initialTopic !== undefined) setTopic(initialTopic);
      if (initialDurationSec !== undefined) setTotalDurationSec(initialDurationSec);
      if (initialModel) setModelDisplayName(initialModel);
      if (initialAspectRatio) setAspectRatio(initialAspectRatio);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // autoGenerate aktifse acilir acilmaz senaryo uret (Extended Modu icin)
  useEffect(() => {
    if (open && autoGenerate && step === 1 && !generating && !storyboard && (initialTopic || topic).trim().length > 0) {
      const t = setTimeout(() => { void handleGenerate(); }, 200);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoGenerate, step]);

  // SSR guvenli portal kontrolu — server'da document yok
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => { setPortalReady(true); }, []);

  if (!open) return null;

  // ---- Adim 1 -> 2: senaryo uretimi ----
  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/scenario/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          totalDurationSec,
          modelDisplayName,
          perSceneMaxSec,
          language,
          globalStyle,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Sunucu hatası (${res.status})`);
      }
      const sb: Storyboard | undefined = data?.storyboard;
      if (!sb || !Array.isArray(sb.scenes) || sb.scenes.length === 0) {
        throw new Error("Senaryo üretilemedi (boş yanıt).");
      }
      // Aspect override'i sahnelere ekle
      const scenes = sb.scenes.map((s) => ({ ...s, aspectRatio }));
      setStoryboard({ ...sb, scenes });
      setStep(2);
      // AI başarısız olduysa kullanıcıyı uyar (warning) — hata değil ama bilgi
      if (data?.warning) {
        setError(`⚠️ ${data.warning}`);
      } else if (data?.source === "ai") {
        setError(null);
      }
    } catch (e: any) {
      setError(e?.message || "Beklenmeyen hata.");
    } finally {
      setGenerating(false);
    }
  }

  // ---- Adim 2 sahne mutasyonlari ----
  function updateScene(id: string, patch: Partial<Scene>) {
    if (!storyboard) return;
    setStoryboard({
      ...storyboard,
      scenes: storyboard.scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  function deleteScene(id: string) {
    if (!storyboard) return;
    const filtered = storyboard.scenes.filter((s) => s.id !== id);
    // index'leri yeniden numarala
    const reindexed = filtered.map((s, i) => ({
      ...s,
      index: i + 1,
      // son sahnenin transition'ini sil
      transitionAfter: i === filtered.length - 1 ? undefined : s.transitionAfter ?? "smooth-fade",
    }));
    setStoryboard({ ...storyboard, scenes: reindexed });
  }

  function addScene() {
    if (!storyboard) return;
    const nextIndex = storyboard.scenes.length + 1;
    const newScene: Scene = {
      id: newSceneId(),
      index: nextIndex,
      title: `Sahne ${nextIndex}`,
      prompt: "Yeni sahnenin görsel anlatımını buraya yazın.",
      durationSec: Math.min(perSceneMaxSec, 5),
      cameraAngle: "medium-shot",
      transitionAfter: undefined,
      aspectRatio,
    };
    // Onceki sahnenin transition'i undefined ise bir varsayilan ata
    const updatedExisting = storyboard.scenes.map((s, i, arr) =>
      i === arr.length - 1 ? { ...s, transitionAfter: s.transitionAfter ?? "smooth-fade" } : s
    );
    setStoryboard({ ...storyboard, scenes: [...updatedExisting, newScene] });
  }

  // ---- Adim 2 onaylama ----
  function handleApprove() {
    if (!storyboard) return;
    // Sahneleri index'e gore guncelle (kullanici sildi/ekledi olabilir)
    const finalSb: Storyboard = {
      ...storyboard,
      scenes: storyboard.scenes.map((s, i, arr) => ({
        ...s,
        index: i + 1,
        transitionAfter: i === arr.length - 1 ? undefined : s.transitionAfter,
        aspectRatio,
      })),
      totalDurationSec: storyboard.scenes.reduce((sum, s) => sum + s.durationSec, 0),
      modelDisplayName,
    };
    onApprove(finalSb);
    setStep(3);
  }

  const computedTotal = storyboard
    ? storyboard.scenes.reduce((sum, s) => sum + s.durationSec, 0)
    : 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (!portalReady) return null;

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-2xl h-[min(92vh,820px)] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Baslik (sabit) */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-zinc-900 bg-zinc-950">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <h2 className="text-base font-semibold text-white">
              Senaryo Sihirbazı
            </h2>
            <span className="ml-2 text-[11px] text-zinc-500">Adım {step} / 3</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ICERIK (scroll edilebilir, butonlar burada normal flow icinde kalır) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 scrollbar-thin">
          {step === 1 ? (
            <Step1Setup
              topic={topic}
              setTopic={setTopic}
              totalDurationSec={totalDurationSec}
              setTotalDurationSec={setTotalDurationSec}
              modelDisplayName={modelDisplayName}
              setModelDisplayName={setModelDisplayName}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              suggestedSceneCount={suggestedSceneCount}
              perSceneMaxSec={perSceneMaxSec}
              error={error}
              generating={generating}
              onGenerate={handleGenerate}
              onCancel={onClose}
            />
          ) : null}

          {step === 2 && storyboard ? (
            <Step2Preview
              storyboard={storyboard}
              computedTotal={computedTotal}
              warning={error || undefined}
              onBack={() => setStep(1)}
              onUpdateScene={updateScene}
              onDeleteScene={deleteScene}
              onAddScene={addScene}
              onCancel={onClose}
              onApprove={handleApprove}
            />
          ) : null}

          {step === 3 ? (
            <Step3Progress
              pipelineState={pipelineState}
              storyboard={storyboard}
              onCancel={onCancel}
              onClose={onClose}
            />
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

// ---------------------------------------------------------------------------
// Adim 1 — Kurulum
// ---------------------------------------------------------------------------
function Step1Setup(props: {
  topic: string;
  setTopic: (v: string) => void;
  totalDurationSec: number;
  setTotalDurationSec: (v: number) => void;
  modelDisplayName: string;
  setModelDisplayName: (v: string) => void;
  aspectRatio: string;
  setAspectRatio: (v: string) => void;
  suggestedSceneCount: number;
  perSceneMaxSec: number;
  error: string | null;
  generating: boolean;
  onGenerate: () => void;
  onCancel: () => void;
}) {
  const {
    topic,
    setTopic,
    totalDurationSec,
    setTotalDurationSec,
    modelDisplayName,
    setModelDisplayName,
    aspectRatio,
    setAspectRatio,
    suggestedSceneCount,
    perSceneMaxSec,
    error,
    generating,
    onGenerate,
    onCancel,
  } = props;

  const canGenerate = topic.trim().length > 0 && !generating;

  return (
    <div className="space-y-5">
      {/* Konu */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          Konu / Prompt
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
          placeholder={
            "Örnek: İstanbul'da gün batımında çay içen bir adamın hikayesi.\n" +
            "Veya: Yapay zekanın insan hayatına etkilerini anlatan kısa belgesel."
          }
          className="w-full rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
        />
      </div>

      {/* Sure */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-zinc-400">Hedef süre</label>
          <span className="text-xs font-medium text-purple-300">
            {durationLabel(totalDurationSec)}
          </span>
        </div>
        <input
          type="range"
          min={15}
          max={180}
          step={5}
          value={totalDurationSec}
          onChange={(e) => setTotalDurationSec(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
        <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
          <span>15 sn</span>
          <span>3 dk</span>
        </div>
      </div>

      {/* Model */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Video modeli</label>
        <Dropdown
          value={modelDisplayName}
          options={KIE_MODEL_FAMILIES.video as unknown as string[]}
          onChange={setModelDisplayName}
          searchable
          size="md"
          buttonClassName="w-full justify-between"
          className="w-full block"
        />
      </div>

      {/* Aspect */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">En-boy oranı</label>
        <div className="flex flex-wrap gap-2">
          {ASPECT_OPTIONS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAspectRatio(a)}
              className={clsx(
                "px-3 py-1.5 text-xs rounded-full border transition-colors",
                aspectRatio === a
                  ? "bg-purple-600/20 border-purple-500 text-purple-200"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Bilgi */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/40">
        <Film className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed text-zinc-400">
          Sahne sayısı modelin maksimum süresine göre otomatik hesaplanacak.{" "}
          <span className="text-zinc-300">
            Tahmini sahne sayısı: ~{suggestedSceneCount}
          </span>{" "}
          (sahne başı maks {perSceneMaxSec} sn).
        </div>
      </div>

      {/* Hata */}
      {error ? (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-900/60 bg-red-950/40 text-red-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Butonlar (sticky bottom) */}
      <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-3 border-t border-zinc-800 bg-zinc-950 z-20 flex items-center justify-between gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-900"
        >
          İptal
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className={clsx(
            "px-5 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all shadow-lg",
            canGenerate
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-purple-500/30"
              : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
          )}
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Üretiliyor...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Senaryo Üret
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Adim 2 — Onizleme / Duzenleme
// ---------------------------------------------------------------------------
function Step2Preview(props: {
  storyboard: Storyboard;
  computedTotal: number;
  warning?: string;
  onBack: () => void;
  onUpdateScene: (id: string, patch: Partial<Scene>) => void;
  onDeleteScene: (id: string) => void;
  onAddScene: () => void;
  onCancel: () => void;
  onApprove: () => void;
}) {
  const {
    storyboard,
    computedTotal,
    warning,
    onBack,
    onUpdateScene,
    onDeleteScene,
    onAddScene,
    onCancel,
    onApprove,
  } = props;

  return (
    <div className="space-y-4">
      {/* AI uyarisi (Gemini calismadiysa) */}
      {warning ? (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-[11px]">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{warning}</span>
        </div>
      ) : null}

      {/* Ust baslik */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-900">
        <div className="min-w-0">
          <div className="text-xs text-zinc-500 mb-0.5">Konu</div>
          <div className="text-sm font-medium text-zinc-100 truncate">{storyboard.topic}</div>
          <div className="mt-1 text-[11px] text-zinc-500">
            Toplam {durationLabel(computedTotal)} · {storyboard.scenes.length} sahne ·{" "}
            {storyboard.modelDisplayName}
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-zinc-800 text-zinc-300 hover:bg-zinc-900"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Tekrar Üret
        </button>
      </div>

      {/* Sahneler */}
      <div className="space-y-3">
        {storyboard.scenes.map((scene, i) => {
          const isLast = i === storyboard.scenes.length - 1;
          return (
            <SceneCard
              key={scene.id}
              scene={scene}
              isLast={isLast}
              onChange={(patch) => onUpdateScene(scene.id, patch)}
              onDelete={() => onDeleteScene(scene.id)}
            />
          );
        })}
      </div>

      {/* Sahne Ekle */}
      <button
        type="button"
        onClick={onAddScene}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-lg border border-dashed border-zinc-800 text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
      >
        <Plus className="h-4 w-4" />
        Sahne Ekle
      </button>

      {/* Toplam + butonlar (sticky bottom — her zaman görünür) */}
      <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-3 border-t border-zinc-800 bg-zinc-950 backdrop-blur z-20 flex items-center justify-between gap-2 mt-2">
        <div className="text-xs text-zinc-400 shrink-0">
          Toplam: <span className="text-zinc-100 font-semibold">{durationLabel(computedTotal)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-900"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={storyboard.scenes.length === 0}
            className={clsx(
              "px-5 py-2 text-sm font-medium rounded-lg flex items-center gap-2 shadow-lg",
              storyboard.scenes.length === 0
                ? "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-purple-500/30"
            )}
          >
            <Check className="h-4 w-4" />
            Onayla ve Üret
          </button>
        </div>
      </div>
    </div>
  );
}

function SceneCard(props: {
  scene: Scene;
  isLast: boolean;
  onChange: (patch: Partial<Scene>) => void;
  onDelete: () => void;
}) {
  const { scene, isLast, onChange, onDelete } = props;

  const cameraOptions = useMemo(() => CAMERA_ANGLES.map((a) => a.tr), []);
  const transitionOptions = useMemo(() => TRANSITIONS.map((t) => t.tr), []);

  const cameraTr =
    CAMERA_ANGLES.find((a) => a.id === scene.cameraAngle)?.tr ?? CAMERA_ANGLES[0].tr;
  const transitionTr = scene.transitionAfter
    ? TRANSITIONS.find((t) => t.id === scene.transitionAfter)?.tr ?? TRANSITIONS[0].tr
    : TRANSITIONS[0].tr;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-3">
      {/* Ust: numara + baslik + sil */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-md text-[11px] font-semibold gradient-vibe text-white">
          #{scene.index}
        </span>
        <input
          value={scene.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Sahne başlığı"
          className="flex-1 min-w-0 bg-transparent text-sm font-medium text-zinc-100 placeholder:text-zinc-600 px-2 py-1 rounded border border-transparent hover:border-zinc-800 focus:border-purple-500/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/30"
          aria-label="Sahneyi sil"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Anlatim */}
      <textarea
        value={scene.prompt}
        onChange={(e) => onChange({ prompt: e.target.value })}
        rows={3}
        placeholder="Sahnede ne oluyor? (görsel tarif)"
        className="w-full rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
      />

      {/* 3'lu grid */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
            Süre (sn)
          </label>
          <input
            type="number"
            min={3}
            max={15}
            value={scene.durationSec}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isFinite(n)) return;
              onChange({ durationSec: Math.max(3, Math.min(15, Math.round(n))) });
            }}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md text-xs text-zinc-100 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
            Kamera
          </label>
          <Dropdown
            value={cameraTr}
            options={cameraOptions}
            onChange={(tr) => {
              const found = CAMERA_ANGLES.find((a) => a.tr === tr);
              if (found) onChange({ cameraAngle: found.id });
            }}
            size="sm"
            buttonClassName="w-full justify-between"
            className="w-full block"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
            Geçiş
          </label>
          {isLast ? (
            <div className="px-2 py-1.5 text-[11px] text-zinc-600 italic">— son sahne —</div>
          ) : (
            <Dropdown
              value={transitionTr}
              options={transitionOptions}
              onChange={(tr) => {
                const found = TRANSITIONS.find((t) => t.tr === tr);
                if (found) onChange({ transitionAfter: found.id as Transition });
              }}
              size="sm"
              buttonClassName="w-full justify-between"
              className="w-full block"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Adim 3 — Uretim Progresi
// ---------------------------------------------------------------------------
function Step3Progress(props: {
  pipelineState?: PipelineState;
  storyboard: Storyboard | null;
  onCancel?: () => void;
  onClose: () => void;
}) {
  const { pipelineState, storyboard, onCancel, onClose } = props;

  const total = pipelineState?.total ?? storyboard?.scenes.length ?? 0;
  const completed = pipelineState?.completed ?? 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isDone = pipelineState?.active === "done";
  const isFailed = pipelineState?.active === "failed";
  const isCancelled = pipelineState?.active === "cancelled";
  const isRunning = pipelineState?.active === "running";

  // Aktif sahne
  const activeScene =
    pipelineState?.scenes.find((s) => s.status === "running") ??
    (pipelineState?.currentIndex
      ? pipelineState.scenes.find((s) => s.index === pipelineState.currentIndex)
      : undefined);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          {isDone ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              Tamamlandı!
            </>
          ) : isFailed ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-400" />
              Üretim başarısız
            </>
          ) : isCancelled ? (
            <>
              <X className="h-4 w-4 text-zinc-400" />
              İptal edildi
            </>
          ) : (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
              Üretiliyor...
            </>
          )}
        </h3>
        {isDone ? (
          <div className="mt-1 text-xs text-zinc-400">
            Timeline'a {completed} klip eklendi.
          </div>
        ) : (
          <div className="mt-1 text-xs text-zinc-400">
            {completed} / {total} sahne tamamlandı
          </div>
        )}
      </div>

      {/* Ilerleme cubugu */}
      <div>
        <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
          <div
            className="h-full gradient-vibe transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="text-[10px] text-zinc-500 mt-1 text-right">{percent}%</div>
      </div>

      {/* Aktif sahne */}
      {isRunning && activeScene ? (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-purple-900/40 bg-purple-950/20">
          <Loader2 className="h-4 w-4 animate-spin text-purple-400 shrink-0" />
          <div className="text-xs text-zinc-200 truncate">
            <span className="text-zinc-400">
              Sahne {activeScene.index}/{total} üretiliyor:
            </span>{" "}
            <span className="font-medium">{activeScene.title}</span>
          </div>
        </div>
      ) : null}

      {/* Sahne listesi */}
      <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
        {(pipelineState?.scenes ?? storyboard?.scenes.map((s): PipelineSceneState => ({
          sceneId: s.id,
          index: s.index,
          title: s.title,
          status: "pending",
        })) ?? []).map((s) => (
          <div
            key={s.sceneId}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs"
          >
            <SceneStatusIcon status={s.status} />
            <span className="text-zinc-500 w-10 shrink-0">#{s.index}</span>
            <span
              className={clsx(
                "truncate flex-1",
                s.status === "done" && "text-zinc-300",
                s.status === "failed" && "text-red-300",
                s.status === "running" && "text-purple-200",
                s.status === "pending" && "text-zinc-500"
              )}
            >
              {s.title}
            </span>
            {s.status === "failed" && s.error ? (
              <span className="text-[10px] text-red-400 truncate max-w-[160px]" title={s.error}>
                {s.error}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {/* Butonlar (sticky bottom) */}
      <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-3 border-t border-zinc-800 bg-zinc-950 z-20 flex items-center justify-end gap-2 mt-2">
        {isDone || isFailed || isCancelled ? (
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/30"
          >
            Kapat
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onCancel?.()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-900"
          >
            <ChevronLeft className="h-4 w-4" />
            İptal
          </button>
        )}
      </div>
    </div>
  );
}

function SceneStatusIcon({ status }: { status: PipelineSceneStatus }) {
  if (status === "done") {
    return <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
  }
  if (status === "failed") {
    return <X className="h-3.5 w-3.5 text-red-400 shrink-0" />;
  }
  if (status === "running") {
    return <Loader2 className="h-3.5 w-3.5 text-purple-400 animate-spin shrink-0" />;
  }
  return <span className="h-3.5 w-3.5 rounded-full border border-zinc-700 shrink-0" />;
}
