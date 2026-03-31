import { ingestQueue } from '../../queue.js';

const JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: 50,
  removeOnFail: 50,
  priority: 10, // lower priority than live daily runs (default 0)
};

function generateDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const start = new Date(from);
  const end = new Date(to);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  return dates;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Seed nightlights data by enqueuing one BullMQ job per date.
 * Each job uses the same processor as the daily ingest — no code duplication.
 */
export async function seed(opts: { from: string; to: string; delay?: number }): Promise<void> {
  const dates = generateDateRange(opts.from, opts.to);
  const delay = opts.delay ?? 2000;

  console.log(`[nightlights seed] Enqueuing ${dates.length} days: ${opts.from} → ${opts.to}`);

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    await ingestQueue.add('nightlights-daily', { source: 'nightlights-daily', date }, JOB_OPTS);
    console.log(`  [${i + 1}/${dates.length}] Queued ${date}`);

    if (i < dates.length - 1 && delay > 0) {
      await sleep(delay);
    }
  }

  // Also enqueue a full-land snapshot for the baseline date
  await ingestQueue.add('nightlights-snapshot', { source: 'nightlights-snapshot', date: opts.from }, JOB_OPTS);
  console.log(`  [snapshot] Queued baseline snapshot for ${opts.from}`);

  console.log(`[nightlights seed] All ${dates.length} daily + 1 snapshot jobs enqueued.`);
}
