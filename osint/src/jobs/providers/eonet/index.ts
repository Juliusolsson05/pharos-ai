import type { JobDefinition } from '../../types.js';

import { processEonetIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'eonet',
    interval: 2 * 60 * 60 * 1000,
    enabled: true,
    processor: processEonetIngest,
  },
];
