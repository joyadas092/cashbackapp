-- CreateEnum
CREATE TYPE "transaction_status" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'REVERSED', 'PAID');

-- CreateEnum
CREATE TYPE "referral_status" AS ENUM ('ACTIVE', 'EXPIRED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "profit_link_status" AS ENUM ('ACTIVE', 'DISABLED');

-- AlterEnum
ALTER TYPE "click_type" ADD VALUE 'PROFIT_LINK';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "wallet_tx_type" ADD VALUE 'PROFIT_LINK_EARNING';
ALTER TYPE "wallet_tx_type" ADD VALUE 'PROFIT_LINK_EARNING_REVERSED';
ALTER TYPE "wallet_tx_type" ADD VALUE 'REFERRAL_EARNING';
ALTER TYPE "wallet_tx_type" ADD VALUE 'REFERRAL_EARNING_REVERSED';

-- AlterTable
ALTER TABLE "clicks" ADD COLUMN     "profit_link_id" TEXT;

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "merchant_domains" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "profit_links" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "original_url" TEXT NOT NULL,
    "destination_url" TEXT NOT NULL,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "status" "profit_link_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profit_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referred_user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "referral_status" NOT NULL DEFAULT 'ACTIVE',
    "total_earned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_rules" (
    "id" TEXT NOT NULL,
    "fixed_bonus" DECIMAL(12,2),
    "duration_days" INTEGER,
    "max_total_earning" DECIMAL(12,2),
    "min_order_value" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "click_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "cashback_rule_id" TEXT,
    "cuelinks_transaction_id" TEXT NOT NULL,
    "order_id" TEXT,
    "sale_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "commission_amount" DECIMAL(12,2) NOT NULL,
    "customer_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "profit_link_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "referral_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "platform_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "transaction_status" NOT NULL DEFAULT 'PENDING',
    "raw_postback_payload" JSONB,
    "transaction_date" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "reversed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuelinks_postbacks" (
    "id" TEXT NOT NULL,
    "raw_params" JSONB NOT NULL,
    "token_valid" BOOLEAN NOT NULL,
    "click_id" TEXT,
    "transaction_id" TEXT,
    "process_result" TEXT NOT NULL,
    "error_message" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuelinks_postbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profit_links_code_key" ON "profit_links"("code");

-- CreateIndex
CREATE INDEX "profit_links_user_id_idx" ON "profit_links"("user_id");

-- CreateIndex
CREATE INDEX "profit_links_code_idx" ON "profit_links"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referred_user_id_key" ON "referrals"("referred_user_id");

-- CreateIndex
CREATE INDEX "referrals_referrer_id_idx" ON "referrals"("referrer_id");

-- CreateIndex
CREATE INDEX "transactions_click_id_idx" ON "transactions"("click_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_store_id_cuelinks_transaction_id_key" ON "transactions"("store_id", "cuelinks_transaction_id");

-- CreateIndex
CREATE INDEX "cuelinks_postbacks_click_id_idx" ON "cuelinks_postbacks"("click_id");

-- CreateIndex
CREATE INDEX "cuelinks_postbacks_received_at_idx" ON "cuelinks_postbacks"("received_at");

-- CreateIndex
CREATE INDEX "clicks_profit_link_id_idx" ON "clicks"("profit_link_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_source_transaction_id_user_id_type_key" ON "wallet_transactions"("source_transaction_id", "user_id", "type");

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_profit_link_id_fkey" FOREIGN KEY ("profit_link_id") REFERENCES "profit_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_links" ADD CONSTRAINT "profit_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_links" ADD CONSTRAINT "profit_links_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_links" ADD CONSTRAINT "profit_links_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_click_id_fkey" FOREIGN KEY ("click_id") REFERENCES "clicks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cashback_rule_id_fkey" FOREIGN KEY ("cashback_rule_id") REFERENCES "cashback_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

