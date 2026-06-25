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
PostgreSQL (Supabase) · NextAuth · Zustand · Konva/react-konva ·
Recharts · React Hook Form + Zod · Stripe · Anthropic Claude · Resend.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Environment
cp .env.example .env
#    - Set DATABASE_URL + DIRECT_URL from your Supabase project (see "Database" below)
#    - Generate a secret:  openssl rand -base64 32  -> NEXTAUTH_SECRET

# 3. Database — apply the schema and seed demo data
npx prisma migrate deploy
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

## Database (PostgreSQL / Supabase)

The app uses PostgreSQL. Create a free [Supabase](https://supabase.com) project,
then:

1. **Project Settings → Database → Connection string.** Put the **pooled** URL
   (port `6543`, append `?pgbouncer=true`) in `DATABASE_URL`, and the **direct**
   URL (port `5432`) in `DIRECT_URL`. Prisma uses the pooled URL at runtime and
   the direct URL for migrations.
2. **Apply the schema:** `npx prisma migrate deploy` (applies the committed
   migration). Then `npm run seed` for demo data.
3. **Evolve the schema** during development by editing `prisma/schema.prisma` and
   running `npx prisma migrate dev --name <change>`.

JSON-shaped fields are stored as `String` (JSON-encoded) via `lib/json.ts`; you
can migrate them to `Json`/`Jsonb` columns later if you want.

---

## Deploying to Vercel

1. Provision a Postgres DB (Supabase). In Supabase open **Connect → ORMs / Prisma**
   and copy the two connection strings:
   - `DATABASE_URL` → **Transaction pooler** (host `...pooler.supabase.com`, port
     `6543`, append `?pgbouncer=true`). Used by the app at runtime.
   - `DIRECT_URL` → **Session pooler** (host `...pooler.supabase.com`, port `5432`).
     Used to run migrations during the build. Use the *pooler* host (not the raw
     `db.<ref>.supabase.co` direct host) — the pooler is IPv4-compatible, which
     Vercel requires.
2. In **Vercel → Project → Settings → Environment Variables** add at least:
   - `DATABASE_URL` and `DIRECT_URL` (both required — the build runs migrations).
   - `NEXTAUTH_URL` = your deployed URL, e.g. `https://your-app.vercel.app`.
   - `NEXTAUTH_SECRET` = a real random secret (`openssl rand -base64 32`).
   - Plus any optional integrations from `.env.example` you want to enable.
3. Deploy. The `build` script runs `prisma generate && prisma migrate deploy`
   automatically, so the database tables are **created on every deploy** — no
   manual migration step needed. (Optional: run `npm run seed` once against your
   production DB for demo data.)
4. Configure the Stripe webhook endpoint to `https://<your-app>/api/stripe/webhook`
   and set `STRIPE_WEBHOOK_SECRET`.

> **If sign-up fails with a 500 error**, the database tables are almost certainly
> missing. Confirm `DATABASE_URL` **and** `DIRECT_URL` are set in Vercel, then
> redeploy — the build will create the tables.

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
