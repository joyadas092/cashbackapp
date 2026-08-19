-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "important_tips" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "payment_time" TEXT,
ADD COLUMN     "previous_rate" DECIMAL(5,2),
ADD COLUMN     "store_policies" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "tracking_time" TEXT,
ADD COLUMN     "visit_time" TEXT;

-- CreateTable
CREATE TABLE "store_cashback_rates" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "display_text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_cashback_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_offers" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "badge" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "valid_till" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_cashback_rates_store_id_sort_order_idx" ON "store_cashback_rates"("store_id", "sort_order");

-- CreateIndex
CREATE INDEX "store_offers_store_id_sort_order_idx" ON "store_offers"("store_id", "sort_order");

-- AddForeignKey
ALTER TABLE "store_cashback_rates" ADD CONSTRAINT "store_cashback_rates_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_offers" ADD CONSTRAINT "store_offers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
