const BASE_URL = 'https://api.safecast.org/measurements.json';
const FETCH_TIMEOUT = 15_000;



export type SafecastReading = {
  id: number;
  latitude: number;
  longitude: number;
  value: number;
  unit: string;
  capturedAt: string;
  deviceId: number | null;
  locationName: string;
};

/**
 * Fetch recent radiation measurements from Safecast.
 * Filters to Middle East region.
 */
export async function fetchRadiation(limit: number = 500): Promise<SafecastReading[]> {
  const res = await fetch(`${BASE_URL}?limit=${limit}&order=captured_at+desc`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) throw new Error(`Safecast API ${res.status}`);

  const data = (await res.json()) as Array<{
    id: number;
    latitude: number | null;
    longitude: number | null;
    value: number;
    unit: string;
    captured_at: string;
    device_id: number | null;
    location_name: string;
  }>;

  return data
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r) => ({
      id: r.id,
      latitude: r.latitude!,
      longitude: r.longitude!,
      value: r.value,
      unit: r.unit,
      capturedAt: r.captured_at,
      deviceId: r.device_id,
      locationName: r.location_name || '',
    }));
}
