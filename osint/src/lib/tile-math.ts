export type TileCoord = {
  z: number;
  x: number;
  y: number;
};

export function tileBounds(x: number, y: number, z: number) {
  const n = 2 ** z;
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  const north = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const south = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;
  return { south, north, west, east };
}

export function latLonToTile(lat: number, lon: number, z: number) {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

export function parentTile(x: number, y: number, z: number): TileCoord {
  if (z <= 0) {
    throw new Error(`Cannot compute parent tile for z=${z}`);
  }

  return {
    z: z - 1,
    x: Math.floor(x / 2),
    y: Math.floor(y / 2),
  };
}
