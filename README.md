# CashbackApp — Phase 1 Foundation

A cashback + share-to-earn platform built around the Cuelinks affiliate network. This is
**Phase 1** of a multi-phase build (see `Claude Prompt — Cashback & Share-to-Earn Web
Platform.md` for the full product spec): project setup, core DB schema, auth, store
directory/detail, a stub Cuelinks redirect flow with real click recording, and a
read-only wallet display. Profit links, referrals, the Cuelinks postback webhook,
withdrawals, and the admin portal are **not built yet** — see Roadmap below.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL ·
NextAuth.js v5 (Credentials, JWT sessions) · Vitest · ioredis (optional)

## Prerequisites

- Node.js 20+
- Docker (for local Postgres/Redis) — or point `DATABASE_URL` at your own Postgres

## Setup

```bash
# 1. Start Postgres + Redis
docker compose up -d

# 2. Configure environment
cp .env.example .env
# Generate AUTH_SECRET: npx auth secret   (or: openssl rand -base64 32)
# Leave CUELINKS_API_KEY blank — see "Cuelinks stub mode" below.

# 3. Install, migrate, seed
npm install
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev
```

Visit `http://localhost:3000`. Demo logins (created by the seed script):

- Admin: `admin@example.com` / `Admin@12345`
- User: `demo@example.com` / `Demo@12345`

## Cuelinks stub mode

`CUELINKS_API_KEY` is left blank by default. With no key set, `src/lib/cuelinks/index.ts`
returns a **stub client** (`src/lib/cuelinks/stubClient.ts`) that generates deterministic
fake tracking URLs — no network calls, no live credentials required. This is what makes
`npm run dev` and the click/redirect flow (`/go/:storeSlug`) fully demoable today.

Once you have a real Cuelinks API key:

1. Regenerate/rotate the key in the [Cuelinks dashboard](https://cuelinks.com/api-key) if
   it was ever visible in a screenshot, shared publicly, or otherwise exposed — treat any
   exposed key as compromised.
2. Set `CUELINKS_API_KEY`, `CUELINKS_CHANNEL_ID` in `.env`.
3. Review `src/lib/cuelinks/realClient.ts` — every endpoint call is marked with a `TODO`
   noting it must be verified against the current Cuelinks API v3 docs
   (`developers.cuelinks.com`) before relying on it. This client was written from the
   Cuelinks dashboard's key-scope screen, not from the live API docs, so treat it as a
   skeleton, not a verified integration, until checked.
4. `CUELINKS_POSTBACK_SECRET` is unused until Phase 2 (`POST /api/webhooks/cuelinks`).

## Known security follow-up before deploying

`npm audit` (checked 2026-08-14) still flags `next@14.2.35` itself for several
high-severity advisories (DoS, cache poisoning, SSRF in server actions/rewrites) and a
moderate esbuild/Vitest dev-server issue. Both are fixable only via major version jumps
(Next 16, Vitest 4) that change API shape used throughout this codebase — Next 15+ makes
dynamic route `params` a `Promise`, so every `[slug]`/`[storeSlug]` page and route
handler would need updating. Deliberately deferred while this is a local, non-deployed
Phase 1 scaffold. **Upgrade Next.js (and re-verify all dynamic routes) before deploying
this publicly.**

## Deploying to Railway

`railway.json` is already configured: Nixpacks build (`npm run build`), then on deploy
`npm run deploy:migrate && npm run start` (`prisma migrate deploy` runs before the server
starts, and `start` binds to Railway's `$PORT`).

1. Create a new Railway project from this GitHub repo.
2. Add a **Postgres** plugin — Railway sets `DATABASE_URL` automatically; reference it as
   a variable on the app service if it isn't linked already.
3. (Optional) Add a **Redis** plugin the same way for `REDIS_URL` — the app runs fine
   without it (`src/lib/redis.ts` no-ops if unset).
4. Set these variables on the app service:
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`, do not reuse the local dev
     value committed nowhere but your local `.env`.
   - `NEXTAUTH_URL` — your Railway-assigned public domain, e.g.
     `https://cashbackapp-production.up.railway.app`.
   - `CUELINKS_API_KEY`, `CUELINKS_CHANNEL_ID`, `CUELINKS_POSTBACK_SECRET` — optional;
     leave unset to keep running in Cuelinks stub mode in production too.
5. Deploy. The seed script (`npm run db:seed`) is **not** run automatically — it's demo
   data, not meant for production. Run it manually via `railway run npm run db:seed` only
   if you want the demo stores/users on this environment.
6. Once you have the real domain, that's what belongs in the Cuelinks Global Postback
   "Destination URL" field — but only once `POST /api/webhooks/cuelinks` exists
   (Phase 2, not built yet).

## Environment variables

| Variable                    | Required | Notes                                                            |
| ---------------------------- | -------- | ----------------------------------------------------------------- |
| `DATABASE_URL`               | Yes      | Postgres connection string                                        |
| `REDIS_URL`                  | No       | App runs with no-op cache if unset (`src/lib/redis.ts`)          |
| `AUTH_SECRET`                | Yes      | NextAuth session signing secret                                   |
| `NEXTAUTH_URL`               | Yes (dev)| `http://localhost:3000` locally                                   |
| `CUELINKS_API_KEY`           | No       | Blank = stub mode                                                  |
| `CUELINKS_CHANNEL_ID`        | No       | Used by the real client once configured                           |
| `CUELINKS_POSTBACK_SECRET`   | No       | Unused until Phase 2 postback webhook                             |

## Testing

```bash
npm run test
```

Covers the two financial-correctness modules the spec calls out as must-have:

- `src/lib/commission/engine.test.ts` — commission split math, the 100%-sum guard,
  `maxCashback` capping, `fixedAmount` overrides, rounding.
- `src/lib/attribution/subid.test.ts` — Cuelinks Sub ID (`subid`–`subid5`) construction,
  no-PII guarantee, determinism.

## Project structure

```
prisma/schema.prisma      Phase 1 tables (users, stores, clicks, wallet ledger, ...)
prisma/seed.ts            Demo categories, stores, campaigns, cashback rules, users
src/lib/cuelinks/         Cuelinks adapter (client interface, stub, real skeleton)
src/lib/attribution/      Sub ID (subid–subid5) construction
src/lib/commission/       Commission distribution engine
src/app/go/[storeSlug]/   Affiliate redirect handler (spec section 47)
src/app/stores/           Store directory + store detail pages
src/app/dashboard/        Logged-in dashboard (wallet summary, recent clicks)
```

## Roadmap (not built yet)

- **Phase 2** — Share & Earn (profit links), Refer & Earn, `transactions` table,
  `POST /api/webhooks/cuelinks` (idempotent postback processing), SSRF/open-redirect
  guard for user-submitted URLs.
- **Phase 3** — Withdrawals, admin portal core (KPIs, Store CRUD, Commission
  Distribution Editor with live ₹ preview).
- **Phase 4** — Cuelinks Sync (background reconciliation job), Admin → Integrations →
  Cuelinks config page.
- **Phase 5** — Coupons/deals, notifications, missing-cashback claims, remaining
  homepage sections, SEO structured data, fraud/Risk Status automation.

Full detail for each phase is in the original spec doc and in
`C:\Users\shash\.claude\plans\steady-hugging-pond.md`.
