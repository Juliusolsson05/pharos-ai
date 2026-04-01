import type { JobDefinition } from '../../types.js';

import { processMirtaIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'mirta',
    interval: 7 * 24 * 60 * 60 * 1000,
    enabled: true,
    processor: processMirtaIngest,
  },
];
