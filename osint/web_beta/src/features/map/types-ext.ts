export type NgaFeature = {
  id: string;
  navArea: string;
  msgYear: number;
  msgNumber: number;
  text: string;
  issueDate?: string | null;
};

export type OverpassFeature = {
  id: string;
  osmType: string;
  osmId: number;
  lat: number;
  lon: number;
  name?: string | null;
  nameEn?: string | null;
  military?: string | null;
  operator?: string | null;
  country?: string | null;
};

export type PortFeature = {
  id: string;
  wpiNumber: number;
  name: string;
  countryCode: string;
  lat: number;
  lon: number;
  harborSize?: string | null;
  hasOilTerminal: boolean;
  hasLngTerminal: boolean;
  hasContainer: boolean;
};

export type AisFeature = {
  id: string;
  mmsi: string;
  shipName?: string | null;
  lat: number;
  lon: number;
  speed?: number | null;
  heading?: number | null;
  shipType?: number | null;
};

export type CableFeature = {
  id: string;
  cableId: string;
  name: string;
  geometry: { type: string; coordinates: number[][][] };
};

export type LandingPointFeature = {
  id: string;
  landingPointId: string;
  name: string;
  lat: number;
  lon: number;
};

export type TileLayerInfo = {
  date: string;
  tileUrl: string;
  bounds: [number, number, number, number] | null;
  count: number;
};

export type NightlightsManifest = {
  daily: TileLayerInfo;
  snapshot: TileLayerInfo | null;
  minzoom: number;
  maxzoom: number;
  tileSize: number;
};

export type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
};

export type ProviderListResponse<T> = {
  source: string;
  total: number;
  limit: number;
  offset: number;
  items: T[];
};
