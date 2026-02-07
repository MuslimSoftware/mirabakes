# Mirabakes

## Current Implementation Status
- Stage: MVP foundation scaffolded and running.
- Architecture: N-tier structure is in place for both frontend and backend.
- Build health: `bun run typecheck` and `bun run build` pass.
- Local containerized dev workflow is available with Docker Compose.

## Implemented Stack
- Next.js App Router (UI + API routes)
- TypeScript
- TanStack Query (frontend data hooks)
- Prisma ORM + PostgreSQL schema
- Stripe Checkout + Stripe webhook verification
- Container-friendly Next.js output (`output: "standalone"`)
- Docker Compose dev stack (`app + postgres`) with one-command startup

## Frontend (Current)
- Landing/store page with product listing, skeleton loading, and responsive layout (320px–1280px).
- Cart detail section listing selected items, quantities, line totals, subtotal, and empty state.
- Checkout button that creates a Stripe Checkout session and redirects.
- Order status page by `orderNumber`.
- Admin products page at `/admin` with token input, filtering, pagination, read-only cards with edit/delete icons.
- Admin products page at `/admin` supports create (toggled via button), update, and delete with confirmation.
- Product cards use flex-column layout for consistent price/action row alignment across grid.
- API abstraction layer:
  - HTTP client: `src/frontend/api/http/client.ts`
  - API clients: products, checkout, orders, admin-products
  - Hooks: `useApi`, `useApiCached`, `useApiPaginated`, `useApiPaginatedCached`

## Backend (Current)
- N-tier module layout per domain:
  - `controller -> service -> repository`
- Implemented modules:
  - Admin Products
  - Products
  - Checkout
  - Orders
  - Payments
  - Stripe Webhooks
  - Health
- Shared server utilities:
  - Prisma client singleton
  - App error + HTTP error handling
- Data bootstrap:
  - Prisma seed script at `prisma/seed.ts` (starter catalog via upsert)

## API Endpoints (Implemented)
- `GET /api/v1/products`
- `GET /api/v1/products/:slug`
- `POST /api/v1/checkout/session`
- `POST /api/v1/webhooks/stripe`
- `GET /api/v1/orders/:orderNumber`
- `GET /api/v1/admin/products` (token-protected)
- `POST /api/v1/admin/products` (token-protected)
- `PATCH /api/v1/admin/products/:id` (token-protected)
- `DELETE /api/v1/admin/products/:id` (token-protected)
- `GET /api/health`

## Data Model (Prisma)
- `Product`
- `Order`
- `OrderItem`
- `Payment`
- Enums: `OrderStatus`, `PaymentStatus`

## Payment Flow (Current)
1. Client sends cart items to `POST /api/v1/checkout/session`.
2. Server validates product IDs and quantities, recalculates totals from DB prices.
3. Server creates pending order and Stripe Checkout session.
4. Stripe webhook (`checkout.session.completed` / `checkout.session.async_payment_failed`) updates order and payment records.

## Environment Variables Used
- `DATABASE_URL`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL_TEMPLATE`
- `STRIPE_CANCEL_URL`
- `ADMIN_API_TOKEN`

## Caching Strategy
- **Client (TanStack Query):** 60s staleTime, 10min gcTime, `keepPreviousData` for smooth pagination.
- **Server (`GET /api/v1/products`):** `Cache-Control: public, s-maxage=30, stale-while-revalidate=60`.
- **Images:** native `loading="lazy"` on product images.

## Not Yet Implemented
- Real auth/admin permissions.
- Production Docker/Coolify manifests in repo (dev compose exists).
- E2E/integration test suite.
- Email notifications and fulfillment workflow.
- Operational hardening (rate limits, anti-abuse, observability).

## Immediate Next Milestones
1. Add production Docker/Coolify manifests and deployment docs.
2. Add Stripe local webhook test workflow (`stripe listen`) docs/scripts.
3. Add basic tests for checkout + webhook paths.
4. Add role-based admin auth replacing static token.
