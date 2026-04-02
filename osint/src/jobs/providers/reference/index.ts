import type { JobDefinition } from '../../types.js';

import { processReferenceIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'reference',
    interval: 24 * 60 * 60 * 1000,
    enabled: true,
    processor: processReferenceIngest,
  },
];
