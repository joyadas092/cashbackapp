-- CreateEnum
CREATE TYPE "cms_page_type" AS ENUM ('STATIC', 'CUSTOM', 'LANDING');

-- CreateEnum
CREATE TYPE "cms_page_status" AS ENUM ('PUBLISHED', 'DRAFT', 'ARCHIVED');

-- AlterTable
-- Added in three steps rather than one. Prisma's @unique + NOT NULL would fail
-- outright on a table that already holds payout requests, because @default(cuid())
-- is applied by the client and never reaches the database. So: add it nullable,
-- give every existing row a reference in the same format the app generates, then
-- tighten the constraint.
ALTER TABLE "withdrawal_requests" ADD COLUMN "reference" TEXT;

UPDATE "withdrawal_requests"
SET "reference" = 'PO-' || LPAD(((random() * 89999)::int + 10000)::text, 5, '0') || '-' || SUBSTRING(id FROM 1 FOR 4)
WHERE "reference" IS NULL;

ALTER TABLE "withdrawal_requests" ALTER COLUMN "reference" SET NOT NULL;

-- CreateTable
CREATE TABLE "cms_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "type" "cms_page_type" NOT NULL DEFAULT 'STATIC',
    "status" "cms_page_status" NOT NULL DEFAULT 'DRAFT',
    "views" INTEGER NOT NULL DEFAULT 0,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "show_in_footer" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_by_id" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cms_pages_slug_key" ON "cms_pages"("slug");

-- CreateIndex
CREATE INDEX "cms_pages_status_sort_order_idx" ON "cms_pages"("status", "sort_order");

-- CreateIndex
CREATE INDEX "cms_pages_type_idx" ON "cms_pages"("type");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_requests_reference_key" ON "withdrawal_requests"("reference");

-- AddForeignKey
ALTER TABLE "cms_pages" ADD CONSTRAINT "cms_pages_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
