import type { Job } from 'bullmq';

import { seed as seedLandMask } from '../../../providers/geodata/land-mask/seed.js';
import { seed as seedPlaces } from '../../../providers/geodata/populated-places/seed.js';
import { seed as seedSettlements } from '../../../providers/geodata/settlements/seed.js';
import { seed as seedTileMask } from '../../../providers/geodata/tile-mask/seed.js';

/**
 * Run all geodata seeds in sequence then compute tile mask.
 * Each source checks its version cursor and skips if already seeded.
 */
export async function processTileMaskIngest(job: Job) {
  const start = Date.now();

  await job.log('[geodata] Seeding land mask...');
  await seedLandMask({});
  await job.updateProgress(25);

  await job.log('[geodata] Seeding populated places...');
  await seedPlaces({});
  await job.updateProgress(50);

  await job.log('[geodata] Seeding settlements...');
  await seedSettlements({});
  await job.updateProgress(75);

  await job.log('[geodata] Computing tile masks...');
  await seedTileMask({});
  await job.updateProgress(100);

  const duration = Date.now() - start;
  await job.log(`[geodata] All done in ${(duration / 1000).toFixed(1)}s`);
  return { status: 'ok', durationMs: duration };
}
