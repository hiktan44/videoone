// Redis baglanti yardimcilari — BullMQ ve pub/sub icin.
// REDIS_URL parse edilir, BullMQ icin connection options doner.

import IORedis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: IORedis | undefined;
}

export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL;
}

/** REDIS_URL'i BullMQ connection options'a parse eder. Lazy. */
export function getRedisConnectionOpts() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL tanımlı değil");
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 6379,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    username: u.username ? decodeURIComponent(u.username) : undefined,
    db: u.pathname && u.pathname.length > 1 ? Number(u.pathname.slice(1)) : 0,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  } as const;
}

/** ioredis singleton — pub/sub publish icin. Lazy. */
export function getRedisClient(): IORedis {
  if (global.__redis) return global.__redis;
  const opts = getRedisConnectionOpts();
  const client = new IORedis(opts);
  if (process.env.NODE_ENV !== "production") {
    global.__redis = client;
  }
  return client;
}

/** Pub/sub subscriber icin yeni baglanti. */
export function makeRedisSubscriber(): IORedis {
  return new IORedis(getRedisConnectionOpts());
}
