import { config } from '../../../config.js';
import type { JobDefinition } from '../../types.js';

import { processCloudflareRadarIngest } from './ingest.js';

export const jobs: JobDefinition[] = [
  {
    name: 'cloudflare-radar',
    interval: config.cloudflareRadar.pollInterval,
    enabled: !!config.cloudflareRadar.token,
    processor: processCloudflareRadarIngest,
  },
];
