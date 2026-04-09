/**
 * Provider licensing metadata.
 *
 * This is the source of truth for what each data source allows commercially.
 * Jobs and routes should check this before enabling providers in production.
 */

export type LicenseClass = 'open' | 'attribution' | 'noncommercial' | 'restricted' | 'unknown';

export type ProviderLicense = {
  source: string;
  licenseClass: LicenseClass;
  commercialAllowed: boolean;
  requiresAttribution: boolean;
  defaultEnabledInProd: boolean;
  notes: string;
};

export const PROVIDER_LICENSES: ProviderLicense[] = [
  // ─── Open / public domain ────────────────────────────────
  { source: 'gdelt',             licenseClass: 'attribution',    commercialAllowed: true,  requiresAttribution: true,  defaultEnabledInProd: true,  notes: 'Custom open-access. Must cite GDELT Project + link to gdeltproject.org.' },
  { source: 'gdelt-gkg',        licenseClass: 'attribution',    commercialAllowed: true,  requiresAttribution: true,  defaultEnabledInProd: true,  notes: 'Same as GDELT.' },
  { source: 'gdelt-mentions',   licenseClass: 'attribution',    commercialAllowed: true,  requiresAttribution: true,  defaultEnabledInProd: true,  notes: 'Same as GDELT.' },
  { source: 'gdelt-gqg',        licenseClass: 'attribution',    commercialAllowed: true,  requiresAttribution: true,  defaultEnabledInProd: true,  notes: 'Same as GDELT.' },
  { source: 'gdelt-gfg',        licenseClass: 'attribution',    commercialAllowed: true,  requiresAttribution: true,  defaultEnabledInProd: true,  notes: 'Same as GDELT.' },
  { source: 'firms',            licenseClass: 'open',           commercialAllowed: true,  requiresAttribution: false, defaultEnabledInProd: true,  notes: 'NASA CC0. Attribution requested but not required.' },
  { source: 'usgs',             licenseClass: 'open',           commercialAllowed: true,  requiresAttribution: false, defaultEnabledInProd: true,  notes: 'US public domain + CC0 internationally.' },
  { source: 'eonet',            licenseClass: 'open',           commercialAllowed: true,  requiresAttribution: false, defaultEnabledInProd: true,  notes: 'NASA CC0 (EONET) + EU CC BY 4.0 (GDACS).' },
  { source: 'nga',              licenseClass: 'open',           commercialAllowed: true,  requiresAttribution: false, defaultEnabledInProd: true,  notes: 'US public domain.' },
  { source: 'mirta',            licenseClass: 'open',           commercialAllowed: true,  requiresAttribution: false, defaultEnabledInProd: true,  notes: 'US public domain.' },
  { source: 'overpass',         licenseClass: 'attribution',    commercialAllowed: true,  requiresAttribution: true,  defaultEnabledInProd: true,  notes: 'ODbL. Must attribute OpenStreetMap contributors.' },
  { source: 'ports',            licenseClass: 'open',           commercialAllowed: true,  requiresAttribution: false, defaultEnabledInProd: true,  notes: 'NGA US public domain.' },
  { source: 'power-plants',     licenseClass: 'attribution',    commercialAllowed: true,  requiresAttribution: true,  defaultEnabledInProd: true,  notes: 'WRI CC BY 4.0.' },
  { source: 'reference',        licenseClass: 'open',           commercialAllowed: true,  requiresAttribution: false, defaultEnabledInProd: true,  notes: 'Internally curated from public sources.' },
  { source: 'nightlights-daily', licenseClass: 'open',          commercialAllowed: true,  requiresAttribution: false, defaultEnabledInProd: true,  notes: 'NASA CC0.' },
  { source: 'nightlights-snapshot', licenseClass: 'open',       commercialAllowed: true,  requiresAttribution: false, defaultEnabledInProd: true,  notes: 'NASA CC0.' },
  { source: 'safecast',         licenseClass: 'open',           commercialAllowed: true,  requiresAttribution: false, defaultEnabledInProd: true,  notes: 'CC0.' },

  // ─── Attribution required, commercial OK ─────────────────
  { source: 'ucdp',             licenseClass: 'attribution',    commercialAllowed: true,  requiresAttribution: true,  defaultEnabledInProd: false, notes: 'CC BY 4.0. Requires citation. Currently blocked — needs access token.' },

  // ─── Restricted / noncommercial ──────────────────────────
  { source: 'opensky',          licenseClass: 'restricted',     commercialAllowed: false, requiresAttribution: true,  defaultEnabledInProd: false, notes: 'Non-profit research/education only. Commercial use requires written permission.' },
  { source: 'cloudflare-radar', licenseClass: 'noncommercial',  commercialAllowed: false, requiresAttribution: true,  defaultEnabledInProd: false, notes: 'CC BY-NC 4.0. No commercial use without permission from radar@cloudflare.com.' },
  { source: 'gpsjam',           licenseClass: 'restricted',     commercialAllowed: false, requiresAttribution: false, defaultEnabledInProd: false, notes: 'Wingbits B2B license required for commercial use. LLM restriction clause.' },
  { source: 'submarine-cables', licenseClass: 'restricted',     commercialAllowed: false, requiresAttribution: false, defaultEnabledInProd: false, notes: 'TeleGeography raw geocoded data requires paid license. Map visuals are CC BY-SA 4.0.' },
  { source: 'aisstream',        licenseClass: 'unknown',        commercialAllowed: false, requiresAttribution: false, defaultEnabledInProd: false, notes: 'No published terms. Beta service. Contact via GitHub issues.' },
  { source: 'oref',             licenseClass: 'unknown',        commercialAllowed: false, requiresAttribution: false, defaultEnabledInProd: false, notes: 'Israeli state copyright. No explicit open-data license. API geo-blocks non-Israeli IPs.' },
  { source: 'ogim',             licenseClass: 'attribution',    commercialAllowed: true,  requiresAttribution: true,  defaultEnabledInProd: false, notes: 'CC BY 4.0. Requires GDAL (ogr2ogr) for processing.' },
];

export function getProviderLicense(source: string): ProviderLicense | undefined {
  return PROVIDER_LICENSES.find((p) => p.source === source);
}

export function isCommercialSafe(source: string): boolean {
  const license = getProviderLicense(source);
  return license?.commercialAllowed ?? false;
}

export function getProductionProviders(): string[] {
  return PROVIDER_LICENSES.filter((p) => p.defaultEnabledInProd).map((p) => p.source);
}

export function getRestrictedProviders(): string[] {
  return PROVIDER_LICENSES.filter((p) => !p.commercialAllowed).map((p) => p.source);
}
