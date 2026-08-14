-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "risk_status" AS ENUM ('NORMAL', 'REVIEW', 'RESTRICTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "store_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "cashback_type" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "click_type" AS ENUM ('DIRECT_CASHBACK', 'VISIT_STORE');

-- CreateEnum
CREATE TYPE "click_status" AS ENUM ('TRACKED', 'FAILED');

-- CreateEnum
CREATE TYPE "wallet_tx_type" AS ENUM ('CASHBACK_PENDING', 'CASHBACK_CONFIRMED', 'CASHBACK_REVERSED', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "wallet_tx_status" AS ENUM ('PENDING', 'COMPLETED', 'REVERSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "referral_code" TEXT NOT NULL,
    "risk_status" "risk_status" NOT NULL DEFAULT 'NORMAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "upi_id" TEXT,
    "bank_details" JSONB,
    "kyc_status" TEXT,
    "notification_prefs" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pending_cashback" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "confirmed_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "available_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "withdrawn" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lifetime_earned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "wallet_tx_type" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "source" TEXT,
    "source_transaction_id" TEXT,
    "status" "wallet_tx_status" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo_url" TEXT NOT NULL,
    "banner_url" TEXT,
    "favicon_url" TEXT,
    "brand_color" TEXT,
    "category_id" TEXT NOT NULL,
    "cashback_type" "cashback_type" NOT NULL DEFAULT 'PERCENTAGE',
    "cashback_rate" DECIMAL(5,2) NOT NULL,
    "cashback_display_text" TEXT NOT NULL,
    "description" TEXT,
    "terms" TEXT,
    "status" "store_status" NOT NULL DEFAULT 'ACTIVE',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "ranking" INTEGER NOT NULL DEFAULT 0,
    "profit_link_eligible" BOOLEAN NOT NULL DEFAULT false,
    "cashback_eligible" BOOLEAN NOT NULL DEFAULT true,
    "coupon_visible" BOOLEAN NOT NULL DEFAULT false,
    "cuelinks_campaign_id" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "cuelinks_campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "commission_type" TEXT,
    "commission_value" DECIMAL(5,2),
    "raw_payload" JSONB,
    "last_synced_at" TIMESTAMP(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clicks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "store_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "click_type" "click_type" NOT NULL,
    "original_url" TEXT NOT NULL,
    "tracking_url" TEXT NOT NULL,
    "subid" TEXT,
    "subid2" TEXT,
    "subid3" TEXT,
    "subid4" TEXT,
    "subid5" TEXT,
    "user_agent" TEXT,
    "device_type" TEXT,
    "country" TEXT,
    "status" "click_status" NOT NULL DEFAULT 'TRACKED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashback_rules" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "customer_pct" DECIMAL(5,2) NOT NULL,
    "profit_link_pct" DECIMAL(5,2) NOT NULL,
    "referral_pct" DECIMAL(5,2) NOT NULL,
    "platform_pct" DECIMAL(5,2) NOT NULL,
    "fixed_amount" DECIMAL(12,2),
    "max_cashback" DECIMAL(12,2),
    "min_order_value" DECIMAL(12,2),
    "validity_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cashback_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_source_transaction_id_idx" ON "wallet_transactions"("source_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_categories_slug_key" ON "store_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "stores_category_id_idx" ON "stores"("category_id");

-- CreateIndex
CREATE INDEX "stores_status_featured_ranking_idx" ON "stores"("status", "featured", "ranking");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_cuelinks_campaign_id_key" ON "campaigns"("cuelinks_campaign_id");

-- CreateIndex
CREATE INDEX "campaigns_store_id_idx" ON "campaigns"("store_id");

-- CreateIndex
CREATE INDEX "clicks_user_id_idx" ON "clicks"("user_id");

-- CreateIndex
CREATE INDEX "clicks_store_id_idx" ON "clicks"("store_id");

-- CreateIndex
CREATE INDEX "clicks_created_at_idx" ON "clicks"("created_at");

-- CreateIndex
CREATE INDEX "cashback_rules_store_id_idx" ON "cashback_rules"("store_id");

-- CreateIndex
CREATE INDEX "cashback_rules_is_active_idx" ON "cashback_rules"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "store_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashback_rules" ADD CONSTRAINT "cashback_rules_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
