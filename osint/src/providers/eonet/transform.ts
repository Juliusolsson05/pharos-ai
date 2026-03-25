import type { EonetEvent } from './fetch.js';
import type { HeatPoint } from '../../types.js';

const CATEGORY_WEIGHT: Record<string, number> = {
  'Earthquakes': 30,
  'Volcanoes': 50,
  'Wildfires': 10,
  'Severe Storms': 20,
  'Floods': 15,
  'EQ': 30,
  'TC': 40,
  'VO': 50,
  'FL': 15,
  'WF': 10,
};

export function buildHeatPoints(events: EonetEvent[]): HeatPoint[] {
  return events.map((e) => ({
    id: `natural-${e.id}`,
    sourceEventId: e.id,
    actor: e.category,
    priority: CATEGORY_WEIGHT[e.category] >= 30 ? 'P1' : CATEGORY_WEIGHT[e.category] >= 15 ? 'P2' : 'P3',
    position: [e.lon, e.lat] as [number, number],
    weight: CATEGORY_WEIGHT[e.category] || 10,
  }));
}
