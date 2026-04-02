import type { JobDefinition } from '../../types.js';

import { processOgimIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'ogim',
    interval: 90 * 24 * 60 * 60 * 1000, // 90 days
    enabled: true,
    processor: processOgimIngest,
  },
];
