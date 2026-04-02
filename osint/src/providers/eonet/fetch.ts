const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';
const GDACS_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP';
const FETCH_TIMEOUT = 20_000;

export type EonetEvent = {
  id: string;
  title: string;
  category: string;
  lat: number;
  lon: number;
  date: string;
  sourceUrl: string;
  origin: 'eonet' | 'gdacs';
};

/**
 * Fetch active natural events from NASA EONET.
 */
export async function fetchEonet(days: number = 30): Promise<EonetEvent[]> {
  const res = await fetch(`${EONET_URL}?status=open&days=${days}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });

  if (!res.ok) throw new Error(`EONET API ${res.status}`);

  const data = (await res.json()) as {
    events: Array<{
      id: string;
      title: string;
      categories: Array<{ id: string; title: string }>;
      geometry: Array<{ date: string; type: string; coordinates: number[] }>;
      sources: Array<{ url: string }>;
    }>;
  };

  const events: EonetEvent[] = [];

  for (const e of data.events || []) {
    const geo = e.geometry?.[e.geometry.length - 1]; // latest position
    if (!geo?.coordinates) continue;

    const [lon, lat] = geo.coordinates;
    if (!isFinite(lat) || !isFinite(lon)) continue;

    events.push({
      id: e.id,
      title: e.title,
      category: e.categories?.[0]?.title || 'Unknown',
      lat,
      lon,
      date: geo.date || '',
      sourceUrl: e.sources?.[0]?.url || '',
      origin: 'eonet',
    });
  }

  return events;
}

/**
 * Fetch global disaster alerts from GDACS.
 */
export async function fetchGdacs(): Promise<EonetEvent[]> {
  try {
    const res = await fetch(GDACS_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      features?: Array<{
        properties: Record<string, unknown>;
        geometry: { coordinates: number[] };
      }>;
    };

    const events: EonetEvent[] = [];

    for (const f of data.features || []) {
      const props = f.properties;
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;

      const [lon, lat] = coords;
      if (!isFinite(lat) || !isFinite(lon)) continue;

      events.push({
        id: `gdacs-${props.eventid || props.alertid || ''}`,
        title: String(props.name || props.eventname || ''),
        category: String(props.eventtype || props.type || 'Unknown'),
        lat,
        lon,
        date: String(props.fromdate || props.datemodified || ''),
        sourceUrl: String(props.url || ''),
        origin: 'gdacs',
      });
    }

    return events;
  } catch {
    return []; // GDACS is flaky, don't fail the job
  }
}
