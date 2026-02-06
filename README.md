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
- `GET /api/v1/admin/products` (admin token required)
- `POST /api/v1/admin/products` (admin token required)
- `PATCH /api/v1/admin/products/:id` (admin token required)
- `DELETE /api/v1/admin/products/:id` (admin token required)
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
3. Start PostgreSQL and set `DATABASE_URL` in `.env` to the running DB host:
   - local DB host: `localhost`
   - Docker Compose DB service host: `db`
4. Run Prisma migration:
   - `bunx prisma migrate dev`
5. Seed starter products:
   - `bun run prisma:seed`
6. Start app:
   - `bun run dev`

## Docker dev (one command)
1. Ensure Docker is running.
2. Start app + database:
   - `bun run dev:docker`
   - or `docker compose up --build`
3. Open:
   - app: `http://localhost:3000`
   - admin: `http://localhost:3000/admin`
4. Stop services:
   - `bun run dev:docker:down`

Notes:
- The compose stack auto-runs Prisma schema sync and product seed on app startup.
- Compose sets `DATABASE_URL` to the internal Docker host `db` for the app container.

## Admin product workflow
- Set `ADMIN_API_TOKEN` in `.env`.
- Pass token with `x-admin-token: <token>` or `Authorization: Bearer <token>`.
- Use `GET /api/v1/admin/products` to list all products (supports `page`, `pageSize`, `q`, `category`, `isAvailable`).
- Use `PATCH /api/v1/admin/products/:id` to update product data:
  - fields: `name`, `description`, `priceCents`, `category`, `imageUrl`, `isAvailable`
- Use `POST /api/v1/admin/products` to create a new product (slug auto-generated from name).
- Use `DELETE /api/v1/admin/products/:id` to delete a product (blocked if product is used by existing orders).
- Use `/admin` for an in-app admin panel that lists and edits products using the same APIs.

## Stripe notes
- Checkout session is created on server with DB-validated prices.
- `orderNumber` is attached to Stripe metadata.
- Webhook verifies Stripe signature and updates order/payment state.

## Docker/Coolify
- `next.config.ts` is set to `output: "standalone"` for container-friendly builds.
