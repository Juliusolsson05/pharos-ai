import type { JobDefinition } from '../../types.js';

import { processTileMaskIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'tile-mask',
    interval: 0,
    enabled: false,
    processor: processTileMaskIngest,
  },
];
