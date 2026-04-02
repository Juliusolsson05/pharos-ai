import { config } from '../../../config.js';
import type { JobDefinition } from '../../types.js';

import { processFirmsIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'firms',
    interval: config.firms.pollInterval,
    workload: 'standard',
    enabled: !!config.firms.mapKey,
    processor: processFirmsIngest,
  },
];
