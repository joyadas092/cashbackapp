// Runs the DB-backed integration test suite against TEST_DATABASE_URL instead
// of the dev DATABASE_URL, so `npm run test:integration` never truncates
// seeded demo data. Works by pointing the shared Prisma client (src/lib/db.ts,
// a module-level singleton) at the test database before Vitest imports it —
// which requires setting DATABASE_URL in the *child process's* environment
// before any test module loads, hence this small spawn wrapper rather than a
// vitest.config setupFile (setupFiles run after module imports are resolved).
import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
config({ path: path.join(rootDir, ".env") });

if (!process.env.TEST_DATABASE_URL) {
  console.error(
    "TEST_DATABASE_URL is not set. Add it to .env (see .env.example) and create the database:\n" +
      '  docker compose exec postgres psql -U cashback -d postgres -c "CREATE DATABASE cashbackapp_test;"\n' +
      "  DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy"
  );
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["vitest", "run", "--config", "vitest.integration.config.ts"],
  {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  }
);

process.exit(result.status ?? 1);
