import { ingestQueue } from '../queue.js';
import { prisma } from '../db.js';
import { SCHEDULED_JOBS } from './index.js';

const JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: 50,
  removeOnFail: 50,
};

export async function registerJobs() {
  const jobNames = new Set(SCHEDULED_JOBS.map((j) => j.name));

  // Remove stale repeatable jobs we own
  const existing = await ingestQueue.getRepeatableJobs();
  for (const job of existing) {
    if (jobNames.has(job.name)) {
      await ingestQueue.removeRepeatableByKey(job.key);
    }
  }

  // Check which sources ran recently so we skip unnecessary immediate runs
  const syncs = await prisma.sourceSync.findMany({ select: { source: true, lastRunAt: true } });
  const lastRunMap = new Map(syncs.map((s) => [s.source, s.lastRunAt]));

  for (const def of SCHEDULED_JOBS) {
    if (!def.enabled) {
      console.log(`[scheduler] ${def.name} skipped (not configured)`);
      continue;
    }

    await ingestQueue.add(
      def.name,
      { source: def.name },
      { repeat: { every: def.interval }, ...JOB_OPTS },
    );

    // Only trigger an immediate run if the source hasn't run within its interval
    const lastRun = lastRunMap.get(def.name);
    const elapsed = lastRun ? Date.now() - lastRun.getTime() : Infinity;
    if (elapsed > def.interval) {
      await ingestQueue.add(def.name, { source: def.name }, JOB_OPTS);
    } else {
      const remaining = Math.round((def.interval - elapsed) / 60_000);
      console.log(`[scheduler] ${def.name} skipped immediate run (ran ${Math.round(elapsed / 60_000)}min ago, next in ${remaining}min)`);
    }

    const label = def.interval >= 3_600_000
      ? `${def.interval / 3_600_000}h`
      : `${def.interval / 60_000}min`;
    console.log(`[scheduler] Registered ${def.name} (every ${label})`);
  }
}
