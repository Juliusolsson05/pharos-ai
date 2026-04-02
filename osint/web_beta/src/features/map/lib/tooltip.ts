import type {
  AisFeature,
  EonetFeature,
  GdeltFeature,
  OpenskyFeature,
  OverpassFeature,
  PortFeature,
  ReferenceFeature,
  UsgsFeature,
} from '@/features/map/types';

export function getTooltip({ layer, object }: { layer?: { id: string } | null; object?: unknown }) {
  if (!layer || !object) return null;

  if (layer.id === 'reference') {
    const d = object as ReferenceFeature;
    return { text: `${d.name}\n${d.type} · ${d.country}` };
  }
  if (layer.id === 'gdelt') {
    const d = object as GdeltFeature;
    return { text: `${d.actor1Name || 'Unknown'}\nEvent ${d.eventCode} · ${d.numMentions} mentions` };
  }
  if (layer.id === 'eonet') {
    const d = object as EonetFeature;
    return { text: `${d.title}\n${d.category} · ${d.origin}` };
  }
  if (layer.id === 'overpass') {
    const d = object as OverpassFeature;
    return { text: `${d.nameEn || d.name || 'Unknown'}\n${d.military || 'military'} · ${d.country || ''}` };
  }
  if (layer.id === 'ports') {
    const d = object as PortFeature;
    return { text: `${d.name}\n${d.harborSize || ''} port · ${d.countryCode}` };
  }
  if (layer.id === 'ais') {
    const d = object as AisFeature;
    return { text: `${d.shipName || d.mmsi}\nSpeed ${d.speed?.toFixed(1) || '?'} kn · hdg ${d.heading ?? '?'}°` };
  }
  if (layer.id === 'usgs') {
    const d = object as UsgsFeature;
    return { text: `${d.place || d.eventId}\nM${d.magnitude.toFixed(1)} · ${d.depthKm.toFixed(1)} km deep` };
  }
  if (layer.id === 'opensky') {
    const d = object as OpenskyFeature;
    return { text: `${d.callsign || d.icao24}\n${d.milOperator || 'unknown'} · ${d.milCountry || 'unknown'}` };
  }
  return null;
}
