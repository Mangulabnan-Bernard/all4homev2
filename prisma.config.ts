import { defineConfig, env } from "prisma/config";

// Prisma 7 moved the connection URL out of schema.prisma. The CLI does not
// auto-load .env when a config file is present, so we load it ourselves using
// Node's built-in loader (Node >= 20.12 / 24 here). Safe no-op if .env absent.
try {
  process.loadEnvFile();
} catch {
  // .env not found (e.g. CI with real env vars) — ignore.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
