import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "../config/env";

/**
 * One PrismaClient for the whole app's lifetime.
 * Creating a new one per request would open a new pool of database connections
 * every time, and Postgres (and Neon) allow only a limited number at once.
 *
 * Since Prisma 7, the schema file no longer holds a connection URL — the
 * running app connects through an explicit "driver adapter" instead.
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});