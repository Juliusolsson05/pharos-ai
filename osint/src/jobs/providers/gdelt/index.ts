import { config } from '../../../config.js';
import type { JobDefinition } from '../../types.js';

import { processGdeltIngest } from './ingest.js';
import { processGfgIngest } from './ingest-gfg.js';
import { processGkgIngest } from './ingest-gkg.js';
import { processGqgIngest } from './ingest-gqg.js';
import { processMentionsIngest } from './ingest-mentions.js';

export const jobs: JobDefinition[] = [
  {
    name: 'gdelt',
    interval: config.gdelt.pollInterval,
    enabled: true,
    processor: processGdeltIngest,
  },
  {
    name: 'gdelt-gkg',
    interval: config.gdelt.pollInterval,
    enabled: true,
    processor: processGkgIngest,
  },
  {
    name: 'gdelt-mentions',
    interval: config.gdelt.pollInterval,
    enabled: true,
    processor: processMentionsIngest,
  },
  {
    name: 'gdelt-gqg',
    interval: 5 * 60 * 1000,
    enabled: true,
    processor: processGqgIngest,
  },
  {
    name: 'gdelt-gfg',
    interval: 60 * 60 * 1000,
    enabled: true,
    processor: processGfgIngest,
  },
];
