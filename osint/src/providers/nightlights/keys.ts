export function dailyTileKey(date: string, z: number, x: number, y: number) {
  return `nightlights/daily/${date}/z${z}/${x}/${y}.webp`;
}

export function snapshotTileKey(date: string, z: number, x: number, y: number) {
  return `nightlights/snapshots/${date}/z${z}/${x}/${y}.webp`;
}
