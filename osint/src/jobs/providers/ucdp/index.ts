import { config } from '../../../config.js';
import type { JobDefinition } from '../../types.js';

import { processUcdpIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'ucdp',
    interval: config.ucdp.pollInterval,
    enabled: true,
    processor: processUcdpIngest,
  },
];
