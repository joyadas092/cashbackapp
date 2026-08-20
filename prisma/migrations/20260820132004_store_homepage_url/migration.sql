-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "homepage_url" TEXT;

-- Backfill from the first merchant domain so existing stores stop redirecting to
-- the old example-merchant.invalid placeholder the moment this deploys. Postgres
-- arrays are 1-indexed. Stores with no domains stay NULL and are handled by the
-- route, which refuses rather than inventing a destination.
UPDATE "stores"
SET "homepage_url" = 'https://' || "merchant_domains"[1] || '/'
WHERE "homepage_url" IS NULL
  AND array_length("merchant_domains", 1) >= 1;
