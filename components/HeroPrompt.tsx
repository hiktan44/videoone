"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowUp, ChevronDown, Lightbulb, Wand2, Loader2, AlertCircle, Film } from "lucide-react";
import { Dropdown, type DropdownGroup } from "./Dropdown";
import { useStore } from "@/lib/store";
import { CATEGORY_LABEL_TR, getMapping } from "@/lib/models";
import { KIE_CATALOG, type KieCategory } from "@/lib/kie-catalog";
import { ReferenceUploader, type ReferenceAsset } from "./ReferenceUploader";
import { ScenarioWizard, type PipelineState as WizardPipelineState, type PipelineSceneState } from "./ScenarioWizard";
import { runStoryboardPipeline, type PipelineHandle } from "@/lib/pipeline";
import type { Storyboard } from "@/lib/scenario";
import { makeSampleProject } from "@/lib/mocks";
import { upsertProject } from "@/lib/persistence";

function buildGroups(cats: KieCategory[]): DropdownGroup[] {
  const groups: DropdownGroup[] = [];
  for (const c of cats) {
    const opts = KIE_CATALOG.filter((e) => e.category === c).map((e) => e.display);
    if (opts.length > 0) groups.push({ label: CATEGORY_LABEL_TR[c], options: opts });
  }
  return groups;
}
const IMG_GROUPS = buildGroups(["image", "image-edit", "image-to-image", "upscale", "background-removal", "reframe"]);
const VID_GROUPS = buildGroups(["video", "image-to-video", "video-extend", "video-edit", "lipsync", "video-upscale"]);

