"use client";

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

  usePolling({
    taskId,
    family,
    enabled: true,
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
