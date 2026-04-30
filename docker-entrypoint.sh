#!/bin/sh
set -e

# DATABASE_URL set edilmisse Prisma schema'yi DB'ye push et
# Not: standalone build'de .bin/prisma symlink yok, dogrudan node ile cagir
if [ -n "$DATABASE_URL" ]; then
  echo "→ Prisma db push (schema sync) çalıştırılıyor..."
  node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss
  echo "✓ Schema senkronize edildi."
else
  echo "⚠ DATABASE_URL set edilmemiş — Prisma push atlandı."
fi

# Next.js standalone server'i baslat
exec "$@"
