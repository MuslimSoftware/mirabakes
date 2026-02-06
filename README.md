# Mira Bakes

Minimal N-tier bakery ordering app built with Next.js, Stripe Checkout, and Postgres.

## Stack
- Next.js App Router (frontend + API routes)
- TanStack Query (frontend data hooks)
- Prisma + PostgreSQL (repositories/data)
- Stripe Checkout + webhook processing

## Tiering
- Frontend presentation: `src/app`, `src/frontend/features`
- Frontend API abstraction: `src/frontend/api`, `src/frontend/hooks`
- Backend application: `src/server/modules/*/*.controller.ts`, `*.service.ts`
- Backend data: `src/server/modules/*/*.repository.ts`
- Integrations: `src/server/integrations/stripe`

## API Endpoints
- `GET /api/v1/products`
- `GET /api/v1/products/:slug`
- `POST /api/v1/checkout/session`
- `POST /api/v1/webhooks/stripe`
- `GET /api/v1/orders/:orderNumber`
- `GET /api/health`

## Frontend Hook Layer
- `useApi`
- `useApiCached`
- `useApiPaginated`
- `useApiPaginatedCached`

## Local setup
1. Install deps:
   - `bun install`
2. Configure env:
   - `cp .env.example .env`
3. Run Prisma migration:
   - `bunx prisma migrate dev`
4. Start app:
   - `bun run dev`

## Stripe notes
- Checkout session is created on server with DB-validated prices.
- `orderNumber` is attached to Stripe metadata.
- Webhook verifies Stripe signature and updates order/payment state.

## Docker/Coolify
- `next.config.ts` is set to `output: "standalone"` for container-friendly builds.
