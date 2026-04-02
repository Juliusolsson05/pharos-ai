import { PrismaClient } from '.prisma/osint-client';

const globalForPrisma = globalThis as unknown as { osintPrisma?: PrismaClient };

const SLOW_QUERY_MS = 100;

function createClient() {
  const client = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'warn' },
      { emit: 'stdout', level: 'error' },
    ],
  });

  client.$on('query', (e) => {
    if (e.duration >= SLOW_QUERY_MS) {
      console.log(`[prisma] ${e.duration}ms — ${e.query.slice(0, 150)}`);
    }
  });

  return client;
}

export const prisma = globalForPrisma.osintPrisma ?? createClient();
globalForPrisma.osintPrisma = prisma;
