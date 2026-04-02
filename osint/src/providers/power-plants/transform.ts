import type { PowerPlant } from './fetch.js';

type PlantCategory = 'NUCLEAR' | 'GAS' | 'OIL' | 'COAL' | 'HYDRO' | 'SOLAR' | 'WIND' | 'OTHER';

const FUEL_MAP: Record<string, PlantCategory> = {
  Nuclear: 'NUCLEAR',
  Gas: 'GAS',
  Oil: 'OIL',
  Coal: 'COAL',
  Hydro: 'HYDRO',
  Solar: 'SOLAR',
  Wind: 'WIND',
  Biomass: 'OTHER',
  Waste: 'OTHER',
  Geothermal: 'OTHER',
  Wave: 'OTHER',
  Tidal: 'OTHER',
  Petcoke: 'COAL',
  Cogeneration: 'GAS',
  Storage: 'OTHER',
};

function classifyFuel(fuel: string): PlantCategory {
  return FUEL_MAP[fuel] || 'OTHER';
}

function priorityForPlant(plant: PowerPlant): string {
  // Nuclear plants are always high priority
  if (plant.primaryFuel === 'Nuclear') return 'P1';
  // Large plants (>500MW) are notable
  if (plant.capacityMw >= 500) return 'P2';
  return 'P3';
}

export function buildPlantFeatures(plants: PowerPlant[]) {
  return plants.map((p) => ({
    id: `plant-${p.gppdIdnr}`,
    name: p.name,
    lat: p.lat,
    lon: p.lon,
    type: classifyFuel(p.primaryFuel),
    priority: priorityForPlant(p),
    country: p.countryCode,
    capacityMw: p.capacityMw,
    fuel: p.primaryFuel,
    owner: p.owner || null,
  }));
}
