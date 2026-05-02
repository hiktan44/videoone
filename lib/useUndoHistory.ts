"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStore } from "./store";

// Editor için undo/redo. Snapshot tabanlı:
// - clips, characters, settings, mediaItems değiştiğinde snapshot'ı stack'e atar
// - Cmd/Ctrl+Z geri al; Cmd/Ctrl+Shift+Z (veya Y) ileri al
// - Son 50 adım hafızada, son 10 adım localStorage'a (proje bazlı)
// - autoSnapshot 800ms debounced — küçük değişiklikleri tek adım saymak için.

const MAX_STACK = 50;
const PERSIST_LAST = 10;
const DEBOUNCE_MS = 800;

type Snapshot = {
  ts: number;
  clips: any[];
  characters: any[];
  settings: any;
  mediaItems: any[];
};

function takeSnapshot(): Snapshot {
  const s = useStore.getState();
  return {
    ts: Date.now(),
    clips: structuredClone(s.clips),
    characters: structuredClone(s.characters),
    settings: structuredClone(s.settings),
    mediaItems: structuredClone(s.mediaItems),
  };
}

function snapshotsEqual(a: Snapshot, b: Snapshot): boolean {
  return (
    JSON.stringify(a.clips) === JSON.stringify(b.clips) &&
    JSON.stringify(a.characters) === JSON.stringify(b.characters) &&
    JSON.stringify(a.settings) === JSON.stringify(b.settings)
  );
}

function applySnapshot(snap: Snapshot) {
  useStore.setState({
    clips: snap.clips,
    characters: snap.characters,
    settings: snap.settings,
    mediaItems: snap.mediaItems,
  });
}

export function useUndoHistory(projectId: string | undefined) {
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const isRestoring = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistKey = projectId ? `vibe-undo-${projectId}` : null;

  // İlk yüklemede: localStorage'tan stack'i yükle ve şu anki state'i ilk anchor olarak ekle
  useEffect(() => {
    if (!persistKey) return;
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Snapshot[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          undoStack.current = parsed;
        }
      }
    } catch {}
    if (undoStack.current.length === 0) {
      undoStack.current.push(takeSnapshot());
    }
  }, [persistKey]);

  // Persist stack
  const persist = useCallback(() => {
    if (!persistKey) return;
    try {
      const tail = undoStack.current.slice(-PERSIST_LAST);
      localStorage.setItem(persistKey, JSON.stringify(tail));
    } catch {}
  }, [persistKey]);

  // State değişikliklerini izleyip snapshot al (debounced)
  useEffect(() => {
    const unsubscribe = useStore.subscribe((state, prev) => {
      if (isRestoring.current) return;
      // Sadece undo-relevant slice'lar değiştiyse
      if (
        state.clips === prev.clips &&
        state.characters === prev.characters &&
        state.settings === prev.settings &&
        state.mediaItems === prev.mediaItems
      ) return;

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        const snap = takeSnapshot();
        const top = undoStack.current[undoStack.current.length - 1];
        if (top && snapshotsEqual(top, snap)) return;
        undoStack.current.push(snap);
        if (undoStack.current.length > MAX_STACK) undoStack.current.shift();
        redoStack.current = []; // yeni eylem -> redo iptal
        persist();
      }, DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [persist]);

  const undo = useCallback(() => {
    if (undoStack.current.length < 2) return;
    const current = undoStack.current.pop()!;
    redoStack.current.push(current);
    const previous = undoStack.current[undoStack.current.length - 1];
    isRestoring.current = true;
    applySnapshot(previous);
    setTimeout(() => { isRestoring.current = false; }, 50);
    persist();
  }, [persist]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(next);
    isRestoring.current = true;
    applySnapshot(next);
    setTimeout(() => { isRestoring.current = false; }, 50);
    persist();
  }, [persist]);

  // Klavye kısayolları
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      // Form elemanlarında undo native — engelleme
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((key === "z" && e.shiftKey) || key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  return { undo, redo, undoStack, redoStack };
}
