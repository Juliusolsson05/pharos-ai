import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { databaseUrl } from '@/lib/env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  // uselibpqcompat=true in DATABASE_URL makes sslmode=require use standard
  // libpq semantics (encrypt without cert verification) instead of pg v8's
  // default verify-full behavior. No manual ssl config needed.
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });
  return new PrismaClient({
    adapter,
    log: process.env.PRISMA_LOG_QUERIES === "true" ? ["query", "warn", "error"] : ["warn", "error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;
