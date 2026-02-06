#!/bin/sh
set -e

echo "Installing dependencies..."
bun install --frozen-lockfile

echo "Waiting for database..."
until bunx prisma db push --skip-generate >/dev/null 2>&1; do
  echo "Database unavailable. Retrying in 2 seconds..."
  sleep 2
done

echo "Syncing Prisma schema..."
bunx prisma db push

echo "Seeding products..."
bun run prisma:seed

echo "Starting Next.js dev server..."
exec bun run dev --hostname 0.0.0.0 --port 3000
