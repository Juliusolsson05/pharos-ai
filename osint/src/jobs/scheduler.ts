import { ingestQueue } from '../queue.js';
import { config } from '../config.js';

const JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: 50,
  removeOnFail: 50,
};

type JobDef = { name: string; interval: number; enabled: boolean };

const JOBS: JobDef[] = [
  { name: 'gdelt', interval: config.gdelt.pollInterval, enabled: true },
  { name: 'firms', interval: config.firms.pollInterval, enabled: !!config.firms.mapKey },
  { name: 'overpass', interval: config.overpass.pollInterval, enabled: true },
  { name: 'nga', interval: config.nga.pollInterval, enabled: true },
];

export async function registerJobs() {
  // Remove stale repeatable jobs we own
  const existing = await ingestQueue.getRepeatableJobs();
  for (const job of existing) {
    if (JOBS.some((j) => j.name === job.name)) {
      await ingestQueue.removeRepeatableByKey(job.key);
    }
  }

  for (const def of JOBS) {
    if (!def.enabled) {
      console.log(`[scheduler] ${def.name} skipped (not configured)`);
      continue;
    }

    await ingestQueue.add(
      def.name,
      { source: def.name },
      { repeat: { every: def.interval }, ...JOB_OPTS },
    );

    // Immediate first run
    await ingestQueue.add(def.name, { source: def.name }, JOB_OPTS);

    const label = def.interval >= 3_600_000
      ? `${def.interval / 3_600_000}h`
      : `${def.interval / 60_000}min`;
    console.log(`[scheduler] Registered ${def.name} (every ${label})`);
  }
}
