'use client';

import { getAircraftIcon, getVesselIcon } from '@/features/map/lib/icons';

const AIRCRAFT_ITEMS = [
  { label: 'Aircraft / Friendly', icon: getAircraftIcon('friendly') },
  { label: 'Aircraft / Neutral', icon: getAircraftIcon('neutral') },
  { label: 'Aircraft / Hostile', icon: getAircraftIcon('hostile') },
  { label: 'Aircraft / Unknown', icon: getAircraftIcon('unknown') },
];

const VESSEL_ITEMS = [
  { label: 'Vessel / Military', icon: getVesselIcon(35, 'MILITARY') },
  { label: 'Vessel / Tanker', icon: getVesselIcon(82) },
  { label: 'Vessel / Cargo', icon: getVesselIcon(72) },
  { label: 'Vessel / General', icon: getVesselIcon(null) },
];

type LegendItem = {
  label: string;
  icon: { url: string; width: number; height: number };
};

function LegendRow({ item }: { item: LegendItem }) {
  return (
    <div className="legend-row">
      <div className="legend-icon-wrap">
        <img
          className="legend-icon"
          src={item.icon.url}
          width={item.icon.width}
          height={item.icon.height}
          alt={item.label}
        />
      </div>
      <div className="legend-label">{item.label}</div>
    </div>
  );
}

export function MapLegend() {
  return (
    <section className="legend-panel">
      <div className="legend-header">MILSYMBOL LEGEND</div>
      <div className="legend-copy">Aircraft uses the official air frame only. Vessel icons use official sea symbols.</div>
      {AIRCRAFT_ITEMS.map((item) => <LegendRow key={item.label} item={item} />)}
      {VESSEL_ITEMS.map((item) => <LegendRow key={item.label} item={item} />)}
    </section>
  );
}
