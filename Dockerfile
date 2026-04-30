# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# devDependencies (typescript, tailwind) build icin gerekli — NODE_ENV=production set edilse bile yukle
RUN npm ci --include=dev --legacy-peer-deps

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Coolify NODE_ENV=production buildtime'da gonderirse: yukari deps'te --include=dev ile devDeps zorlandi
# Build sirasinda NODE_ENV'i NEXT_PUBLIC olmayan production'a tut
ENV NODE_ENV=production
# Prisma client'i build sirasinda olustur (DATABASE_URL gerekmez, sadece schema)
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Postgres'e erismek icin sadece libssl gerekli (prisma alpine icin)
RUN apk add --no-cache openssl

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma schema + generated client + CLI runtime icin gerekli
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
# package.json'i kopyala (npx prisma icin)
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Konteyner basladiginda once schema'yi DB'ye push et, sonra Next.js'i basla
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
