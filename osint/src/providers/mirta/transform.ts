import type { MirtaSite } from './fetch.js';
import { componentLabel } from './fetch.js';

type AssetType = 'AIR_BASE' | 'NAVAL_BASE' | 'ARMY_BASE';

function classifyType(site: MirtaSite): AssetType {
  const comp = site.reportingComponent.toLowerCase();
  const name = (site.siteName + ' ' + site.featureName).toLowerCase();

  if (comp === 'usaf' || comp === 'airnationalguard' || comp === 'afr') return 'AIR_BASE';
  if (comp === 'usn' || comp === 'usnr') return 'NAVAL_BASE';
  if (comp === 'usmc' || comp === 'usmcr') return 'NAVAL_BASE';

  if (name.includes('air') || name.includes('airfield') || name.includes('afb')) return 'AIR_BASE';
  if (name.includes('naval') || name.includes('navy') || name.includes('nas ')) return 'NAVAL_BASE';

  return 'ARMY_BASE';
}

export function buildInstallations(sites: MirtaSite[]) {
  return sites
    .filter((s) => s.operationalStatus === 'act')
    .map((s) => ({
      id: `mirta-${s.objectId}`,
      name: s.siteName || s.featureName,
      lat: s.lat,
      lon: s.lon,
      type: classifyType(s),
      operator: componentLabel(s.reportingComponent),
      country: s.countryName === 'usa' ? 'US' : s.countryName.toUpperCase(),
      state: s.stateCode,
      isJoint: s.isJointBase,
    }));
}
