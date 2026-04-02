import { config } from '../../../config.js';
import type { JobDefinition } from '../../types.js';

import { processOpenskyIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'opensky',
    interval: config.opensky.pollInterval,
    workload: 'realtime',
    enabled: true,
    processor: processOpenskyIngest,
  },
];
