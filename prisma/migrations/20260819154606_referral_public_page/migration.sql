-- AlterTable
ALTER TABLE "referral_rules" ADD COLUMN     "headline_rate_pct" DECIMAL(5,2),
ADD COLUMN     "public_headline" TEXT,
ADD COLUMN     "public_subtext" TEXT;
