// Prisma client singleton — LAZY init, module-load'da bagiantı denemesin.

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

let _client: PrismaClient | null = null;

function makeClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// Lazy proxy — sadece bir property'e erisilince gercek client yaratilir.
// Bu sayede DATABASE_URL eksikse veya Postgres dustaginde module-load patlamaz.
export const prisma = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    if (!_client) {
      if (global.__prisma) {
        _client = global.__prisma;
      } else {
        _client = makeClient();
        if (process.env.NODE_ENV !== "production") {
          global.__prisma = _client;
        }
      }
    }
    return (_client as any)[prop];
  },
});
