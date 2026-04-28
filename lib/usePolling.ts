"use client";

import { useEffect, useRef } from "react";

export type PollStatus = "pending" | "running" | "succeeded" | "failed";

export type PollResult = {
  taskId: string;
  status: PollStatus;
  resultUrl?: string;
  error?: string;
  mock?: boolean;
};

type PollingOptions = {
  taskId: string | null | undefined;
  family?: string;
  enabled?: boolean;
  intervalMs?: number;
  maxAttempts?: number;
  onUpdate?: (result: PollResult) => void;
  onSuccess?: (result: PollResult) => void;
  onFailure?: (result: PollResult) => void;
  onTimeout?: () => void;
};

// Kie.ai task durumunu server-side /api/kie/poll üzerinden periyodik sorgular.
// - 3 saniyede bir (varsayılan), en fazla 60 deneme (3 dakika).
// - status "succeeded" | "failed" olunca durur, callback çağırır.
// - cleanup: interval her durumda temizlenir, unmount güvenlidir.
export function usePolling({
  taskId,
  family,
  enabled = true,
  intervalMs = 3000,
  maxAttempts = 60,
  onUpdate,
  onSuccess,
  onFailure,
  onTimeout,
}: PollingOptions): void {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptRef = useRef(0);
  const stoppedRef = useRef(false);
  const lastTaskIdRef = useRef<string | null>(null);

  // Son callback referanslarını tut: effect yeniden kurulmasın.
  const cbRef = useRef({ onUpdate, onSuccess, onFailure, onTimeout });
  cbRef.current = { onUpdate, onSuccess, onFailure, onTimeout };

  useEffect(() => {
    if (!enabled || !taskId) return;
    if (lastTaskIdRef.current === taskId && timerRef.current) return;

    lastTaskIdRef.current = taskId;
    attemptRef.current = 0;
    stoppedRef.current = false;

    const clear = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const tick = async () => {
      if (stoppedRef.current) return;
      attemptRef.current += 1;
      try {
        const familyQs = family ? `&family=${encodeURIComponent(family)}` : "";
        const res = await fetch(`/api/kie/poll?taskId=${encodeURIComponent(taskId)}${familyQs}`, {
          cache: "no-store",
        });
        const data: PollResult = await res.json().catch(() => ({
          taskId,
          status: "failed" as PollStatus,
          error: "Yanıt okunamadı.",
        }));

        cbRef.current.onUpdate?.(data);

        if (data.status === "succeeded") {
          stoppedRef.current = true;
          clear();
          cbRef.current.onSuccess?.(data);
          return;
        }
        if (data.status === "failed") {
          stoppedRef.current = true;
          clear();
          cbRef.current.onFailure?.(data);
          return;
        }
      } catch (e) {
        // Ağ hatası: tek seferliğine yut, attempt sayacı korunur.
        cbRef.current.onUpdate?.({
          taskId,
          status: "running",
          error: e instanceof Error ? `Ağ hatası: ${e.message}` : "Ağ hatası",
        });
      }

      if (attemptRef.current >= maxAttempts) {
        stoppedRef.current = true;
        clear();
        cbRef.current.onTimeout?.();
        cbRef.current.onFailure?.({
          taskId,
          status: "failed",
          error: "Zaman aşımı: işlem 3 dakikada tamamlanamadı.",
        });
      }
    };

    // İlk tick'i hemen at, sonra interval.
    tick();
    timerRef.current = setInterval(tick, intervalMs);

    return () => {
      stoppedRef.current = true;
      clear();
    };
  }, [taskId, enabled, intervalMs, maxAttempts]);
}
