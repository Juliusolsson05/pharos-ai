import type { GdeltRow, HeatPoint, ActorMeta } from '../../types.js';

// Sub-codes that map to kinetic strike events
const STRIKE_CODES = new Set(['193', '194']);

type Priority = 'P1' | 'P2' | 'P3';

function toPriority(avgTone: number): Priority {
  if (avgTone < -5) return 'P1';
  if (avgTone < -2) return 'P2';
  return 'P3';
}

function toSeverity(avgTone: number): 'CRITICAL' | 'HIGH' {
  return avgTone < -5 ? 'CRITICAL' : 'HIGH';
}

function parseDay(day: string): string {
  const y = day.slice(0, 4);
  const m = day.slice(4, 6);
  const d = day.slice(6, 8);
  return `${y}-${m}-${d}T00:00:00.000Z`;
}

// Intermediate type for DB storage — not the final API shape.
// GDELT only provides an impact point, so geometry is { position }.
// The API layer expands this to from/to when serving the frontend.
export type StrikeRecord = {
  id: string;
  sourceEventId: string;
  actor: string;
  priority: Priority;
  type: 'AIRSTRIKE';
  timestamp: string;
  position: [number, number];
  label: string;
  severity: 'CRITICAL' | 'HIGH';
};

export function buildStrikes(rows: GdeltRow[]): StrikeRecord[] {
  return rows
    .filter((r) => STRIKE_CODES.has(r.eventCode))
    .map((r) => ({
      id: `gdelt-strike-${r.globalEventId}`,
      sourceEventId: r.globalEventId,
      actor: r.actor1Name,
      priority: toPriority(r.avgTone),
      type: 'AIRSTRIKE' as const,
      timestamp: parseDay(r.day),
      position: [r.lon, r.lat] as [number, number],
      label: `${r.eventCode === '194' ? 'Air/Drone Strike' : 'Bombing'} — ${r.actor1Name}${r.actor2Name ? ` → ${r.actor2Name}` : ''}`,
      severity: toSeverity(r.avgTone),
    }));
}

export function buildHeatPoints(rows: GdeltRow[]): HeatPoint[] {
  return rows.map((r) => ({
    id: `gdelt-heat-${r.globalEventId}`,
    sourceEventId: r.globalEventId,
    actor: r.actor1Name,
    priority: toPriority(r.avgTone),
    position: [r.lon, r.lat] as [number, number],
    weight: Math.max(1, r.numMentions),
  }));
}

export function buildActorMeta(rows: GdeltRow[]): Record<string, ActorMeta> {
  const meta: Record<string, ActorMeta> = {};
  for (const r of rows) {
    if (!meta[r.actor1Name]) {
      meta[r.actor1Name] = {
        label: r.actor1Name,
        cssVar: 'var(--t3)',
        rgb: [143, 153, 168],
        affiliation: 'NEUTRAL',
        group: 'OSINT',
      };
    }
  }
  return meta;
}
