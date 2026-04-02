import type { JobDefinition } from '../../types.js';

import { processSafecastIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'safecast',
    interval: 2 * 60 * 60 * 1000,
    enabled: true,
    processor: processSafecastIngest,
  },
];
