import { config } from '../../../config.js';
import type { JobDefinition } from '../../types.js';

import { processOverpassIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'overpass',
    interval: config.overpass.pollInterval,
    enabled: true,
    processor: processOverpassIngest,
  },
];
