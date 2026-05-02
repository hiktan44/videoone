"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { usePolling } from "@/lib/usePolling";
import type { TimelineClip } from "@/lib/mocks";

type Props = {
  jobId: string;
  taskId: string;
  prompt: string;
  family?: string;
};

// Tek bir üretim işi için polling döngüsünü yönetir.
// Başarılı olduğunda: job'u succeeded'a çeker ve timeline'a video klibi ekler.
// Başarısız olduğunda: job'u failed'a çeker, hata mesajını saklar.
export function JobPollingSubscriber({ jobId, taskId, prompt, family }: Props) {
  const updateJob = useStore((s) => s.updateJob);
  const addClip = useStore((s) => s.addClip);

  const isQueueJob = family === "queue";

  // Queue job ise SSE; degilse polling.
  useEffect(() => {
    if (!isQueueJob) return;
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/jobs/${taskId}/stream`);
      es.addEventListener("progress", (ev) => {
        try {
          const d = JSON.parse((ev as MessageEvent).data) as {
            status?: string; progress?: number; resultUrl?: string; error?: string;
          };
          if (d.status === "succeeded" && d.resultUrl) {
            updateJob(jobId, { status: "succeeded", resultUrl: d.resultUrl, error: undefined });
            const partial: Partial<TimelineClip> = {
              trackId: "video",
              label: prompt.slice(0, 20) || "Yeni klip",
              duration: 5,
              sourceUrl: d.resultUrl,
              gradient: "from-purple-500 to-pink-500",
            };
            addClip(partial as Omit<TimelineClip, "id">);
          } else if (d.status === "failed") {
            updateJob(jobId, { status: "failed", error: d.error || "Üretim başarısız oldu." });
          } else {
            updateJob(jobId, { status: "running" });
          }
        } catch {}
      });
      es.addEventListener("done", () => es?.close());
      es.onerror = () => es?.close();
    } catch {}
    return () => { es?.close(); };
  }, [isQueueJob, taskId, jobId, prompt, updateJob, addClip]);

  usePolling({
    taskId,
    family,
    enabled: !isQueueJob,
    intervalMs: 5000,
    maxAttempts: 240,
    onSuccess: (res) => {
      updateJob(jobId, {
        status: "succeeded",
        resultUrl: res.resultUrl,
        error: undefined,
      });
      if (res.resultUrl) {
        // startTime'ı bilinçli olarak dışarıda bırakıyoruz; store otomatik
        // olarak track'in sonuna ekler (clip.startTime ?? lastEnd).
        const partial: Partial<TimelineClip> = {
          trackId: "video",
          label: prompt.slice(0, 20) || "Yeni klip",
          duration: 5,
          sourceUrl: res.resultUrl,
          gradient: "from-purple-500 to-pink-500",
        };
        addClip(partial as Omit<TimelineClip, "id">);
      }
    },
    onFailure: (res) => {
      updateJob(jobId, {
        status: "failed",
        error: res.error ?? "Üretim başarısız oldu.",
      });
    },
  });

  return null;
}
