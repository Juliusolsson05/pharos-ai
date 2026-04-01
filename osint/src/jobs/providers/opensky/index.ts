import { config } from '../../../config.js';
import type { JobDefinition } from '../../types.js';

import { processOpenskyIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'opensky',
    interval: config.opensky.pollInterval,
    enabled: true,
    processor: processOpenskyIngest,
  },
];
