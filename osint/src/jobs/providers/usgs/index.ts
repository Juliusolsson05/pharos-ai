import { config } from '../../../config.js';
import type { JobDefinition } from '../../types.js';

import { processUsgsIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'usgs',
    interval: config.usgs.pollInterval,
    enabled: true,
    processor: processUsgsIngest,
  },
];
