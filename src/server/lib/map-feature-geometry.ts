type LngLatPoint = [number, number];

type PointObject = {
  lat?: unknown;
  lng?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function normalizeLngLatPoint(value: unknown): LngLatPoint | null {
  if (Array.isArray(value) && value.length >= 2) {
    const [lng, lat] = value;
    return isFiniteNumber(lng) && isFiniteNumber(lat) ? [lng, lat] : null;
  }

  if (!value || typeof value !== 'object') return null;

  const point = value as PointObject;
  const lng = point.lng ?? point.longitude;
  const lat = point.lat ?? point.latitude;

  return isFiniteNumber(lng) && isFiniteNumber(lat) ? [lng, lat] : null;
}

export function normalizeKineticGeometry(value: unknown): { from: LngLatPoint; to: LngLatPoint } | null {
  if (!value || typeof value !== 'object') return null;

  const geometry = value as { from?: unknown; to?: unknown };
  const from = normalizeLngLatPoint(geometry.from);
  const to = normalizeLngLatPoint(geometry.to);

  return from && to ? { from, to } : null;
}

export function normalizePointGeometry(value: unknown): { position: LngLatPoint } | null {
  if (!value || typeof value !== 'object') return null;

  const geometry = value as { position?: unknown };
  const position = normalizeLngLatPoint(geometry.position);

  return position ? { position } : null;
}

export function normalizePolygonGeometry(value: unknown): { coordinates: LngLatPoint[] } | null {
  if (!value || typeof value !== 'object') return null;

  const geometry = value as { coordinates?: unknown };
  if (!Array.isArray(geometry.coordinates)) return null;

  const coordinates = geometry.coordinates
    .map(normalizeLngLatPoint)
    .filter((point): point is LngLatPoint => point !== null);

  return coordinates.length > 0 ? { coordinates } : null;
}
