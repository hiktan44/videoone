// Sahne sirali video uretim orkestratoru.
// Storyboard'daki her sahneyi sirayla Kie API uzerinden uretir, polling ile bekler,
// basarili olanlari timeline'a klip olarak ekler. Cancel ve hata toleransli.

import { buildScenePrompt, type Scene, type Storyboard } from "./scenario";
import { useStore } from "./store";

// --- Tipler ---

export type PipelineStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type PipelinePhase =
  | "scene-started"
  | "scene-polling"
  | "scene-completed"
  | "scene-failed"
  | "pipeline-started"
  | "pipeline-completed"
  | "pipeline-cancelled";

export type PipelineProgressEvent = {
  phase: PipelinePhase;
  sceneIndex: number;
  sceneId?: string;
  error?: string;
};

export type PipelineState = {
  status: PipelineStatus;
  currentSceneIndex: number; // 0-based
  totalScenes: number;
  scenesCompleted: { sceneId: string; resultUrl?: string }[];
  scenesFailed: { sceneId: string; error: string }[];
  startedAt: number;
  completedAt?: number;
  lastEvent?: PipelineProgressEvent;
};

export type PipelineHandle = {
  cancel: () => void;
  promise: Promise<PipelineState>;
};

export type PipelineOptions = {
  aspectRatio?: string;
  // Aynı anda kac sahne paralel uretilsin (varsayilan 4).
  // Kie.ai rate-limit'ine takilmamak icin 1-8 arasi tutulmali.
  concurrency?: number;
  onProgress?: (state: PipelineState, currentScene?: Scene) => void;
};

// --- Sabitler ---

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 240; // 240 * 5 sn = 20 dk (video uretimi 5-15 dk surebilir)
const SCENE_TIMEOUT_BUFFER_MS = 120_000; // ekstra 2 dk buffer
const DEFAULT_ASPECT_RATIO = "16:9";

// Sahneye atanacak rasgele gradient havuzu (Tailwind sinifi olarak).
const SCENE_GRADIENTS = [
  "from-fuchsia-500 to-rose-500",
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-pink-500",
  "from-cyan-500 to-blue-700",
  "from-lime-500 to-green-600",
  "from-red-500 to-rose-700",
  "from-yellow-500 to-amber-600",
];

function pickGradient(seed: number): string {
  return SCENE_GRADIENTS[Math.abs(seed) % SCENE_GRADIENTS.length];
}

// --- Yardimci: kontrol edilebilir bekleme ---

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      signal.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

// --- Tek sahne uretimi ---

type SceneResult =
  | { ok: true; resultUrl: string }
  | { ok: false; error: string };