export function HeroPrompt() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [imageRefs, setImageRefs] = useState<ReferenceAsset[]>([]);
  const [audioRefs, setAudioRefs] = useState<ReferenceAsset[]>([]);
  const [videoRefs, setVideoRefs] = useState<ReferenceAsset[]>([]);
  const [mode, setMode] = useState<"video" | "image">("video");
  const [showRefsPanel, setShowRefsPanel] = useState(false);

  const settings = useStore((s) => s.settings);
  const updateSetting = useStore((s) => s.updateSetting);
  const addJob = useStore((s) => s.addJob);
  const updateJob = useStore((s) => s.updateJob);

  // --- Senaryo Sihirbazi state ---
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardPipeline, setWizardPipeline] = useState<WizardPipelineState | undefined>(undefined);
  // Wizard'in HeroPrompt'tan aldigi prefill degerleri (Extended Modu icin)
  const [wizardInitial, setWizardInitial] = useState<{
    topic?: string; durationSec?: number; model?: string; aspectRatio?: string; auto?: boolean;
  }>({});
  const pipelineHandleRef = useRef<PipelineHandle | null>(null);

  const startPipelineFromStoryboard = useCallback(async (storyboard: Storyboard) => {
    // Wizard'in PipelineState'ini ilkle (tum sahneler "pending")
    const initial: WizardPipelineState = {
      active: "running",
      total: storyboard.scenes.length,
      completed: 0,
      currentIndex: 1,
      scenes: storyboard.scenes.map((s): PipelineSceneState => ({
        sceneId: s.id, index: s.index, title: s.title, status: "pending",
      })),
    };
    setWizardPipeline(initial);

    // Yeni proje olustur — login varsa API'den cuid al, yoksa LS-only id kullan
    const project = makeSampleProject(storyboard.topic.slice(0, 60) || "Yeni Vibe");
    project.clips = [];
    project.chatMessages = [];
    project.mediaItems = [];

    // Login varsa API'ye POST → DB'de cuid ile yarat → o id'yi kullan
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: project.name,
          gradient: project.gradient,
          settings: project.settings,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.project?.id) {
          project.id = data.project.id; // cuid ile uzerine yaz
        }
      }
    } catch {}

    upsertProject(project);
    useStore.getState().loadProject(project);
    router.push(`/editor/${project.id}`);

    // Pipeline'i baslat
    const handle = runStoryboardPipeline(storyboard, {
      aspectRatio: settings.aspectRatio,
      onProgress: (state) => {
        // pipeline.ts -> wizard formatina cevir
        setWizardPipeline((prev) => {
          if (!prev) return prev;
          const completedIds = new Set(state.scenesCompleted.map((c) => c.sceneId));
          const failedMap = new Map(state.scenesFailed.map((f) => [f.sceneId, f.error]));
          const currentIdx0 = state.currentSceneIndex;
          const scenes: PipelineSceneState[] = prev.scenes.map((sc, i) => {
            if (completedIds.has(sc.sceneId)) return { ...sc, status: "done" };
            if (failedMap.has(sc.sceneId)) return { ...sc, status: "failed", error: failedMap.get(sc.sceneId) };
            if (i === currentIdx0 && state.status === "running") return { ...sc, status: "running" };
            return { ...sc, status: "pending" };
          });
          let active: WizardPipelineState["active"] = "running";
          if (state.status === "completed") active = "done";
          else if (state.status === "failed") active = "failed";
          else if (state.status === "cancelled") active = "cancelled";
          return {
            active,
            total: state.totalScenes,
            completed: state.scenesCompleted.length,
            currentIndex: currentIdx0 + 1,
            scenes,
          };
        });
      },
    });
    pipelineHandleRef.current = handle;
  }, [settings.aspectRatio, router]);

  const cancelPipeline = useCallback(() => {
    pipelineHandleRef.current?.cancel();
  }, []);

  const closeWizard = useCallback(() => {
    setWizardOpen(false);
    // Pipeline calisiyorsa iptal et
    if (wizardPipeline?.active === "running") cancelPipeline();
    setWizardPipeline(undefined);
  }, [wizardPipeline, cancelPipeline]);

  // Aktif modelin gereksinimleri
  const activeMapping = useMemo(
    () => getMapping(mode === "video" ? settings.videoModel : settings.imageModel),
    [mode, settings.videoModel, settings.imageModel]
  );
  const needsImage = Boolean(activeMapping.requiresImage);
  const needsAudio = Boolean(activeMapping.requiresAudio);
  const needsVideo = Boolean(activeMapping.requiresVideo);
  const anyNeed = needsImage || needsAudio || needsVideo;

  // Seçili modelin desteklediği maksimum süre (saniye).
  const maxDuration = useMemo(() => modelMaxDuration(settings.videoModel), [settings.videoModel]);
  // Süre slider modelin max'ını aşarsa Extended Modu — Senaryo Sihirbazına yönlendirilecek
  const isExtendedMode = mode === "video" && settings.videoDuration > maxDuration;

  // Eksik girdi var mi?
  const missingImage = needsImage && imageRefs.length === 0;
  const missingAudio = needsAudio && audioRefs.length === 0;
  const missingVideo = needsVideo && videoRefs.length === 0;

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const clean = prompt.trim();
      if (submitting) return;

      // EXTENDED MODU: süre slider modelin max'ını aştıysa direkt Senaryo Sihirbazı'nı aç
      if (isExtendedMode) {
        if (!clean) {
          setUiError("Extended Modu için konu/prompt gerekli (sahnelere bölmek için).");
          return;
        }
        setUiError(null);
        setWizardInitial({
          topic: clean,
          durationSec: settings.videoDuration,
          model: settings.videoModel,
          aspectRatio: settings.aspectRatio,
          auto: true, // sihirbaz acilir acilmaz otomatik senaryo uretsin
        });
        setWizardPipeline(undefined);
        setWizardOpen(true);
        return;
      }

      const totalRefs = imageRefs.length + audioRefs.length + videoRefs.length;
      if (!clean && totalRefs === 0) {
        setUiError("Prompt yazın veya bir referans yükleyin.");
        return;
      }
      if (missingImage) { setUiError("Bu model referans görsel gerektirir."); return; }
      if (missingAudio) { setUiError("Bu model ses dosyası gerektirir."); return; }
      if (missingVideo) { setUiError("Bu model video dosyası gerektirir."); return; }

      setUiError(null);
      setSubmitting(true);

      const jobId = addJob({
        kind: mode,
        prompt: clean || (totalRefs ? "(referanslardan)" : ""),
        status: "running",
      });

      try {
        const endpoint = mode === "image" ? "/api/kie/image" : "/api/kie/video";
        const model = mode === "image" ? settings.imageModel : settings.videoModel;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: clean,
            model,
            imageUrls: imageRefs.map((r) => r.url),
            audioUrls: audioRefs.map((r) => r.url),
            videoUrls: videoRefs.map((r) => r.url),
            aspect_ratio: settings.aspectRatio,
            duration: mode === "video" ? settings.videoDuration : undefined,
            resolution: mode === "video" ? settings.videoResolution : undefined,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          taskId?: string; status?: string; resultUrl?: string; error?: string; family?: string;
        };

        if (!res.ok || !data.taskId || data.taskId === "error") {
          const msg =
            data.error ??
            (res.status === 401 ? "API anahtarı geçersiz"
            : res.status === 429 ? "Çok fazla istek"
            : res.status >= 500 ? "Kie.ai sunucu hatası"
            : "Üretim başlatılamadı.");
          updateJob(jobId, { status: "failed", error: msg });
          setUiError(msg);
          return;
        }

        updateJob(jobId, {
          taskId: data.taskId,
          status: "running",
          resultUrl: data.resultUrl,
          family: data.family,
        });
        setPrompt("");
        // Referanslari koru — kullanici aynilari farkli promptlarla denesin.
      } catch (err) {
        const msg = err instanceof Error ? `Ağ hatası: ${err.message}` : "Bilinmeyen ağ hatası";
        updateJob(jobId, { status: "failed", error: msg });
        setUiError(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [prompt, submitting, imageRefs, audioRefs, videoRefs, mode, missingImage, missingAudio, missingVideo, settings, addJob, updateJob, isExtendedMode]
  );

  // Modele gore otomatik panel ac
  const showImageUploader = needsImage || imageRefs.length > 0 || (showRefsPanel && mode === "image");
  const showAudioUploader = needsAudio || audioRefs.length > 0;
  const showVideoUploader = needsVideo || videoRefs.length > 0;
  const anyUploaderVisible = showImageUploader || showAudioUploader || showVideoUploader || showRefsPanel;

  return (
    <form
      onSubmit={submit}
      className="mt-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md p-4 shadow-2xl shadow-black/30"
    >
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        placeholder={anyNeed ? "Referans dosyasına uygulanacak yönergeyi yazın..." : "Bir video yapın hakkında..."}
        className="w-full bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none px-2 py-1 resize-none"
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
      />

      {anyNeed && (missingImage || missingAudio || missingVideo) ? (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>{mode === "video" ? settings.videoModel : settings.imageModel}</strong> şunları gerektirir:{" "}
            {[missingImage && "görsel", missingAudio && "ses", missingVideo && "video"].filter(Boolean).join(", ")}.
            Aşağıdan yükleyin.
          </span>
        </div>
      ) : null}

      {(anyUploaderVisible || imageRefs.length || audioRefs.length || videoRefs.length) ? (
        <div className="mt-3 space-y-2">
          {showImageUploader ? (
            <UploaderRow label="Referans Görseller" required={needsImage}>
              <ReferenceUploader kind="image" refs={imageRefs} onChange={setImageRefs} max={4} compact />
            </UploaderRow>
          ) : null}
          {showAudioUploader ? (
            <UploaderRow label="Referans Ses (Lipsync için)" required={needsAudio}>
              <ReferenceUploader kind="audio" refs={audioRefs} onChange={setAudioRefs} max={2} compact />
            </UploaderRow>
          ) : null}
          {showVideoUploader ? (
            <UploaderRow label="Referans Video (Uzatma/Düzenleme için)" required={needsVideo}>
              <ReferenceUploader kind="video" refs={videoRefs} onChange={setVideoRefs} max={2} compact />
            </UploaderRow>
          ) : null}
        </div>
      ) : null}

      {mode === "video" ? (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ChipGroup
            label="En-Boy Oranı"
            value={settings.aspectRatio}
            options={[
              { v: "16:9", icon: "▭", title: "Yatay (YouTube)" },
              { v: "9:16", icon: "▯", title: "Dikey (Reels/TikTok)" },
              { v: "1:1", icon: "■", title: "Kare (Instagram)" },
              { v: "4:3", icon: "▭", title: "Klasik" },
            ]}
            onChange={(v) => updateSetting("aspectRatio", v)}
          />
          <DurationSlider
            value={Math.min(settings.videoDuration, maxDuration)}
            modelMax={maxDuration}
            absMax={60}
            onChange={(d) => updateSetting("videoDuration", d)}
          />
          <ChipGroup
            label="Çözünürlük"
            value={settings.videoResolution}
            options={[
              { v: "720p", title: "720p — hızlı/ekonomik" },
              { v: "1080p", title: "1080p — standart" },
              { v: "4K", title: "4K — yüksek kalite (sadece Veo)" },
            ]}
            onChange={(v) => updateSetting("videoResolution", v)}
          />
        </div>
      ) : null}

      {mode === "video" ? (
        <div className="mt-2 text-[11px] text-zinc-500 px-1">
          💡 Tek seferlik üretim sınırı modele göre değişir: çoğu Kie modeli <strong className="text-zinc-300">5-10 sn</strong>,
          <strong className="text-zinc-300"> Kling 3.0 Pro</strong> ve <strong className="text-zinc-300">Seedance 2.0</strong> ailesi
          15 sn'ye kadar destekler. Daha uzun video için <strong className="text-zinc-300">"Video — Uzatma"</strong> kategorisindeki
          modellerle (Veo Extend, Wan Extend, Grok Extend) peş peşe ekleyerek dakika seviyesine çıkabilirsiniz.
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowRefsPanel((s) => !s)}
          className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors ${
            showRefsPanel || imageRefs.length || audioRefs.length || videoRefs.length
              ? "border-purple-500 bg-purple-500/15 text-purple-200"
              : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
          }`}
          title="Referans paneli aç/kapat"
        >
          <Plus className="h-4 w-4" />
        </button>

        <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden text-xs">
          <button type="button" onClick={() => setMode("video")}
            className={`px-3 py-1.5 ${mode === "video" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}>
            Video
          </button>
          <button type="button" onClick={() => setMode("image")}
            className={`px-3 py-1.5 ${mode === "image" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}>
            Görsel
          </button>
        </div>

        <button type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300">
          <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
          Bir fikirden
          <ChevronDown className="h-3 w-3 text-zinc-500" />
        </button>

        <button
          type="button"
          onClick={() => { setWizardPipeline(undefined); setWizardInitial({}); setWizardOpen(true); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1.5 text-xs text-purple-200 font-medium"
          title="Konunu yaz, AI 12-20 sahnelik senaryo hazırlasın, onayla → otomatik üret"
        >
          <Film className="h-3.5 w-3.5" />
          Senaryo Sihirbazı
        </button>
        <button type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300"
          title="Yer tutucu — yakında">
          <Wand2 className="h-3.5 w-3.5 text-purple-400" />
          Otomatik
          <ChevronDown className="h-3 w-3 text-zinc-500" />
        </button>

        <div className="flex-1" />

        <Dropdown label="Görsel" value={settings.imageModel} groups={IMG_GROUPS}
          onChange={(v) => updateSetting("imageModel", v)} size="sm" searchable />
        <Dropdown label="Video" value={settings.videoModel} groups={VID_GROUPS}
          onChange={(v) => updateSetting("videoModel", v)} size="sm" searchable />

        <Dropdown
          value={settings.language === "Türkçe" ? "TR" : settings.language === "English" ? "EN" : "ES"}
          options={["TR", "EN", "ES"]}
          onChange={(v) => {
            const map: Record<string, string> = { TR: "Türkçe", EN: "English", ES: "Español" };
            updateSetting("language", map[v]);
          }}
          size="sm" buttonClassName="!px-2" align="right"
        />

        <button
          type="submit"
          disabled={submitting || missingImage || missingAudio || missingVideo}
          className={`h-9 px-3 rounded-lg text-white flex items-center justify-center gap-1.5 shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs ${
            isExtendedMode
              ? "bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/30"
              : "bg-gradient-vibe shadow-purple-500/30"
          }`}
          aria-label={isExtendedMode ? "Senaryo Üret ve Birleştir" : "Üret"}
          title={isExtendedMode ? `${settings.videoDuration} sn'lik video için senaryo üret` : "Üret"}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            isExtendedMode ? <>⚡ Senaryo Üret</> : <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {uiError ? <div className="mt-2 px-2 text-xs text-rose-400">{uiError}</div> : null}

      <ScenarioWizard
        open={wizardOpen}
        onClose={closeWizard}
        onApprove={(sb) => startPipelineFromStoryboard(sb)}
        pipelineState={wizardPipeline}
        onCancel={cancelPipeline}
        initialTopic={wizardInitial.topic}
        initialDurationSec={wizardInitial.durationSec}
        initialModel={wizardInitial.model}
        initialAspectRatio={wizardInitial.aspectRatio}
        autoGenerate={wizardInitial.auto}
      />
    </form>
  );
}

// Model bazinda maksimum sure (saniye). Kie dokumantasyonundan eldedikilerimiz:
// - Kling 3.0 Pro: 15 sn
// - Seedance 2.0 / 2.0 Fast: 15 sn
// - Hailuo 2.3: 10 sn
// - Veo 3.1 (Fast/Lite/Pro): 8 sn varsayilan, 10 sn istisnai
// - Wan ailesi: 5-8 sn
// - Grok Imagine Video: 6 sn
// - LTX2: 10 sn
// - Diger / bilinmeyen: 10 sn (guvenli varsayilan)
function modelMaxDuration(displayName: string): number {
  if (/Kling.*3\.0/i.test(displayName)) return 15;
  if (/Seedance.*2/i.test(displayName)) return 15;
  if (/Hailuo/i.test(displayName)) return 10;
  if (/Veo 3\.1/i.test(displayName)) return 10;
  if (/Wan/i.test(displayName)) return 8;
  if (/Grok Imagine/i.test(displayName)) return 6;
  if (/LTX/i.test(displayName)) return 10;
  if (/OmniHuman|InfiniteTalk/i.test(displayName)) return 30; // lipsync'ler ses suresine bagli
  return 10;
}

type ChipOpt = { v: string; icon?: string; title?: string };

function ChipGroup({
  label, value, options, onChange,
}: { label: string; value: string; options: ChipOpt[]; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 px-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            title={o.title}
            className={`text-[11px] rounded-md px-2 py-1 border transition-colors flex items-center gap-1 ${
              value === o.v
                ? "border-purple-500 bg-purple-500/15 text-white"
                : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
            }`}
          >
            {o.icon ? <span className="text-zinc-500">{o.icon}</span> : null}
            {o.v}
          </button>
        ))}
      </div>
    </div>
  );
}

