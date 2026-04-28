"use client";

// Tarayıcı yerel depolama tabanlı proje saklama.
// Faz 2B: Ajan B tarafından genişletilebilir. Burada ortak iskele.

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

export function loadAllProjects(): Project[] {
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

export function saveAllProjects(projects: Project[]): void {
  const s = safeStorage();
  if (!s) return;
  try {
    s.setItem(KEY, JSON.stringify(projects));
  } catch (e) {
    console.warn("[persistence] kaydetme hatası", e);
  }
}

export function upsertProject(project: Project): Project[] {
  const list = loadAllProjects();
  const idx = list.findIndex((p) => p.id === project.id);
  const updated = { ...project, updatedAt: Date.now() };
  if (idx === -1) list.unshift(updated);
  else list[idx] = updated;
  saveAllProjects(list);
  return list;
}

export function deleteProject(id: string): Project[] {
  const list = loadAllProjects().filter((p) => p.id !== id);
  saveAllProjects(list);
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
  // Yeni id ata ki çakışma olmasın.
  const now = Date.now();
  return {
    ...parsed,
    id: `p${now}`,
    createdAt: now,
    updatedAt: now,
    name: parsed.name + " (içe aktarıldı)",
  };
}

// İlk kullanımda örnek projeleri seed et.
export function seedIfEmpty(): Project[] {
  const list = loadAllProjects();
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
  saveAllProjects(seeded);
  return seeded;
}

export function withDisplayLabels(list: Project[]): Project[] {
  return list.map((p) => ({ ...p, updatedLabel: relativeLabel(p.updatedAt) }));
}
