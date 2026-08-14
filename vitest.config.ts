import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Integration tests hit a real Postgres and must only run via
    // `npm run test:integration`, which points DATABASE_URL at
    // TEST_DATABASE_URL before this config even loads — never picked up by
    // plain `npm run test`, which would otherwise run them against
    // whatever DATABASE_URL happens to be set (the dev DB with seeded data).
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
