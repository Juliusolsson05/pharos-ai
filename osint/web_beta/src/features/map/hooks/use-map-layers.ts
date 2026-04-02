'use client';

import { useMemo } from 'react';

import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import type { Layer } from '@deck.gl/core';
import { IconLayer, ScatterplotLayer } from '@deck.gl/layers';

import {
  getAircraftAffiliation,
  getAircraftIcon,
  getEonetIcon,
  getOverpassIcon,
  getPortIcon,
  getUsgsIcon,
  getVesselIcon,
} from '@/features/map/lib/icons';
import {
  classifyVessel,
  EVENT_ICON_PROPS,
  getEventIconSize,
  getOverpassIconSize,
  getReferenceIcon,
  getReferenceIconSize,
  getZoomMultiplier,
  MOBILE_ICON_PROPS,
  PORT_ICON_PROPS,
  referencePosition,
  SITE_ICON_PROPS,
} from '@/features/map/lib/layer-helpers';
import type { AisFeature, EonetFeature, FirmsFeature, GdeltFeature, OpenskyFeature, OverpassFeature, PortFeature, ReferenceFeature, UsgsFeature } from '@/features/map/types';
import type { LayerState } from '@/features/map/state/map-slice';

type LayerData = {
  reference: ReferenceFeature[]; gdelt: GdeltFeature[]; firms: FirmsFeature[];
  usgs: UsgsFeature[]; opensky: OpenskyFeature[]; eonet: EonetFeature[];
  overpass: OverpassFeature[]; ports: PortFeature[]; ais: AisFeature[];
};

type Props = { layers: LayerState; data: LayerData; zoom: number };

export function useMapLayers({ layers: enabled, data, zoom }: Props) {
  return useMemo(() => {
    const mobileScale = getZoomMultiplier(zoom, 'mobile');
    const siteScale = getZoomMultiplier(zoom, 'site');
    const eventScale = getZoomMultiplier(zoom, 'event');
    const portScale = getZoomMultiplier(zoom, 'port');

    return [
      enabled.firms && new HeatmapLayer<FirmsFeature>({
        id: 'firms',
        data: data.firms,
        pickable: true,
        getPosition: (d) => [d.longitude, d.latitude],
        getWeight: (d) => Math.max(1, d.frp),
        radiusPixels: 50,
        intensity: 1,
        threshold: 0.02,
        colorRange: [
          [255, 255, 178, 25], [254, 204, 92, 90], [253, 141, 60, 130],
          [240, 59, 32, 180], [189, 0, 38, 220],
        ],
      }),
      enabled.gdelt && new ScatterplotLayer<GdeltFeature>({
        id: 'gdelt',
        data: data.gdelt,
        pickable: true,
        radiusUnits: 'meters',
        getPosition: (d) => [d.actionGeoLon, d.actionGeoLat],
        getRadius: (d) => Math.max(9000, d.numMentions * 2200),
        getFillColor: (d) => d.avgTone < -5 ? [231, 106, 110, 180] : [236, 154, 60, 150],
        getLineColor: [255, 255, 255, 80],
        stroked: true,
        lineWidthMinPixels: 1,
      }),
      enabled.eonet && new IconLayer<EonetFeature>({
        id: 'eonet',
        data: data.eonet,
        pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: (d) => getEonetIcon(d.category),
        getSize: (d) => getEventIconSize(d) * eventScale,
        ...EVENT_ICON_PROPS,
      }),
      enabled.reference && new IconLayer<ReferenceFeature>({
        id: 'reference',
        data: data.reference.filter((d) => referencePosition(d) !== null),
        pickable: true,
        getPosition: (d) => referencePosition(d)!,
        getIcon: (d) => getReferenceIcon(d),
        getSize: (d) => getReferenceIconSize(d) * siteScale,
        ...SITE_ICON_PROPS,
      }),
      enabled.overpass && new IconLayer<OverpassFeature>({
        id: 'overpass',
        data: data.overpass,
        pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: (d) => getOverpassIcon(d.military),
        getSize: (d) => getOverpassIconSize(d) * siteScale,
        ...SITE_ICON_PROPS,
      }),
      enabled.ports && new IconLayer<PortFeature>({
        id: 'ports',
        data: data.ports,
        pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: (d) => getPortIcon(d),
        getSize: (d) => (d.harborSize === 'Large' ? 16 : d.harborSize === 'Medium' ? 13 : 10) * portScale,
        ...PORT_ICON_PROPS,
      }),
      enabled.ais && new IconLayer<AisFeature>({
        id: 'ais',
        data: data.ais,
        pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: (d) => getVesselIcon(d.shipType, classifyVessel(d)),
        getAngle: (d) => -(d.heading ?? 0),
        getSize: 8 * mobileScale,
        ...MOBILE_ICON_PROPS,
      }),
      enabled.usgs && new IconLayer<UsgsFeature>({
        id: 'usgs',
        data: data.usgs,
        pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: () => getUsgsIcon(),
        getSize: (d) => Math.max(12, Math.min(22, d.magnitude * 3.5)) * eventScale,
        ...EVENT_ICON_PROPS,
      }),
      enabled.opensky && new IconLayer<OpenskyFeature>({
        id: 'opensky',
        data: data.opensky,
        pickable: true,
        getPosition: (d) => [d.lon, d.lat],
        getIcon: (d) => getAircraftIcon(getAircraftAffiliation(d.milCountry)),
        getAngle: (d) => -(d.heading ?? 0),
        getSize: 7 * mobileScale,
        ...MOBILE_ICON_PROPS,
      }),
    ].filter(Boolean) as Layer[];
  }, [enabled, data, zoom]);
}

export { getTooltip } from '@/features/map/lib/tooltip';
