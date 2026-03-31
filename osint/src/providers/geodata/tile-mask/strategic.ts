// Strategically important locations — included even without population data

const STRATEGIC_POINTS: { name: string; lat: number; lon: number }[] = [
  { name: 'Strait of Hormuz', lat: 26.5, lon: 56.3 },
  { name: 'Suez Canal', lat: 30.5, lon: 32.3 },
  { name: 'Bab el-Mandeb', lat: 12.6, lon: 43.3 },
  { name: 'Strait of Malacca', lat: 2.5, lon: 101.5 },
  { name: 'Panama Canal', lat: 9.1, lon: -79.7 },
  { name: 'Taiwan Strait', lat: 24.5, lon: 119.0 },
  { name: 'Strait of Gibraltar', lat: 36.0, lon: -5.3 },
  { name: 'Bosphorus', lat: 41.0, lon: 29.0 },
  { name: 'Strait of Tiran', lat: 28.0, lon: 34.5 },
  { name: 'Kharg Island', lat: 29.2, lon: 50.3 },
];

export function getStrategicTiles(z: number = 8): Set<string> {
  const n = 2 ** z;
  const tiles = new Set<string>();
  for (const p of STRATEGIC_POINTS) {
    const x = Math.floor(((p.lon + 180) / 360) * n);
    const latRad = (p.lat * Math.PI) / 180;
    const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
    tiles.add(`${x},${y}`);
  }
  return tiles;
}
