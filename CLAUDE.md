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
- Phone number input required before checkout.
- Checkout button that creates a Stripe Checkout session and redirects.
- Order status page by `orderNumber`.
- Admin panel at `/admin` with tabbed interface (Products / Orders).
- Admin Products tab with token input, filtering, pagination, read-only cards, edit icon flow, and delete icon flow.
- Admin Products tab supports create (toggled via `Create Product` button), update, and delete with confirmation.
- Admin create/edit forms support image URL entry and file upload with image preview.
- Admin Orders tab with paginated order list, status filtering, and order detail cards (order number, status, date, total, customer phone/email, line items).
- Product cards use flex-column layout for consistent price/action row alignment across grid.
- API abstraction layer:
  - HTTP client: `src/frontend/api/http/client.ts`
  - API clients: products, checkout, orders, admin-products, admin-orders, uploads
  - Hooks: `useApi`, `useApiCached`, `useApiPaginated`, `useApiPaginatedCached`

## Backend (Current)
- Located in `src/server/modules/`.
- N-tier module layout per domain:
  - `controller -> service -> repository`
- Implemented modules:
  - Admin Products
  - Admin Orders
  - Products
  - Checkout
  - Orders
  - Payments
  - Uploads
  - Stripe Webhooks
  - Health
- Shared server utilities (`src/server/shared/`):
  - Prisma client singleton
  - App error + HTTP error handling
  - Admin auth helper
- Stripe integration (`src/server/integrations/stripe/`):
  - Stripe client
  - Webhook utilities
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
- `GET /api/v1/admin/orders` (token-protected, pagination + status filter)
- `POST /api/v1/admin/uploads/image` (token-protected)
- `GET /api/health`

## Data Model (Prisma)
- `Product` (includes optional `category`)
- `Order` (includes optional `customerPhone`)
- `OrderItem`
- `Payment`
- Enums: `OrderStatus`, `PaymentStatus`

## Payment Flow (Current)
1. Client sends cart items and customer phone number to `POST /api/v1/checkout/session`.
2. Server validates product IDs and quantities, recalculates totals from DB prices.
3. Server creates pending order (with `customerPhone`) and Stripe Checkout session.
4. Stripe webhook (`checkout.session.completed` / `checkout.session.async_payment_failed`) updates order and payment records.

## Environment Variables Used
- `DATABASE_URL`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_API_VERSION`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL_TEMPLATE`
- `STRIPE_CANCEL_URL`
- `ADMIN_API_TOKEN`

## Caching Strategy
- **Client (TanStack Query):** 60s staleTime, 10min gcTime, `keepPreviousData` for smooth pagination.
- **Server (`GET /api/v1/products`):** `Cache-Control: public, s-maxage=30, stale-while-revalidate=60`.
- **Images:** native `loading="lazy"` on product images.
- **Perceived loading:** product card skeleton components render while product queries are loading.

## Upload Strategy
- Uploaded product images are stored under `public/uploads`.
- `POST /api/v1/admin/uploads/image` accepts `multipart/form-data` with `file`.
- Allowed image types: `jpeg`, `png`, `webp`; max file size: 5 MB.
- Successful uploads return a public relative URL (`/uploads/<filename>`), used directly in product `imageUrl`.

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
