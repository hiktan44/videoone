// BullMQ queue — generation kuyrugu + pub/sub.

import { Queue, QueueEvents } from "bullmq";
import { getRedisClient, getRedisConnectionOpts, makeRedisSubscriber } from "./redis";

export type GenerationJobKind = "video" | "image" | "voice" | "music" | "captions";

export type GenerationJobPayload = {
  jobId: string;
  userId: string;
  projectId?: string;
  kind: GenerationJobKind;
  prompt: string;
  model?: string;
  aspectRatio?: string;
  duration?: number;
  imageUrls?: string[];
  audioUrls?: string[];
  videoUrls?: string[];
  audioUrl?: string;
};

export type ProgressUpdate = {
  status: "queued" | "running" | "succeeded" | "failed";
  progress?: number;
  resultUrl?: string;
  error?: string;
  taskId?: string;
};

export const QUEUE_NAME = "generations";

let _queue: Queue<GenerationJobPayload> | null = null;
export function generationQueue(): Queue<GenerationJobPayload> {
  if (!_queue) {
    _queue = new Queue<GenerationJobPayload>(QUEUE_NAME, {
      connection: getRedisConnectionOpts(),
    });
  }
  return _queue;
}

let _events: QueueEvents | null = null;
export function generationEvents(): QueueEvents {
  if (!_events) {
    _events = new QueueEvents(QUEUE_NAME, { connection: getRedisConnectionOpts() });
  }
  return _events;
}

export async function enqueue(payload: GenerationJobPayload) {
  return generationQueue().add(payload.kind, payload, {
    jobId: payload.jobId,
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 24 * 3600 },
    attempts: 1,
  });
}

export async function publishProgress(jobId: string, update: ProgressUpdate) {
  const channel = `job:${jobId}:progress`;
  await getRedisClient().publish(channel, JSON.stringify(update));
}

export function subscribeToJob(
  jobId: string,
  onMessage: (update: ProgressUpdate) => void
): () => void {
  const subscriber = makeRedisSubscriber();
  const channel = `job:${jobId}:progress`;
  subscriber.subscribe(channel);
  subscriber.on("message", (_ch, msg) => {
    try {
      onMessage(JSON.parse(msg) as ProgressUpdate);
    } catch {}
  });
  return () => {
    subscriber.unsubscribe(channel).catch(() => {});
    subscriber.quit().catch(() => {});
  };
}
