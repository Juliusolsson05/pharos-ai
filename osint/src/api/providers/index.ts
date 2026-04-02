import type { Express } from 'express';

import aisstreamRouter from './aisstream/index.js';
import cloudflareRadarRouter from './cloudflare-radar/index.js';
import eonetRouter from './eonet/index.js';
import firmsRouter from './firms/index.js';
import gdeltRouter from './gdelt/index.js';
import gdeltGfgRouter from './gdelt-gfg/index.js';
import gdeltGkgRouter from './gdelt-gkg/index.js';
import gdeltGqgRouter from './gdelt-gqg/index.js';
import gdeltMentionsRouter from './gdelt-mentions/index.js';
import gpsjamRouter from './gpsjam/index.js';
import mirtaRouter from './mirta/index.js';
import ngaRouter from './nga/index.js';
import openskyRouter from './opensky/index.js';
import orefRouter from './oref/index.js';
import overpassRouter from './overpass/index.js';
import portsRouter from './ports/index.js';
import powerPlantsRouter from './power-plants/index.js';
import referenceRouter from './reference/index.js';
import safecastRouter from './safecast/index.js';
import submarineCablesRouter from './submarine-cables/index.js';
import ucdpRouter from './ucdp/index.js';
import usgsRouter from './usgs/index.js';

export function registerProviderRoutes(app: Express) {
  app.use('/api/providers/aisstream', aisstreamRouter);
  app.use('/api/providers/cloudflare-radar', cloudflareRadarRouter);
  app.use('/api/providers/eonet', eonetRouter);
  app.use('/api/providers/firms', firmsRouter);
  app.use('/api/providers/gdelt', gdeltRouter);
  app.use('/api/providers/gdelt-gfg', gdeltGfgRouter);
  app.use('/api/providers/gdelt-gkg', gdeltGkgRouter);
  app.use('/api/providers/gdelt-gqg', gdeltGqgRouter);
  app.use('/api/providers/gdelt-mentions', gdeltMentionsRouter);
  app.use('/api/providers/gpsjam', gpsjamRouter);
  app.use('/api/providers/mirta', mirtaRouter);
  app.use('/api/providers/nga', ngaRouter);
  app.use('/api/providers/opensky', openskyRouter);
  app.use('/api/providers/oref', orefRouter);
  app.use('/api/providers/overpass', overpassRouter);
  app.use('/api/providers/ports', portsRouter);
  app.use('/api/providers/power-plants', powerPlantsRouter);
  app.use('/api/providers/reference', referenceRouter);
  app.use('/api/providers/safecast', safecastRouter);
  app.use('/api/providers/submarine-cables', submarineCablesRouter);
  app.use('/api/providers/ucdp', ucdpRouter);
  app.use('/api/providers/usgs', usgsRouter);
}
