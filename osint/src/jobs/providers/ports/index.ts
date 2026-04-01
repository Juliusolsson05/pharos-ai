import type { JobDefinition } from '../../types.js';

import { processPortsIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'ports',
    interval: 30 * 24 * 60 * 60 * 1000,
    enabled: true,
    processor: processPortsIngest,
  },
];
