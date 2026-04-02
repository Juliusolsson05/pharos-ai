export type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
};

export type ReferenceFeature = {
  featureKind: 'installation' | 'vessel';
  id: string;
  name: string;
  type: string;
  country: string;
  affiliation: string;
  hullNumber?: string | null;
  vesselClass?: string | null;
  operator?: string | null;
  strikeGroup?: string | null;
  airWing?: string | null;
  displacement?: number | null;
  personnel?: number | null;
  homePort?: string | null;
  status?: string | null;
  description?: string;
  lat?: number;
  lon?: number;
  typicalPatrolLat?: number | null;
  typicalPatrolLon?: number | null;
};

export type GdeltFeature = {
  id: string;
  actor1Name?: string | null;
  actor2Name?: string | null;
  eventCode: string;
  avgTone: number;
  numMentions: number;
  actionGeoLat: number;
  actionGeoLon: number;
  sourceUrl?: string | null;
};

export type FirmsFeature = {
  id: string;
  latitude: number;
  longitude: number;
  frp: number;
  confidence: string;
  acqDate: string;
  acqTime: string;
};

export type UsgsFeature = {
  id: string;
  eventId: string;
  place?: string | null;
  magnitude: number;
  lat: number;
  lon: number;
  depthKm: number;
  occurredAt: string | Date;
};

export type OpenskyFeature = {
  id: string;
  icao24: string;
  callsign?: string | null;
  lat: number;
  lon: number;
  baroAltitude?: number | null;
  velocity?: number | null;
  heading?: number | null;
  milOperator?: string | null;
  milCountry?: string | null;
};

export type EonetFeature = {
  id: string;
  eventId: string;
  origin: string;
  title: string;
  category: string;
  lat: number;
  lon: number;
  eventDate: string;
};

export type { NgaFeature, OverpassFeature, PortFeature, AisFeature } from './types-ext';
export type { CableFeature, LandingPointFeature } from './types-ext';
export type { TileLayerInfo, NightlightsManifest, ApiEnvelope, ProviderListResponse } from './types-ext';
