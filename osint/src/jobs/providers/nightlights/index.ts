import { config } from '../../../config.js';
import type { JobDefinition } from '../../types.js';

import { processNightlightsDailyIngest } from './ingest-daily.js';
import { processNightlightsSnapshotIngest } from './ingest-snapshot.js';

export const jobs: JobDefinition[] = [
  {
    name: 'nightlights-daily',
    interval: config.nightlights.pollInterval,
    enabled: true,
    processor: processNightlightsDailyIngest,
  },
  {
    name: 'nightlights-snapshot',
    interval: config.nightlights.snapshotInterval,
    enabled: true,
    processor: processNightlightsSnapshotIngest,
  },
];
