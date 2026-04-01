import { config } from '../../../config.js';
import type { JobDefinition } from '../../types.js';

import { processGpsjamIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'gpsjam',
    interval: config.gpsjam.pollInterval,
    enabled: !!config.gpsjam.apiKey,
    processor: processGpsjamIngest,
  },
];
