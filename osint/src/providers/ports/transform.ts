import type { Port } from './fetch.js';

type PortCategory = 'COMMERCIAL_PORT' | 'NAVAL_PORT' | 'OIL_TERMINAL' | 'LNG_TERMINAL' | 'CONTAINER_PORT';

function classifyPort(port: Port): PortCategory {
  if (port.hasLngTerminal) return 'LNG_TERMINAL';
  if (port.hasOilTerminal) return 'OIL_TERMINAL';
  if (port.hasContainer) return 'CONTAINER_PORT';

  const name = (port.name + ' ' + port.alternateName).toLowerCase();
  if (name.includes('naval') || name.includes('navy') || name.includes('military')) return 'NAVAL_PORT';

  return 'COMMERCIAL_PORT';
}

function priorityForSize(size: string): string {
  switch (size) {
    case 'Large': return 'P1';
    case 'Medium': return 'P2';
    case 'Small': return 'P3';
    default: return 'P3';
  }
}

export function buildPortFeatures(ports: Port[]) {
  return ports.map((p) => ({
    id: `port-${p.wpiNumber}`,
    name: p.name,
    lat: p.lat,
    lon: p.lon,
    type: classifyPort(p),
    priority: priorityForSize(p.harborSize),
    country: p.countryCode,
    harborSize: p.harborSize,
    maxDepth: Math.max(
      p.channelDepth ?? 0,
      p.cargoPierDepth ?? 0,
      p.anchorageDepth ?? 0,
    ) || null,
  }));
}
