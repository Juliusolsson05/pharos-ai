import { config } from '../../../config.js';
import type { JobDefinition } from '../../types.js';

import { processNgaIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'nga',
    interval: config.nga.pollInterval,
    enabled: true,
    processor: processNgaIngest,
  },
];