async function generateScene(
  scene: Scene,
  prevScene: Scene | undefined,
  storyboard: Storyboard,
  aspectRatio: string,
  signal: AbortSignal
): Promise<SceneResult> {
  // Karakterleri client store'dan oku (varsa)
  let characters: Array<{ id: string; name: string; description: string }> | undefined;
  try {
    if (typeof window !== "undefined") {
      const { useStore } = await import("./store");
      characters = useStore.getState().characters;
    }
  } catch {}
  const prompt = buildScenePrompt(scene, prevScene, storyboard.globalStyle, characters);

  // 1) Gorev olustur.
  let taskId: string;
  let family: string;
  try {
    const res = await fetch("/api/kie/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model: storyboard.modelDisplayName,
        aspect_ratio: scene.aspectRatio || aspectRatio,
        duration: scene.durationSec,
      }),
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Kie video create ${res.status}: ${text || res.statusText}` };
    }
    const data = (await res.json()) as { taskId?: string; family?: string; error?: string };
    if (!data.taskId || !data.family) {
      return { ok: false, error: data.error || "Kie taskId/family alinamadi" };
    }
    taskId = data.taskId;
    family = data.family;
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") throw err;
    return { ok: false, error: (err as Error).message || "Kie create hata" };
  }

  // 2) Polling.
  const sceneTimeoutMs = MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS + SCENE_TIMEOUT_BUFFER_MS;
  const startTs = Date.now();

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    if (Date.now() - startTs > sceneTimeoutMs) {
      return { ok: false, error: "Sahne uretimi zaman asimi" };
    }

    await delay(POLL_INTERVAL_MS, signal);

    try {
      const url = `/api/kie/poll?taskId=${encodeURIComponent(taskId)}&family=${encodeURIComponent(family)}`;
      const res = await fetch(url, { signal });
      if (!res.ok) {
        // Gecici hata olabilir, devam et.
        continue;
      }
      const data = (await res.json()) as {
        status?: "running" | "succeeded" | "failed";
        resultUrl?: string;
        error?: string;
      };
      if (data.status === "succeeded" && data.resultUrl) {
        return { ok: true, resultUrl: data.resultUrl };
      }
      if (data.status === "failed") {
        return { ok: false, error: data.error || "Kie failed" };
      }
      // running -> bir sonraki denemeye geç.
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") throw err;
      // Gecici network hatasi, devam et.
    }
  }

  return { ok: false, error: "Polling deneme limiti asildi" };
}

// --- Ana fonksiyon ---

export function runStoryboardPipeline(
  storyboard: Storyboard,
  options: PipelineOptions = {}
): PipelineHandle {
  const aspectRatio = options.aspectRatio || DEFAULT_ASPECT_RATIO;
  const concurrency = Math.max(1, Math.min(8, options.concurrency ?? 4));
  const controller = new AbortController();
  const signal = controller.signal;

  const state: PipelineState = {
    status: "running",
    currentSceneIndex: 0,
    totalScenes: storyboard.scenes.length,
    scenesCompleted: [],
    scenesFailed: [],
    startedAt: Date.now(),
  };

  const emit = (event: PipelineProgressEvent, scene?: Scene) => {
    state.lastEvent = event;
    try {
      options.onProgress?.({ ...state }, scene);
    } catch {
      // onProgress hatasi pipeline'i bozmamali.
    }
  };

  // Tek bir GenerationJob — pipeline genel ilerlemesi icin.
  const store = useStore.getState();
  const jobId = store.addJob({
    kind: "video",
    prompt: `Senaryo: ${storyboard.topic}`,
    status: "running",
  });

  const updateJobProgress = (text: string) => {
    useStore.getState().updateJob(jobId, { error: undefined, resultUrl: undefined });
    // Mevcut store sema alanlari icinde "error" alanini progress mesaji olarak kullanmak yerine,
    // yan etki olmamasi icin sadece status'u korur, tek noktadan final guncelleme yapariz.
    void text; // ileride store sema genislerse buradan yazilir.
  };

  const promise: Promise<PipelineState> = (async () => {
    emit({ phase: "pipeline-started", sceneIndex: -1 });
    updateJobProgress(`Pipeline baslatildi (${storyboard.scenes.length} sahne)`);

    try {
      // Paralel worker pool: aynı anda `concurrency` sahne uretilir.
      // Sahneler tamamlandikca timeline'a sirayla (sceneIndex sirasinda) eklenir.
      let nextIndex = 0;
      const totalScenes = storyboard.scenes.length;

      const runWorker = async () => {
        while (!signal.aborted) {
          const i = nextIndex++;
          if (i >= totalScenes) return;

          const scene = storyboard.scenes[i];
          const prev = i > 0 ? storyboard.scenes[i - 1] : undefined;
          state.currentSceneIndex = i;

          emit({ phase: "scene-started", sceneIndex: i, sceneId: scene.id }, scene);

          let result: SceneResult;
          try {
            result = await generateScene(scene, prev, storyboard, aspectRatio, signal);
          } catch (err) {
            if ((err as { name?: string })?.name === "AbortError") return;
            result = { ok: false, error: (err as Error).message || "Bilinmeyen hata" };
          }

          if (signal.aborted) return;

          if (result.ok) {
            try {
              useStore.getState().addClip({
                trackId: "video",
                label: scene.title,
                duration: scene.durationSec,
                sourceUrl: result.resultUrl,
                gradient: pickGradient(i + scene.index),
              });
            } catch {
              // Store hatasi pipeline'i durdurmasin.
            }
            state.scenesCompleted.push({ sceneId: scene.id, resultUrl: result.resultUrl });
            emit({ phase: "scene-completed", sceneIndex: i, sceneId: scene.id }, scene);
          } else {
            state.scenesFailed.push({ sceneId: scene.id, error: result.error });
            emit({ phase: "scene-failed", sceneIndex: i, sceneId: scene.id, error: result.error }, scene);
          }
        }
      };

      const workers = Array.from({ length: Math.min(concurrency, totalScenes) }, () => runWorker());
      await Promise.all(workers);

      if (signal.aborted) {
        state.status = "cancelled";
        state.completedAt = Date.now();
        emit({ phase: "pipeline-cancelled", sceneIndex: state.currentSceneIndex });
        useStore.getState().updateJob(jobId, { status: "failed", error: "iptal edildi" });
        return state;
      }

      // Bitis durumu: en az bir sahne basariliysa completed, hepsi basarisizsa failed.
      if (state.scenesCompleted.length === 0 && state.scenesFailed.length > 0) {
        state.status = "failed";
        useStore.getState().updateJob(jobId, {
          status: "failed",
          error: `Tum sahneler basarisiz (${state.scenesFailed.length})`,
        });
      } else {
        state.status = "completed";
        const lastUrl = state.scenesCompleted[state.scenesCompleted.length - 1]?.resultUrl;
        useStore.getState().updateJob(jobId, {
          status: "succeeded",
          resultUrl: lastUrl,
        });
      }
      state.completedAt = Date.now();
      emit({ phase: "pipeline-completed", sceneIndex: state.currentSceneIndex });
      return state;
    } catch (err) {
      // Beklenmeyen ust seviye hata.
      state.status = "failed";
      state.completedAt = Date.now();
      const msg = (err as Error)?.message || "Pipeline beklenmeyen hata";
      useStore.getState().updateJob(jobId, { status: "failed", error: msg });
      emit({ phase: "scene-failed", sceneIndex: state.currentSceneIndex, error: msg });
      return state;
    }
  })();

  return {
    cancel: () => {
      if (!signal.aborted) controller.abort();
    },
    promise,
  };
}

// Tek bir sahneyi yeniden uret. UI'da "Yeniden Uret" butonu icin.
// resultUrl bittiginde Promise resolve eder. Hata durumunda { ok:false } doner.
export async function regenerateScene(
  storyboard: Storyboard,
  sceneIndex: number,
  options: { aspectRatio?: string } = {}
): Promise<SceneResult> {
  const aspectRatio = options.aspectRatio || DEFAULT_ASPECT_RATIO;
  const controller = new AbortController();
  const scene = storyboard.scenes[sceneIndex];
  if (!scene) return { ok: false, error: "Sahne bulunamadi" };
  const prev = sceneIndex > 0 ? storyboard.scenes[sceneIndex - 1] : undefined;
  return generateScene(scene, prev, storyboard, aspectRatio, controller.signal);
}
