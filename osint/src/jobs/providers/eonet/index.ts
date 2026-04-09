import type { JobDefinition } from '../../types.js';

import { processEonetIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'eonet',
    interval: 2 * 60 * 60 * 1000,
    workload: 'standard',
    enabled: true,
    processor: processEonetIngest,
  },
];
