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
  { name: 'gdelt',   interval: config.gdelt.pollInterval,   enabled: true },
  { name: 'gdelt-gkg', interval: config.gdelt.pollInterval, enabled: true },
  { name: 'gdelt-mentions', interval: config.gdelt.pollInterval, enabled: true },
  { name: 'gdelt-gqg', interval: 5 * 60 * 1000, enabled: true },
  { name: 'gdelt-gfg', interval: 60 * 60 * 1000, enabled: true },
  { name: 'firms',   interval: config.firms.pollInterval,   enabled: !!config.firms.mapKey },
  { name: 'overpass', interval: config.overpass.pollInterval, enabled: true },
  { name: 'nga',     interval: config.nga.pollInterval,     enabled: true },
  { name: 'usgs',    interval: config.usgs.pollInterval,    enabled: true },
  { name: 'ucdp',    interval: config.ucdp.pollInterval,    enabled: true },
  { name: 'opensky', interval: config.opensky.pollInterval, enabled: true },
  { name: 'gpsjam',  interval: config.gpsjam.pollInterval,  enabled: !!config.gpsjam.apiKey },
  { name: 'oref',    interval: config.oref.pollInterval,    enabled: true },
  { name: 'mirta',     interval: 7 * 24 * 60 * 60 * 1000,   enabled: true },
  { name: 'eonet',     interval: 2 * 60 * 60 * 1000,       enabled: true },
  { name: 'safecast',  interval: 2 * 60 * 60 * 1000,       enabled: true },
  { name: 'submarine-cables', interval: 7 * 24 * 60 * 60 * 1000, enabled: true },
  { name: 'cloudflare-radar', interval: config.cloudflareRadar.pollInterval, enabled: !!config.cloudflareRadar.token },
  { name: 'reference', interval: 24 * 60 * 60 * 1000,      enabled: true },
];

export async function registerJobs() {
  const jobNames = new Set(JOBS.map((j) => j.name));

  // Remove stale repeatable jobs we own
  const existing = await ingestQueue.getRepeatableJobs();
  for (const job of existing) {
    if (jobNames.has(job.name)) {
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
