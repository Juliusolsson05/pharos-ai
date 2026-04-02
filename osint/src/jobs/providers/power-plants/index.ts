import type { JobDefinition } from '../../types.js';

import { processPowerPlantsIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'power-plants',
    interval: 30 * 24 * 60 * 60 * 1000,
    workload: 'standard',
    enabled: true,
    processor: processPowerPlantsIngest,
  },
];
