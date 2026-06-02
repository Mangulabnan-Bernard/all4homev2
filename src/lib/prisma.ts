import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Prisma 7 connects through a driver adapter. PrismaNeon speaks Postgres over
// Neon's serverless driver (a WebSocket pool, so interactive transactions work).
// The driver needs a WebSocket implementation in Node (< 22 has no global one);
// the `ws` types differ slightly from the DOM WebSocket the driver expects.
neonConfig.webSocketConstructor = ws as unknown as typeof neonConfig.webSocketConstructor;

// Global singleton so dev hot-reload / serverless invocations don't exhaust the
// connection pool by re-instantiating on every request.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaNeon({ connectionString: url });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
