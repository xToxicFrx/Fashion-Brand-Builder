# Fashion Brand Builder

All-in-one platform for independent fashion designers — a **Design Studio**, an
**E-commerce Store**, and **AI Trend Intelligence** in one Next.js app.

This is the **Phase 1 MVP**: a complete, runnable foundation with the Design
Studio built deep, and the other MVP areas (dashboard, trends, store, orders,
settings, public storefront) working with real data.

---

## Features

- **Design Studio** (flagship) — a Konva.js canvas editor: text, shapes, image
  upload, color + swatches, font controls, opacity, layers panel with
  visibility/lock, z-ordering, undo/redo, keyboard shortcuts, and save/publish
  with an exported PNG mockup.
- **Trend Intelligence** — live Google Trends lookups + Claude-powered analysis
  (trend score, demand estimate, suggested price, related keywords).
- **Store & products** — store setup with brand colors, generate products from
  designs, a public storefront, and Stripe checkout.
- **Orders** — fulfilment dashboard (status + tracking).
- **Auth** — email/password (NextAuth Credentials) plus Google OAuth.
- **Dashboard** — revenue chart, quick stats, top designs, recent orders.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS + shadcn/ui · Prisma ·
SQLite (dev) / PostgreSQL (prod) · NextAuth · Zustand · Konva/react-konva ·
Recharts · React Hook Form + Zod · Stripe · Anthropic Claude · Resend.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Environment — the defaults run the app with SQLite + email/password auth.
cp .env.example .env
#    Generate a real secret:  openssl rand -base64 32  -> NEXTAUTH_SECRET

# 3. Database — create the SQLite DB, apply the schema, and seed demo data
npx prisma migrate dev --name init
npm run seed

# 4. Run
npm run dev
```

Open http://localhost:3000.

**Demo login:** `demo@example.com` / `password`

> The app boots and the Design Studio + database features work with **only** the
> Database + NextAuth variables set. The external integrations below are
> lazy-loaded and only required when you use their feature.

---

## Environment variables

See [`.env.example`](./.env.example) for the full list. Summary:

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | Everything | SQLite file by default |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | Auth | Always set |
| `GOOGLE_CLIENT_ID/SECRET` | "Sign in with Google" | Optional |
| `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` | AI trend/design analysis | Defaults to `claude-opus-4-8` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Checkout & webhooks | |
| `NEXT_PUBLIC_APP_URL` | Stripe redirect URLs | |
| `RESEND_API_KEY`, `EMAIL_FROM` | Transactional email | |
| `UPLOADTHING_*` | Production image storage | Dev uses local `/public/uploads` |

Each integration is **wired for real**: with the key set it makes real API
calls; without it, the relevant endpoint returns a clear "configure X" error
instead of crashing, so the rest of the app keeps working.

---

## Project structure

```
app/
  (auth)/login, (auth)/signup          # auth pages
  (dashboard)/                         # protected app (dashboard, studio, designs, trends, store, orders, settings)
  (store)/[storeSlug]/[productId]      # public storefront
  api/                                 # route handlers (designs, trends, products, stores, orders, checkout, stripe/webhook, ai, upload, auth)
components/
  Canvas/                              # Design Studio: CanvasEditor, Toolbar, LayersPanel, DesignStudio
  Dashboard/ Trends/ Store/ Settings/ Common/ ui/
lib/                                   # db, auth, stripe, claude, google-trends, email, validations, json, utils, limits
prisma/                                # schema.prisma + seed.ts
store/                                 # Zustand (canvas state + history)
```

---

## Database: SQLite (dev) → PostgreSQL/Supabase (prod)

Local development uses SQLite for an instant, zero-setup database. For
production (and Vercel — serverless filesystems don't persist SQLite), switch to
Postgres:

1. In `prisma/schema.prisma`, change the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to your Supabase/Postgres connection string.
3. `npx prisma migrate deploy` (or `migrate dev` for a fresh history), then
   `npm run seed` if you want demo data.

JSON-shaped fields are stored as `String` (JSON-encoded) for SQLite portability
via `lib/json.ts`; on Postgres you can migrate them to `Json` columns later.

---

## Deploying to Vercel

1. Switch the Prisma datasource to `postgresql` (above) and provision a Postgres
   DB (Supabase works well).
2. Add all environment variables from `.env.example` in the Vercel project
   settings.
3. Deploy. The `build` script runs `prisma generate` automatically.
4. Configure the Stripe webhook endpoint to `https://<your-app>/api/stripe/webhook`
   and set `STRIPE_WEBHOOK_SECRET`.

**Image uploads:** dev writes to `/public/uploads`. On serverless hosting this
isn't persistent — set the `UPLOADTHING_*` keys and swap `app/api/upload/route.ts`
for an UploadThing (or S3 / Supabase Storage) handler. The client contract
(`POST { dataUrl } -> { url }`) stays the same.

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (`prisma generate` + `next build`) |
| `npm run start` | Run the production build |
| `npm run seed` | Seed demo data |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |

---

## Roadmap (next phases)

Collaborations & marketplace · print-on-demand integration · trend-alert emails ·
advanced analytics · multi-store · subscription billing UI.
