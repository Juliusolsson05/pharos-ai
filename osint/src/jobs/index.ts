import type { JobProcessor } from './types.js';
import type { JobDefinition } from './types.js';

import { jobs as cloudflareRadarJobs } from './providers/cloudflare-radar/index.js';
import { jobs as eonetJobs } from './providers/eonet/index.js';
import { jobs as firmsJobs } from './providers/firms/index.js';
import { jobs as gdeltJobs } from './providers/gdelt/index.js';
import { jobs as gpsjamJobs } from './providers/gpsjam/index.js';
import { jobs as mirtaJobs } from './providers/mirta/index.js';
import { jobs as ngaJobs } from './providers/nga/index.js';
import { jobs as nightlightsJobs } from './providers/nightlights/index.js';
import { jobs as ogimJobs } from './providers/ogim/index.js';
import { jobs as openskyJobs } from './providers/opensky/index.js';
import { jobs as orefJobs } from './providers/oref/index.js';
import { jobs as overpassJobs } from './providers/overpass/index.js';
import { jobs as portsJobs } from './providers/ports/index.js';
import { jobs as powerPlantJobs } from './providers/power-plants/index.js';
import { jobs as referenceJobs } from './providers/reference/index.js';
import { jobs as safecastJobs } from './providers/safecast/index.js';
import { jobs as submarineCableJobs } from './providers/submarine-cables/index.js';
import { jobs as tileMaskJobs } from './providers/tile-mask/index.js';
import { jobs as ucdpJobs } from './providers/ucdp/index.js';
import { jobs as usgsJobs } from './providers/usgs/index.js';

const MANUAL_JOBS: JobDefinition[] = [
  ...tileMaskJobs,
];

export const SCHEDULED_JOBS: JobDefinition[] = [
  ...gdeltJobs,
  ...firmsJobs,
  ...overpassJobs,
  ...ngaJobs,
  ...usgsJobs,
  ...ucdpJobs,
  ...openskyJobs,
  ...gpsjamJobs,
  ...orefJobs,
  ...mirtaJobs,
  ...eonetJobs,
  ...safecastJobs,
  ...submarineCableJobs,
  ...cloudflareRadarJobs,
  ...nightlightsJobs,
  ...ogimJobs,
  ...portsJobs,
  ...powerPlantJobs,
  ...referenceJobs,
];

export const PROCESSORS: Record<string, JobProcessor> = {};

for (const job of [...SCHEDULED_JOBS, ...MANUAL_JOBS]) {
  if (PROCESSORS[job.name]) {
    throw new Error(`Duplicate job registration: ${job.name}`);
  }

  PROCESSORS[job.name] = job.processor;
}
