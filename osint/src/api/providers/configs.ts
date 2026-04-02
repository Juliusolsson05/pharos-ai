import type { ProviderApiConfig } from './provider-helpers.js';

export const PROVIDER_CONFIGS: Record<string, ProviderApiConfig> = {
  aisstream:        { source: 'aisstream', rawModel: 'aisPosition', rawOrderField: 'lastSeen' },
  'cloudflare-radar': { source: 'cloudflare-radar', rawModel: 'cloudflareRadarOutage', rawOrderField: 'lastSeenAt' },
  eonet:            { source: 'eonet', rawModel: 'eonetEvent', rawOrderField: 'ingestedAt' },
  firms:            { source: 'firms', rawModel: 'firmsDetection', rawOrderField: 'ingestedAt' },
  gdelt:            { source: 'gdelt', rawModel: 'gdeltEvent', rawOrderField: 'ingestedAt' },
  'gdelt-gfg':      { source: 'gdelt-gfg', rawModel: 'gdeltFrontpage', rawOrderField: 'ingestedAt' },
  'gdelt-gkg':      { source: 'gdelt-gkg', rawModel: 'gkgRecord', rawOrderField: 'ingestedAt' },
  'gdelt-gqg':      { source: 'gdelt-gqg', rawModel: 'gdeltQuote', rawOrderField: 'ingestedAt' },
  'gdelt-mentions':  { source: 'gdelt-mentions', rawModel: 'gdeltMention', rawOrderField: 'ingestedAt' },
  gpsjam:           { source: 'gpsjam', rawModel: 'gpsjamHex', rawOrderField: 'seenAt' },
  mirta:            { source: 'mirta', rawModel: 'mirtaSite', rawOrderField: 'ingestedAt' },
  nga:              { source: 'nga', rawModel: 'ngaWarning', rawOrderField: 'ingestedAt' },
  opensky:          { source: 'opensky', rawModel: 'openskySighting', rawOrderField: 'seenAt' },
  oref:             { source: 'oref', rawModel: 'orefAlert', rawOrderField: 'ingestedAt' },
  overpass:         { source: 'overpass', rawModel: 'overpassInstallation', rawOrderField: 'ingestedAt' },
  ports:            { source: 'ports', rawModel: 'port', rawOrderField: 'ingestedAt' },
  'power-plants':    { source: 'power-plants', rawModel: 'powerPlant', rawOrderField: 'ingestedAt' },
  safecast:         { source: 'safecast', rawModel: 'safecastReading', rawOrderField: 'ingestedAt' },
  'submarine-cables': { source: 'submarine-cables', rawModel: 'submarineCable', rawOrderField: 'ingestedAt' },
  usgs:             { source: 'usgs', rawModel: 'usgsQuake', rawOrderField: 'occurredAt' },
};
