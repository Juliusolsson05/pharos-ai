import type { JobDefinition } from '../../types.js';

import { processSubmarineCablesIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'submarine-cables',
    interval: 7 * 24 * 60 * 60 * 1000,
    enabled: true,
    processor: processSubmarineCablesIngest,
  },
];
