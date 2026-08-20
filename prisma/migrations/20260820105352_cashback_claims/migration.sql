-- CreateEnum
CREATE TYPE "claim_status" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ESCALATED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "claim_order_type" AS ENUM ('OWN_ORDER', 'AFFILIATE_ORDER');

-- CreateTable
CREATE TABLE "cashback_claims" (
    "id" TEXT NOT NULL,
    "claim_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_type" "claim_order_type" NOT NULL,
    "click_id" TEXT,
    "claimed_click_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "clicked_at" TIMESTAMP(3) NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_amount" DECIMAL(12,2) NOT NULL,
    "screenshot_url" TEXT,
    "message" TEXT NOT NULL,
    "status" "claim_status" NOT NULL DEFAULT 'SUBMITTED',
    "admin_note" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cashback_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cashback_claims_claim_number_key" ON "cashback_claims"("claim_number");

-- CreateIndex
CREATE INDEX "cashback_claims_user_id_created_at_idx" ON "cashback_claims"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "cashback_claims_status_created_at_idx" ON "cashback_claims"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "cashback_claims_user_id_order_id_key" ON "cashback_claims"("user_id", "order_id");

-- AddForeignKey
ALTER TABLE "cashback_claims" ADD CONSTRAINT "cashback_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashback_claims" ADD CONSTRAINT "cashback_claims_click_id_fkey" FOREIGN KEY ("click_id") REFERENCES "clicks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashback_claims" ADD CONSTRAINT "cashback_claims_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