// 0-60 saniye arası slider. Aktif modelin max'ında kırmızı çizgi.
// Model max üstündeki değerler "Extended Modu" olarak işaretlenir (clamp YOK).
// Tick'ler: 0, 5, 10, 15, 30, 45, 60.
function DurationSlider({
  value, modelMax, absMax, onChange,
}: { value: number; modelMax: number; absMax: number; onChange: (v: number) => void }) {
  const safe = Math.max(0, Math.min(value, absMax));
  const limitPct = Math.round((modelMax / absMax) * 100);
  const valuePct = Math.round((safe / absMax) * 100);
  const isExtended = safe > modelMax;
  const extendedScenes = isExtended ? Math.ceil(safe / modelMax) : 1;
  const ticks = [0, 5, 10, 15, 30, 45, 60].filter((t) => t <= absMax);

  const handleChange = (raw: number) => {
    const clamped = Math.max(0, Math.min(absMax, Math.round(raw)));
    onChange(clamped);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          Süre (saniye)
          {isExtended ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white normal-case tracking-normal">
              ⚡ EXTENDED MODU
            </span>
          ) : null}
        </div>
        <div className="text-[11px] text-zinc-300 font-mono">
          <span className={isExtended ? "text-pink-400 font-bold" : "text-purple-300 font-semibold"}>{safe}</span>
          <span className="text-zinc-600"> sn</span>
          {isExtended ? (
            <span className="text-pink-300 ml-1.5">→ {extendedScenes} sahne × {modelMax} sn</span>
          ) : (
            <span className="text-zinc-700 ml-1">/ {modelMax} sn (model sınırı)</span>
          )}
        </div>
      </div>

      <div className="relative h-8 px-1">
        {/* Track arka plan */}
        <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          {/* Model'in destekledigi araliK (acik gri) */}
          <div
            className="absolute left-0 top-0 h-full bg-zinc-700"
            style={{ width: `${limitPct}%` }}
          />
          {/* Extended bolgesi (cizgili dot pattern) */}
          {isExtended ? (
            <div
              className="absolute top-0 h-full bg-pink-900/40"
              style={{ left: `${limitPct}%`, width: `${100 - limitPct}%` }}
            />
          ) : null}
          {/* Mevcut deger doldurmasi: model max'a kadar mor, sonrasi pembe-extended */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-pink-500"
            style={{ width: `${Math.min(valuePct, limitPct)}%` }}
          />
          {isExtended ? (
            <div
              className="absolute top-0 h-full bg-gradient-to-r from-pink-500 to-rose-500"
              style={{ left: `${limitPct}%`, width: `${valuePct - limitPct}%` }}
            />
          ) : null}
        </div>

        {/* Model max sinir cizgisi (sari/kirmizi) */}
        <div
          className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
          style={{ left: `calc(${limitPct}% + 4px)` }}
        >
          <div className="w-0.5 h-8 bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.6)]" />
        </div>

        {/* Native range input (gorulmez ama tiklanabilir/surgu) */}
        <input
          type="range"
          min={0}
          max={absMax}
          step={1}
          value={safe}
          onChange={(e) => handleChange(parseInt(e.target.value, 10))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Video süresi saniye"
        />

        {/* Surgu thumb (gorsel) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white border-2 border-purple-500 shadow-md pointer-events-none transition-[left]"
          style={{ left: `${valuePct}%` }}
        />
      </div>

      {/* Tick etiketleri */}
      <div className="relative h-3 mt-0.5 px-1">
        {ticks.map((t) => {
          const pct = (t / absMax) * 100;
          const beyondLimit = t > modelMax;
          return (
            <div
              key={t}
              className={`absolute top-0 -translate-x-1/2 text-[9px] ${beyondLimit ? "text-zinc-700" : "text-zinc-500"}`}
              style={{ left: `${pct}%` }}
            >
              {t}
            </div>
          );
        })}
      </div>

      {isExtended ? (
        <div className="mt-1 text-[10px] text-pink-300 px-1 leading-relaxed">
          ⚡ <strong>Extended Modu aktif:</strong> {safe} sn istek → AI senaryo {extendedScenes} sahneye bölecek (her biri ~{Math.floor(safe / extendedScenes)} sn).
          Üret butonuna basınca Senaryo Sihirbazı açılır, sahneleri görüp düzenleyebilirsiniz.
        </div>
      ) : modelMax < absMax ? (
        <div className="mt-1 text-[10px] text-zinc-500 px-1">
          🔴 Kırmızı çizgi: bu modelin tek seferde max ürettiği süre ({modelMax} sn). Daha uzun istersen slider'ı sağa çek → otomatik Extended Modu.
        </div>
      ) : null}
    </div>
  );
}

function UploaderRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 px-1 flex items-center gap-1.5">
        {label}
        {required ? <span className="text-rose-400">*</span> : null}
      </div>
      {children}
    </div>
  );
}
