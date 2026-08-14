# CashbackApp — Phase 1 + Phase 2

A cashback + share-to-earn platform built around the Cuelinks affiliate network (see
`Claude Prompt — Cashback & Share-to-Earn Web Platform.md` for the full product spec).

**Built so far:**
- **Phase 1** — project setup, core DB schema, auth, store directory/detail, Cuelinks
  affiliate redirect (`/go/:storeSlug`), ledger-based wallet.
- **Phase 2** — Share & Earn (profit links, `/p/:code`), Refer & Earn (`/refer/:code`),
  a `Transaction` table, an idempotent `POST /api/webhooks/cuelinks` postback processor,
  and an SSRF-safe URL validator for user-submitted profit-link URLs.

Withdrawals and the admin portal are **not built yet** — see Roadmap below.

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
# Leave CUELINKS_API_KEY blank to run in stub mode — see below.

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

## Cuelinks integration

`src/lib/cuelinks/index.ts`'s `getCuelinksClient()` is the only entry point call sites use —
it returns the **stub client** (deterministic fake tracking URLs, no network calls) when
`CUELINKS_API_KEY` is unset, or the **real client** when it is.

`src/lib/cuelinks/realClient.ts` was verified 2026-08-14 against the live
`developers.cuelinks.com` docs (base URL `https://developers.cuelinks.com/pub_api/v3`,
`Authorization: Token <key>` header, `POST /links/convert` request/response shape,
`GET /campaigns` and `GET /transactions` shapes) and confirmed working end-to-end against
a real account — this is a working integration, not a guessed skeleton.

Before using a real key:

1. Regenerate/rotate any key that was ever visible in a screenshot or shared publicly —
   treat any exposed key as compromised.
2. Set `CUELINKS_API_KEY`, `CUELINKS_CHANNEL_ID` in `.env`.
3. `CUELINKS_POSTBACK_SECRET` — set this to whatever constant "token" value you configure
   on the Cuelinks Global Postback form's Constant Parameters section; `POST
   /api/webhooks/cuelinks` verifies incoming postbacks against it (constant-time
   comparison). Left unset, the endpoint accepts unauthenticated postbacks — fine for local
   testing, not for anything public-facing.
4. **The postback's status parameter name is still unconfirmed** — the confirmed Cuelinks
   postback config only wires up `click_id`/`commission_amount`/`transaction_amount`/
   `merchant_transaction_id`/`token`, no status field. Add one to your Cuelinks postback
   template and extend `mapCuelinksStatus()` in `src/lib/postback/processor.ts` if its name
   differs from `status`. The confirmed status *values* (once that field exists) are:
   `pending`, `validated`, `payable`, `invoice_raised`, `paid`, `rejected`.

## Known security follow-up before deploying

`npm audit` (checked 2026-08-14) still flags `next@14.2.35` itself for several
high-severity advisories (DoS, cache poisoning, SSRF in server actions/rewrites) and a
moderate esbuild/Vitest dev-server issue. Both are fixable only via major version jumps
(Next 16, Vitest 4) that change API shape used throughout this codebase — Next 15+ makes
dynamic route `params` a `Promise`, so every `[slug]`-style page and route handler would
need updating. Deliberately deferred while this is a local, non-deployed scaffold.
**Upgrade Next.js (and re-verify all dynamic routes) before deploying this publicly.**

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
   "Destination URL" field: `https://<your-domain>/api/webhooks/cuelinks`.

## Environment variables

| Variable                    | Required | Notes                                                            |
| ---------------------------- | -------- | ----------------------------------------------------------------- |
| `DATABASE_URL`               | Yes      | Postgres connection string                                        |
| `TEST_DATABASE_URL`          | No       | Separate DB for `npm run test:integration` — see Testing below    |
| `REDIS_URL`                  | No       | App runs with no-op cache if unset (`src/lib/redis.ts`)          |
| `AUTH_SECRET`                | Yes      | NextAuth session signing secret                                   |
| `NEXTAUTH_URL`               | Yes (dev)| `http://localhost:3000` locally                                   |
| `CUELINKS_API_KEY`           | No       | Blank = stub mode                                                  |
| `CUELINKS_CHANNEL_ID`        | No       | Used by the real client once configured                           |
| `CUELINKS_POSTBACK_SECRET`   | No       | Verifies `POST /api/webhooks/cuelinks` requests                   |

## Testing

```bash
npm run test              # pure-function unit tests, no DB required
npm run test:integration  # postback processor, real Postgres (separate test DB)
```

`npm run test` covers the financial-correctness modules the spec calls out as must-have:

- `src/lib/commission/engine.test.ts` — commission split math, the 100%-sum guard,
  `maxCashback` capping, `fixedAmount` overrides, rounding.
- `src/lib/attribution/subid.test.ts` — Cuelinks Sub ID construction (keyed off the click's
  own id, not the user id — see `src/lib/attribution/subid.ts`'s comment for why), no-PII
  guarantee, determinism.
- `src/lib/security/urlValidator.test.ts` — SSRF/open-redirect protection for profit-link
  URLs, including the subdomain-boundary bypass case (`notflipkart.com` must not match
  `flipkart.com`).
- `src/lib/referral/engine.test.ts` — referral eligibility window, cap-clipping, min-order
  gate.

`npm run test:integration` covers `src/lib/postback/processor.ts` against a **real,
separate** Postgres database (never your dev/demo data): duplicate-postback idempotency,
reversal correctness (subtracts the exact snapshotted amount), and attribution separation
as negative assertions (a direct-cashback confirmation never touches a stranger's wallet;
a profit-link confirmation credits only the creator, never the clicker; a referral credit
only applies with an active, eligible `Referral` row).

One-time setup for integration tests:
```bash
docker compose exec postgres psql -U cashback -d postgres -c "CREATE DATABASE cashbackapp_test;"
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
```

## Project structure

```
prisma/schema.prisma       Users, stores, clicks, wallet ledger, profit links,
                            referrals, transactions, postback audit log
prisma/seed.ts              Demo categories, stores (with merchant domains), cashback
                            rules, referral rule, users
src/lib/cuelinks/           Cuelinks adapter (client interface, stub, verified real client)
src/lib/attribution/        Sub ID construction (click-id-keyed)
src/lib/commission/         Commission distribution engine
src/lib/referral/           Referral eligibility (duration/cap/min-order)
src/lib/security/           SSRF-safe merchant URL validator
src/lib/postback/           Cuelinks postback processor (idempotent state machine)
src/app/go/[storeSlug]/     Direct-cashback affiliate redirect (spec section 47)
src/app/p/[code]/           Profit-link affiliate redirect
src/app/refer/[code]/       Referral capture -> /register
src/app/api/webhooks/cuelinks/   Postback endpoint
src/app/stores/              Store directory + store detail pages
src/app/dashboard/           Wallet summary, Share & Earn, Refer & Earn
```

## Roadmap (not built yet)

- **Phase 3** — Withdrawals, admin portal core (KPIs, Store CRUD, Commission
  Distribution Editor with live ₹ preview).
- **Phase 4** — Cuelinks Sync (background reconciliation job using
  `realClient.getTransactions`), Admin → Integrations → Cuelinks config page.
- **Phase 5** — Coupons/deals, notifications, missing-cashback claims, remaining
  homepage sections, SEO structured data, fraud/Risk Status automation.

Full detail for each phase is in the original spec doc and in
`C:\Users\shash\.claude\plans\steady-hugging-pond.md`.
