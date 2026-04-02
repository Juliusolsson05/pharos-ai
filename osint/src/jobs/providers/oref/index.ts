import { config } from '../../../config.js';
import type { JobDefinition } from '../../types.js';

import { processOrefIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'oref',
    interval: config.oref.pollInterval,
    enabled: true,
    processor: processOrefIngest,
  },
];
