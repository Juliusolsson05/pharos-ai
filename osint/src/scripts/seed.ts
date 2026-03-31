import 'dotenv/config';

/**
 * Thin CLI runner for provider-owned seed/backfill scripts.
 *
 * Usage:
 *   npx tsx src/scripts/seed.ts --provider nightlights --from 2026-02-27 [--to 2026-03-30] [--delay 2000]
 *
 * Each provider owns its own seed logic in providers/{name}/seed.ts.
 * This runner just parses args and delegates.
 */

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : undefined;
}

async function main() {
  const provider = getArg('provider');
  const from = getArg('from');
  const to = getArg('to') ?? new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const delay = parseInt(getArg('delay') ?? '2000', 10);

  if (!provider) {
    console.error('Usage: npx tsx src/scripts/seed.ts --provider <name> [--from <YYYY-MM-DD>] [--to <YYYY-MM-DD>] [--delay <ms>]');
    process.exit(1);
  }

  if (from) {
    console.log(`Seeding provider "${provider}" from ${from} to ${to} (delay: ${delay}ms)`);
  } else {
    console.log(`Seeding provider "${provider}"`);
  }

  try {
    const mod = await import(`../providers/${provider}/seed.js`);
    if (typeof mod.seed !== 'function') {
      console.error(`Provider "${provider}" does not export a seed() function`);
      process.exit(1);
    }
    await mod.seed({ from, to, delay });
  } catch (e) {
    console.error(`Failed to load seed for provider "${provider}":`, e);
    process.exit(1);
  }

  // Disconnect Redis/Prisma so the process can exit
  const { redis } = await import('../queue.js');
  await redis.quit();
  const { prisma } = await import('../db.js');
  await prisma.$disconnect();
}

main();
