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

After the first-time setup, `npm run start:dev` does steps 1 and 4 together (brings the
containers up, then starts the dev server).

Visit `http://localhost:3000`. Demo logins (created by the seed script):

- Admin: `admin@example.com` / `Admin@12345`
- User: `demo@example.com` / `Demo@12345`

## Troubleshooting

**Every page returns 500 / "Can't reach database server at `localhost:5433`"** — Docker isn't
running. The database lives in a container (see `docker-compose.yml`), so closing Docker
Desktop takes the whole app down with it. Start Docker Desktop, then:

```bash
docker compose up -d
```

Data is not lost when this happens — it persists in the `cashback_postgres_data` Docker
volume across container and machine restarts.

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

## Railway deployment (live)

**Deployed and running:** https://web-production-f9977.up.railway.app

| | |
| --- | --- |
| Railway project | `cashbackapp` (`026c6caa-8b9c-4f70-9b42-6849e9393dd1`) |
| App service | `web` — GitHub source `joyadas092/cashbackapp`, branch `main` |
| Database service | `Postgres` — reachable only on the private network (`postgres.railway.internal:5432`) |
| Redis | not provisioned — `src/lib/redis.ts` no-ops without `REDIS_URL` |
| Cuelinks | stub mode — no `CUELINKS_API_KEY` set in production |

`railway.json` drives it: Nixpacks build (`npm run build`), then on deploy
`npm run deploy:migrate && npm run start` — so `prisma migrate deploy` runs against the
Railway database before the server binds to `$PORT`. The schema is migrated and the demo
seed (10 stores, demo + admin users) has been applied, so the deployed site has data.

### Deploys are currently CLI-triggered, not automatic

The `web` service points at the GitHub repo, but Railway's GitHub App has **not** been
authorized for `joyadas092/cashbackapp`, so pushing to `main` does not build anything —
the API rejects a git-sourced deploy with `Repository "joyadas092/cashbackapp" not found
or is not accessible`. Until that's connected, ship with:

```bash
git push origin main            # keep the repo current
railway up --service web        # build + deploy the working tree
```

To switch to push-to-deploy: Railway dashboard → `web` service → Settings → Source →
connect the GitHub repo, approving the Railway GitHub App for `joyadas092/cashbackapp`.
After that, `git push origin main` is the whole deploy.

### Build-time gotcha: nothing may touch the database during `next build`

The Railway build container has no route to `postgres.railway.internal`. Any route or page
Next decides to **statically prerender** runs its data fetch at build time and will fail
the whole build with `Can't reach database server`. This already broke one deploy via
`/api/categories`, a GET handler with no request input, which Next therefore prerendered.

Rule: **any route handler or page that queries Prisma must be request-time.** Handlers that
read `request`/`cookies()`/`headers()` are dynamic automatically; ones that don't need an
explicit `export const dynamic = "force-dynamic"` (see
`src/app/api/categories/route.ts`). Check `npm run build` output — every DB-backed route
should be marked `ƒ (Dynamic)`, never `○ (Static)`.

### Variables set on the `web` service

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (service reference, resolves to the private endpoint) |
| `AUTH_SECRET` | generated at deploy time; rotate from the Railway dashboard whenever you like |
| `NEXTAUTH_URL` / `AUTH_URL` | `https://web-production-f9977.up.railway.app` |
| `AUTH_TRUST_HOST` | `true` — NextAuth v5 requires this behind Railway's proxy |

`CUELINKS_API_KEY`, `CUELINKS_CHANNEL_ID`, `CUELINKS_POSTBACK_SECRET` are deliberately
**unset**, so production runs in Cuelinks stub mode. Before setting them, rotate the key —
see the security note in the Cuelinks section above.

### Cuelinks Global Postback destination

Once the real Cuelinks credentials go in, this is the "Destination URL":

```
https://web-production-f9977.up.railway.app/api/webhooks/cuelinks
```

### Reaching the deployed database

There is no public Postgres endpoint by design. To run a one-off script (a re-seed, a
manual query) against it, create a temporary proxy, use it, and delete it again:

```bash
railway tcp-proxy create --port 5432 --service Postgres   # prints host:port
DATABASE_URL=postgresql://postgres:<pw>@<host>:<port>/railway npx tsx prisma/seed.ts
railway tcp-proxy delete <proxy-id> --service Postgres --yes
railway tcp-proxy list --service Postgres                 # confirm it returns []
```

Always delete the proxy afterwards — while it exists the database is reachable from the
public internet with nothing but the password in front of it.

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
