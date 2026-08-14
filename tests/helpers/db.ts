import { prisma } from "@/lib/db";

/**
 * The integration runner (scripts/run-integration-tests.mjs) points
 * DATABASE_URL at TEST_DATABASE_URL before spawning Vitest, so the shared
 * `prisma` singleton from src/lib/db.ts already targets the test database —
 * no separate test client needed. This guard exists so that running this
 * file directly (bypassing the wrapper script, e.g. `npx vitest run
 * src/lib/postback/processor.integration.test.ts` with a dev DATABASE_URL
 * still set) fails loudly instead of truncating real dev/demo data.
 */
function assertTestDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("cashbackapp_test")) {
    throw new Error(
      `Refusing to run: DATABASE_URL does not look like the test database (got: "${url}"). ` +
        "Run integration tests via `npm run test:integration`, which sets this automatically — " +
        "never invoke this test file directly with your regular dev DATABASE_URL."
    );
  }
}

/** Deletes all rows from tables integration tests touch, in FK-safe order. */
export async function resetTestDb(): Promise<void> {
  assertTestDatabase();
  await prisma.cuelinksPostback.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.click.deleteMany();
  await prisma.profitLink.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.referralRule.deleteMany();
  await prisma.cashbackRule.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();
  await prisma.storeCategory.deleteMany();
  await prisma.setting.deleteMany();
}

export { prisma as testPrisma };
