-- goURLs: /go/<username>/<store-slug>
--
-- `username` is NOT NULL UNIQUE on a populated table, so it cannot be added in
-- one step: Prisma applies @default(cuid()) client-side, which would emit a bare
-- NOT NULL and fail on the existing rows. Added nullable, backfilled, then
-- constrained.

ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Five lowercase hex characters derived from the row id. Deterministic, so the
-- migration is repeatable, with a retry on the (vanishingly unlikely, 1 in ~1M)
-- collision rather than trusting the birthday odds.
DO $$
DECLARE
  r RECORD;
  candidate TEXT;
  attempt INT;
BEGIN
  FOR r IN SELECT id FROM "users" WHERE "username" IS NULL LOOP
    attempt := 0;
    LOOP
      candidate := substr(md5(r.id || attempt::text), 1, 5);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "users" WHERE "username" = candidate);
      attempt := attempt + 1;
    END LOOP;
    UPDATE "users" SET "username" = candidate WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- Where a profit link came from.
CREATE TYPE "profit_link_source" AS ENUM ('MANUAL', 'GO_URL');
ALTER TABLE "profit_links"
  ADD COLUMN "source" "profit_link_source" NOT NULL DEFAULT 'MANUAL';

-- Exactly one goURL link per user per store. Manual links stay unconstrained:
-- a user may create many of those for one store, pointing at different products.
-- Partial indexes cannot be expressed in the Prisma schema, so this lives here.
CREATE UNIQUE INDEX "profit_links_go_url_unique"
  ON "profit_links" ("user_id", "store_id")
  WHERE "source" = 'GO_URL';
