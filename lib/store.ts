"use client";

import { create } from "zustand";
import {
  MOCK_CHARACTERS,
  MOCK_CHAT,
  MOCK_CLIPS,
  MOCK_MEDIA,
  defaultSettings,
  makeSampleProject,
  type Character,
  type ChatMessage,
  type MediaItem,
  type Project,
  type Settings,
  type TimelineClip,
  type TrackId,
} from "./mocks";

type GenerationStatus = "idle" | "running" | "succeeded" | "failed";

export type GenerationJob = {
  id: string;
  kind: "image" | "video" | "voice";
  prompt: string;
  status: GenerationStatus;
  resultUrl?: string;
  error?: string;
  createdAt: number;
  taskId?: string;
  family?: string; // Kie endpoint ailesi: "veo" | "gpt4o" | "jobs" | "voice"
};

type StoreState = {
  // --- Aktif proje verisi ---
  projectId: string | null;
  currentProjectName: string;
  chatMessages: ChatMessage[];
  mediaItems: MediaItem[];
  characters: Character[];
  clips: TimelineClip[];
  settings: Settings;

  // --- Timeline yürütme ---
  playhead: number; // saniye
  isPlaying: boolean;
  pixelsPerSecond: number;
  selectedClipId: string | null;

  // --- Üretim işleri ---
  jobs: GenerationJob[];

  // --- Genel ---
  credits: number;
  activeTab: string;
  projects: Project[];

  // --- Eylemler ---
  setActiveTab: (tab: string) => void;
  setCurrentProjectName: (name: string) => void;
  addChatMessage: (msg: Omit<ChatMessage, "id">) => void;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;

  // Timeline eylemleri
  reorderClipsOnTrack: (trackId: TrackId, orderedIds: string[]) => void;
  resizeClip: (id: string, newDuration: number) => void;
  splitClip: (id: string, atTime: number) => void;
  removeClip: (id: string) => void;
  addClip: (clip: Partial<TimelineClip> & Pick<TimelineClip, "trackId" | "label">) => void;
  updateClip: (id: string, patch: Partial<TimelineClip>) => void;
  setSelectedClip: (id: string | null) => void;
  setPlayhead: (t: number) => void;
  togglePlay: () => void;
  setZoom: (pps: number) => void;

  // Proje eylemleri
  loadProject: (project: Project) => void;
  exportCurrentAsProject: () => Project;
  setProjects: (projects: Project[]) => void;

  // Üretim işleri
  addJob: (job: Omit<GenerationJob, "id" | "createdAt">) => string;
  updateJob: (id: string, patch: Partial<GenerationJob>) => void;

  // Karakter eylemleri
  addCharacter: (character: Omit<Character, "id">) => string;
  updateCharacter: (id: string, patch: Partial<Character>) => void;
  removeCharacter: (id: string) => void;
};

function reflowTrack(clips: TimelineClip[], trackId: TrackId): TimelineClip[] {
  // İlgili track'teki klipleri startTime'a göre toparla, çakışmaları gider.
  const onTrack = clips.filter((c) => c.trackId === trackId).sort((a, b) => a.startTime - b.startTime);
  const others = clips.filter((c) => c.trackId !== trackId);
  let cursor = 0;
  const fixed = onTrack.map((c) => {
    if (c.startTime < cursor) c = { ...c, startTime: cursor };
    cursor = c.startTime + c.duration;
    return c;
  });
  return [...others, ...fixed];
}

