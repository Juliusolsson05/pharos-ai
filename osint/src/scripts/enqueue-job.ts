import 'dotenv/config';

import { prisma } from '../db.js';
import { ingestQueue, redis } from '../queue.js';

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : undefined;
}

async function main() {
  const name = getArg('name');
  const source = getArg('source') ?? name;
  const date = getArg('date');
  const priority = Number.parseInt(getArg('priority') ?? '1', 10);

  if (!name || !source) {
    console.error('Usage: npx tsx src/scripts/enqueue-job.ts --name <job-name> [--source <source>] [--date <YYYY-MM-DD>] [--priority <n>]');
    process.exit(1);
  }

  await ingestQueue.add(
    name,
    { source, ...(date ? { date } : {}) },
    {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 10,
      removeOnFail: 10,
      priority,
    },
  );

  console.log(`queued ${name}${date ? ` for ${date}` : ''}`);
  await redis.quit();
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await redis.quit();
  await prisma.$disconnect();
  process.exit(1);
});
