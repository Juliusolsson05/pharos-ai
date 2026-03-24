import { PrismaClient } from '.prisma/osint-client';

const globalForPrisma = globalThis as unknown as { osintPrisma?: PrismaClient };

function createClient() {
  return new PrismaClient({
    log: process.env.PRISMA_LOG_QUERIES === 'true'
      ? ['query', 'warn', 'error']
      : ['warn', 'error'],
  });
}

export const prisma = globalForPrisma.osintPrisma ?? createClient();
globalForPrisma.osintPrisma = prisma;
