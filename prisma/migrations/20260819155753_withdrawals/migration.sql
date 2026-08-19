-- CreateEnum
CREATE TYPE "withdrawal_status" AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "withdrawal_method" AS ENUM ('UPI', 'BANK_TRANSFER', 'PAYTM', 'AMAZON_PAY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "wallet_tx_type" ADD VALUE 'WITHDRAWAL';
ALTER TYPE "wallet_tx_type" ADD VALUE 'WITHDRAWAL_REVERSED';

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "withdrawal_method" NOT NULL,
    "destination" TEXT NOT NULL,
    "status" "withdrawal_status" NOT NULL DEFAULT 'REQUESTED',
    "admin_note" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "withdrawal_requests_user_id_requested_at_idx" ON "withdrawal_requests"("user_id", "requested_at");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests"("status");

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
