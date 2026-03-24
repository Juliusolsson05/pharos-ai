import { ingestQueue } from '../queue.js';
import { config } from '../config.js';

const JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: 50,
  removeOnFail: 50,
};

export async function registerJobs() {
  // Only remove repeatable jobs we own (by name), not everything
  const existing = await ingestQueue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === 'gdelt') {
      await ingestQueue.removeRepeatableByKey(job.key);
    }
  }

  // GDELT ingest — every 15 minutes
  await ingestQueue.add(
    'gdelt',
    { source: 'gdelt' },
    { repeat: { every: config.gdelt.pollInterval }, ...JOB_OPTS },
  );

  // Immediate first run
  await ingestQueue.add('gdelt', { source: 'gdelt' }, JOB_OPTS);

  console.log('[scheduler] Registered gdelt ingest (every 15min, 3 attempts, exponential backoff)');
}