export const useStore = create<StoreState>((set, get) => ({
  projectId: null,
  currentProjectName: "Yeni Vibe Projesi",
  chatMessages: MOCK_CHAT,
  mediaItems: MOCK_MEDIA,
  characters: MOCK_CHARACTERS,
  clips: MOCK_CLIPS,
  settings: defaultSettings(),

  playhead: 0,
  isPlaying: false,
  pixelsPerSecond: 60,
  selectedClipId: null,

  jobs: [],
  credits: 86,
  activeTab: "chat",
  projects: [],

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrentProjectName: (name) => set({ currentProjectName: name }),
  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, { ...msg, id: `m${Date.now()}` }],
    })),
  updateSetting: (key, value) =>
    set((state) => ({ settings: { ...state.settings, [key]: value } })),

  reorderClipsOnTrack: (trackId, orderedIds) =>
    set((state) => {
      const onTrack = state.clips.filter((c) => c.trackId === trackId);
      const others = state.clips.filter((c) => c.trackId !== trackId);
      const map = new Map(onTrack.map((c) => [c.id, c]));
      let cursor = 0;
      const reordered: TimelineClip[] = [];
      for (const id of orderedIds) {
        const c = map.get(id);
        if (!c) continue;
        reordered.push({ ...c, startTime: cursor });
        cursor += c.duration;
      }
      return { clips: [...others, ...reordered] };
    }),

  resizeClip: (id, newDuration) =>
    set((state) => {
      const clipped = state.clips.map((c) =>
        c.id === id ? { ...c, duration: Math.max(0.5, Number(newDuration.toFixed(2))) } : c
      );
      const target = clipped.find((c) => c.id === id);
      if (!target) return { clips: clipped };
      return { clips: reflowTrack(clipped, target.trackId) };
    }),

  splitClip: (id, atTime) =>
    set((state) => {
      const target = state.clips.find((c) => c.id === id);
      if (!target) return {};
      const localT = atTime - target.startTime;
      if (localT <= 0.2 || localT >= target.duration - 0.2) return {};
      const left: TimelineClip = { ...target, duration: Number(localT.toFixed(2)) };
      const right: TimelineClip = {
        ...target,
        id: `${target.id}-b${Date.now()}`,
        startTime: target.startTime + left.duration,
        duration: Number((target.duration - left.duration).toFixed(2)),
      };
      const others = state.clips.filter((c) => c.id !== id);
      return { clips: [...others, left, right] };
    }),

  removeClip: (id) =>
    set((state) => {
      const target = state.clips.find((c) => c.id === id);
      if (!target) return {};
      const remaining = state.clips.filter((c) => c.id !== id);
      return { clips: reflowTrack(remaining, target.trackId), selectedClipId: null };
    }),

  addClip: (clip) =>
    set((state) => {
      const trackClips = state.clips.filter((c) => c.trackId === clip.trackId);
      const lastEnd = trackClips.reduce((m, c) => Math.max(m, c.startTime + c.duration), 0);
      const newClip: TimelineClip = {
        id: clip.id || `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        startTime: clip.startTime ?? lastEnd,
        duration: clip.duration ?? 3,
        label: clip.label,
        trackId: clip.trackId,
        gradient: clip.gradient ?? "from-zinc-500 to-zinc-700",
        sourceUrl: clip.sourceUrl,
        thumbnailUrl: clip.thumbnailUrl,
        text: clip.text,
      };
      return { clips: [...state.clips, newClip] };
    }),

  updateClip: (id, patch) =>
    set((state) => ({
      clips: state.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  setSelectedClip: (id) => set({ selectedClipId: id }),
  setPlayhead: (t) => set({ playhead: Math.max(0, t) }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setZoom: (pps) => set({ pixelsPerSecond: Math.max(20, Math.min(200, pps)) }),

  loadProject: (project) =>
    set((state) => {
      // Eğer aynı projeyi tekrar yüklüyorsak ve mevcut store'da daha çok klip varsa
      // (pipeline arka planda eklemiş), DB'den gelen boş listeyle EZME.
      const sameProject = state.projectId === project.id;
      const dbHasFewer = (project.clips?.length ?? 0) < state.clips.length;
      const keepClips = sameProject && dbHasFewer;
      return {
        projectId: project.id,
        currentProjectName: project.name,
        chatMessages: project.chatMessages,
        mediaItems: project.mediaItems,
        characters: keepClips ? state.characters : project.characters,
        clips: keepClips ? state.clips : project.clips,
        settings: project.settings,
        playhead: 0,
        isPlaying: false,
        selectedClipId: null,
      };
    }),

  exportCurrentAsProject: () => {
    const s = get();
    const id = s.projectId ?? `p${Date.now()}`;
    const base = makeSampleProject(s.currentProjectName);
    return {
      ...base,
      id,
      name: s.currentProjectName,
      clips: s.clips,
      characters: s.characters,
      chatMessages: s.chatMessages,
      mediaItems: s.mediaItems,
      settings: s.settings,
      updatedAt: Date.now(),
    };
  },

  setProjects: (projects) => set({ projects }),

  addJob: (job) => {
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({
      jobs: [...s.jobs, { ...job, id, createdAt: Date.now() }],
    }));
    return id;
  },
  updateJob: (id, patch) =>
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    })),

  addCharacter: (c) => {
    const id = `char-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ characters: [...s.characters, { ...c, id }] }));
    return id;
  },
  updateCharacter: (id, patch) =>
    set((s) => ({
      characters: s.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  removeCharacter: (id) =>
    set((s) => ({
      characters: s.characters.filter((c) => c.id !== id),
      // Bu karaktere atanmis kliplerin atamasini temizle
      clips: s.clips.map((cl) =>
        cl.characterId === id ? { ...cl, characterId: undefined } : cl
      ),
    })),
}));

// Yardımcı: belirli track'teki klipleri başlangıç saatine göre sıralı al.
export function getClipsByTrack(clips: TimelineClip[], trackId: TrackId): TimelineClip[] {
  return clips.filter((c) => c.trackId === trackId).sort((a, b) => a.startTime - b.startTime);
}

export function getTimelineDuration(clips: TimelineClip[]): number {
  return clips.reduce((m, c) => Math.max(m, c.startTime + c.duration), 0);
}

export function findClipAtTime(clips: TimelineClip[], trackId: TrackId, t: number): TimelineClip | null {
  return clips.find((c) => c.trackId === trackId && t >= c.startTime && t < c.startTime + c.duration) || null;
}
