"use client";

// Proje saklama katmani.
// Faz 1B: Login varsa API (Postgres), login yoksa localStorage fallback.

import { type Project, makeSampleProject, SAMPLE_PROJECTS_META, relativeLabel } from "./mocks";

const KEY = "vibe-studio:projects:v1";
const ACTIVE_KEY = "vibe-studio:active-project-id:v1";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// =====================================================
// API HELPERS
// =====================================================

async function tryFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      cache: "no-store",
    });
    if (res.status === 401) return null; // login yok -> fallback
    if (!res.ok) {
      console.warn("[persistence] API hatasi", url, res.status);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.warn("[persistence] network hatasi", url, e);
    return null;
  }
}

// API tarafindan donen "flat" proje veriyi UI Project tipine cevirir.
function fromApi(apiProj: any): Project {
  const settings = apiProj.settings && typeof apiProj.settings === "object" ? apiProj.settings : {};
  return {
    id: apiProj.id,
    name: apiProj.name,
    createdAt: new Date(apiProj.createdAt).getTime(),
    updatedAt: new Date(apiProj.updatedAt).getTime(),
    gradient: apiProj.gradient || "from-purple-500 via-pink-500 to-orange-400",
    clips: Array.isArray(apiProj.clips) ? apiProj.clips : [],
    characters: Array.isArray(apiProj.characters) ? apiProj.characters : [],
    chatMessages: Array.isArray(apiProj.chatMessages) ? apiProj.chatMessages : [],
    mediaItems: Array.isArray(apiProj.mediaItems) ? apiProj.mediaItems : [],
    settings: { ...(makeSampleProject().settings), ...settings },
  };
}

// =====================================================
// LOCAL STORAGE (FALLBACK)
// =====================================================

function lsLoadAll(): Project[] {
  const s = safeStorage();
  if (!s) return [];
  try {
    const raw = s.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function lsSaveAll(projects: Project[]): void {
  const s = safeStorage();
  if (!s) return;
  try {
    s.setItem(KEY, JSON.stringify(projects));
  } catch (e) {
    console.warn("[persistence] LS kaydetme hatasi", e);
  }
}

// =====================================================
// PUBLIC API (legacy senkron — localStorage fallback ile)
// =====================================================

export function loadAllProjects(): Project[] {
  return lsLoadAll();
}

export function saveAllProjects(projects: Project[]): void {
  lsSaveAll(projects);
}

export function upsertProject(project: Project): Project[] {
  const list = lsLoadAll();
  const idx = list.findIndex((p) => p.id === project.id);
  const updated = { ...project, updatedAt: Date.now() };
  if (idx === -1) list.unshift(updated);
  else list[idx] = updated;
  lsSaveAll(list);

  // Async ayna: login varsa API'ye de yaz (fire-and-forget)
  void apiUpsert(updated);
  return list;
}

export function deleteProject(id: string): Project[] {
  const list = lsLoadAll().filter((p) => p.id !== id);
  lsSaveAll(list);
  void tryFetch(`/api/projects/${id}`, { method: "DELETE" });
  return list;
}

export function getActiveProjectId(): string | null {
  const s = safeStorage();
  if (!s) return null;
  return s.getItem(ACTIVE_KEY);
}

export function setActiveProjectId(id: string | null): void {
  const s = safeStorage();
  if (!s) return;
  if (id) s.setItem(ACTIVE_KEY, id);
  else s.removeItem(ACTIVE_KEY);
}

export function exportProjectAsJson(project: Project): string {
  return JSON.stringify(project, null, 2);
}

export function importProjectFromJson(raw: string): Project {
  const parsed = JSON.parse(raw) as Project;
  const now = Date.now();
  return {
    ...parsed,
    id: `p${now}`,
    createdAt: now,
    updatedAt: now,
    name: parsed.name + " (içe aktarıldı)",
  };
}

export function seedIfEmpty(): Project[] {
  const list = lsLoadAll();
  if (list.length > 0) return list;
  const now = Date.now();
  const seeded: Project[] = SAMPLE_PROJECTS_META.map((m, i) => {
    const base = makeSampleProject(m.name);
    return {
      ...base,
      id: `seed-${i}-${now}`,
      gradient: m.gradient,
      createdAt: now - m.ageMs,
      updatedAt: now - m.ageMs,
    };
  });
  lsSaveAll(seeded);
  return seeded;
}

export function withDisplayLabels(list: Project[]): Project[] {
  return list.map((p) => ({ ...p, updatedLabel: relativeLabel(p.updatedAt) }));
}

// =====================================================
// ASYNC API HELPERS (Faz 1B+)
// =====================================================

/** Login varsa API'den, degilse localStorage'dan getirir. */
export async function fetchAllProjects(): Promise<{ projects: Project[]; source: "api" | "local" }> {
  const data = await tryFetch<{ projects: any[] }>("/api/projects");
  if (data?.projects) {
    return { projects: data.projects.map(fromApi), source: "api" };
  }
  return { projects: lsLoadAll(), source: "local" };
}

/** Login varsa API'den, degilse localStorage'dan getirir. */
export async function fetchProjectById(id: string): Promise<Project | null> {
  const data = await tryFetch<{ project: any }>(`/api/projects/${id}`);
  if (data?.project) return fromApi(data.project);
  // localStorage fallback
  return lsLoadAll().find((p) => p.id === id) ?? null;
}

/** API tarafina full proje yaz (PUT). Login yoksa sessizce drop eder. */
export async function apiUpsert(project: Project): Promise<void> {
  // Sadece API'de olan kayitlari guncelleyebiliriz; cuid formatli olmayan id'ler localStorage'a aittir.
  const looksLikeApiId = /^c[a-z0-9]{20,}$/i.test(project.id);
  if (looksLikeApiId) {
    await tryFetch(`/api/projects/${project.id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: project.name,
        gradient: project.gradient,
        settings: project.settings,
        clips: project.clips,
        characters: project.characters,
        chatMessages: project.chatMessages,
      }),
    });
  } else {
    // Yeni proje — POST ile olustur
    const data = await tryFetch<{ project: any }>("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: project.name,
        gradient: project.gradient,
        settings: project.settings,
      }),
    });
    if (data?.project) {
      // Sonrasinda full PUT ile clip/character/messages aktar
      await tryFetch(`/api/projects/${data.project.id}`, {
        method: "PUT",
        body: JSON.stringify({
          clips: project.clips,
          characters: project.characters,
          chatMessages: project.chatMessages,
        }),
      });
    }
  }
}

/** localStorage'daki projeleri DB'ye one-shot migration. Idempotent: id eslesirse atlar. */
export async function migrateLocalToApi(): Promise<{ migrated: number; skipped: number }> {
  const local = lsLoadAll();
  if (local.length === 0) return { migrated: 0, skipped: 0 };

  const remote = await tryFetch<{ projects: any[] }>("/api/projects");
  if (!remote) return { migrated: 0, skipped: local.length }; // login yok

  const remoteNames = new Set((remote.projects || []).map((p: any) => p.name));
  let migrated = 0;
  let skipped = 0;
  for (const p of local) {
    if (remoteNames.has(p.name)) {
      skipped++;
      continue;
    }
    await apiUpsert(p);
    migrated++;
  }
  return { migrated, skipped };
}
