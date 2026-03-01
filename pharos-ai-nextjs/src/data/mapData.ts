export interface StrikeArc {
  id: string;
  from: [number, number]; // [lon, lat]
  to: [number, number];
  label: string;
  type: 'US_STRIKE' | 'ISRAEL_STRIKE' | 'NAVAL';
  severity: 'CRITICAL' | 'HIGH';
}

export interface MissileTrack {
  id: string;
  from: [number, number];
  to: [number, number];
  label: string;
  intercepted: boolean;
  severity: 'CRITICAL' | 'HIGH';
}

export interface Target {
  id: string;
  name: string;
  position: [number, number]; // [lon, lat]
  type: 'NUCLEAR' | 'MILITARY' | 'NAVAL' | 'INFRASTRUCTURE';
  status: 'DESTROYED' | 'DAMAGED' | 'TARGETED';
  description: string;
}

export interface Asset {
  id: string;
  name: string;
  position: [number, number];
  type: 'CARRIER' | 'AFB' | 'NAVAL_BASE' | 'ARMY_BASE';
  nation: 'US' | 'ISRAEL';
  description?: string;
}

export interface ThreatZone {
  id: string;
  name: string;
  coordinates: [number, number][];
  type: 'CLOSURE' | 'PATROL' | 'NFZ' | 'THREAT';
  color: [number, number, number, number];
}

export interface HeatPoint {
  position: [number, number];
  weight: number;
}

export const STRIKE_ARCS: StrikeArc[] = [
  { id: 's1', from: [72.4232, -7.3195], to: [50.5719, 34.8846], label: 'B-2 Strike: Diego Garcia → Fordow', type: 'US_STRIKE', severity: 'CRITICAL' },
  { id: 's2', from: [72.4232, -7.3195], to: [51.7260, 33.7243], label: 'B-2 Strike: Diego Garcia → Natanz', type: 'US_STRIKE', severity: 'CRITICAL' },
  { id: 's3', from: [72.4232, -7.3195], to: [51.6625, 32.4355], label: 'B-2 Strike: Diego Garcia → Isfahan', type: 'US_STRIKE', severity: 'CRITICAL' },
  { id: 's4', from: [72.4232, -7.3195], to: [51.7757, 35.5194], label: 'B-2 Strike: Diego Garcia → Parchin', type: 'US_STRIKE', severity: 'CRITICAL' },
  { id: 's5', from: [72.4232, -7.3195], to: [51.3347, 35.7219], label: 'B-2 Strike: Diego Garcia → IRGC HQ Tehran', type: 'US_STRIKE', severity: 'CRITICAL' },
  { id: 's6', from: [34.9408, 31.2083], to: [50.5719, 34.8846], label: 'IDF Strike: Nevatim → Fordow', type: 'ISRAEL_STRIKE', severity: 'CRITICAL' },
  { id: 's7', from: [34.9408, 31.2083], to: [51.7260, 33.7243], label: 'IDF Strike: Nevatim → Natanz', type: 'ISRAEL_STRIKE', severity: 'CRITICAL' },
  { id: 's8', from: [34.9408, 31.2083], to: [51.6625, 32.4355], label: 'IDF Strike: Nevatim → Isfahan', type: 'ISRAEL_STRIKE', severity: 'HIGH' },
  { id: 's9', from: [34.9408, 31.2083], to: [49.2310, 34.1902], label: 'IDF Strike: Nevatim → Arak Reactor', type: 'ISRAEL_STRIKE', severity: 'HIGH' },
  { id: 's10', from: [34.9408, 31.2083], to: [50.8858, 28.8308], label: 'IDF Strike: Nevatim → Bushehr', type: 'ISRAEL_STRIKE', severity: 'HIGH' },
  { id: 's11', from: [34.6667, 30.7761], to: [46.3600, 38.0800], label: 'IDF Strike: Ramon → Tabriz Missile Facility', type: 'ISRAEL_STRIKE', severity: 'HIGH' },
  { id: 's12', from: [34.6667, 30.7761], to: [48.6534, 35.2105], label: 'IDF Strike: Ramon → Shahid Nojeh AFB', type: 'ISRAEL_STRIKE', severity: 'HIGH' },
  { id: 's13', from: [58.0, 25.5], to: [56.2666, 27.1832], label: 'Naval Strike: USS Ford → IRGC Bandar Abbas', type: 'NAVAL', severity: 'HIGH' },
  { id: 's14', from: [58.0, 25.5], to: [50.3248, 29.2352], label: 'Naval Strike: USS Ford → Kharg Island', type: 'NAVAL', severity: 'HIGH' },
  { id: 's15', from: [51.3149, 25.1175], to: [51.4, 35.7], label: 'USAF Strike: Al Udeid → Tehran Radar', type: 'US_STRIKE', severity: 'HIGH' },
  { id: 's16', from: [54.5477, 24.2483], to: [51.5059, 35.7607], label: 'USAF Strike: Al Dhafra → Lavizan Complex', type: 'US_STRIKE', severity: 'HIGH' },
];

export const MISSILE_TRACKS: MissileTrack[] = [
  { id: 'm1', from: [51.4, 35.7], to: [34.7818, 32.0853], label: 'IRGC Ballistic: Tehran → Tel Aviv (Wave 1)', intercepted: true, severity: 'CRITICAL' },
  { id: 'm2', from: [51.4, 35.7], to: [34.8854, 31.9999], label: 'IRGC Ballistic: Tehran → Ben Gurion Airport', intercepted: true, severity: 'CRITICAL' },
  { id: 'm3', from: [51.4, 35.7], to: [35.1551, 30.9977], label: 'IRGC Ballistic: Tehran → Dimona (intercepted)', intercepted: true, severity: 'CRITICAL' },
  { id: 'm4', from: [48.6799, 31.3342], to: [50.5860, 26.2285], label: 'IRGC Ballistic: Ahvaz → NSA Bahrain (HIT)', intercepted: false, severity: 'CRITICAL' },
  { id: 'm5', from: [56.2666, 27.1832], to: [51.3149, 25.1175], label: 'IRGC Ballistic: Bandar Abbas → Al Udeid Qatar (HIT)', intercepted: false, severity: 'CRITICAL' },
  { id: 'm6', from: [56.2666, 27.1832], to: [54.5477, 24.2483], label: 'IRGC Ballistic: Bandar Abbas → Al Dhafra UAE (HIT)', intercepted: false, severity: 'HIGH' },
  { id: 'm7', from: [48.6799, 31.3342], to: [47.5186, 29.3467], label: 'IRGC Ballistic: Ahvaz → Ali Al Salem Kuwait (HIT)', intercepted: false, severity: 'HIGH' },
  { id: 'm8', from: [44.2066, 15.3694], to: [34.9408, 31.2083], label: 'Houthi Ballistic: Sanaa → Nevatim AFB (intercepted)', intercepted: true, severity: 'HIGH' },
  { id: 'm9', from: [42.9541, 14.7969], to: [44.0, 12.5], label: 'Houthi: Hodeidah → USS Eisenhower (intercepted)', intercepted: true, severity: 'HIGH' },
  { id: 'm10', from: [51.3890, 35.6840], to: [34.7818, 32.0853], label: 'IRGC Ballistic: Imam Ali Base → Tel Aviv (Wave 2)', intercepted: true, severity: 'CRITICAL' },
  { id: 'm11', from: [46.3600, 38.0800], to: [35.0018, 32.7940], label: 'IRGC Ballistic: Tabriz → Haifa (intercepted)', intercepted: true, severity: 'HIGH' },
  { id: 'm12', from: [48.6799, 31.3342], to: [47.5804, 24.0621], label: 'IRGC Ballistic: Ahvaz → Prince Sultan AB Saudi (HIT)', intercepted: false, severity: 'HIGH' },
];

export const TARGETS: Target[] = [
  { id: 't1', name: 'Fordow', position: [50.5719, 34.8846], type: 'NUCLEAR', status: 'DESTROYED', description: 'Underground U-235 enrichment, 14x GBU-57 MOPs' },
  { id: 't2', name: 'Natanz', position: [51.7260, 33.7243], type: 'NUCLEAR', status: 'DESTROYED', description: 'Primary enrichment complex, centrifuge halls collapsed' },
  { id: 't3', name: 'Isfahan Nuclear', position: [51.6625, 32.4355], type: 'NUCLEAR', status: 'DAMAGED', description: 'UCF and research reactors, partial structural damage' },
  { id: 't4', name: 'Parchin', position: [51.7757, 35.5194], type: 'MILITARY', status: 'DESTROYED', description: 'High explosive testing, suspected weaponization research' },
  { id: 't5', name: 'Arak IR-40', position: [49.2310, 34.1902], type: 'NUCLEAR', status: 'DESTROYED', description: 'Heavy water reactor, rendered inoperable' },
  { id: 't6', name: 'Bushehr Plant', position: [50.8858, 28.8308], type: 'NUCLEAR', status: 'DAMAGED', description: 'Power plant reactor damaged, IAEA inspection pending' },
  { id: 't7', name: 'IRGC HQ Tehran', position: [51.3347, 35.7219], type: 'MILITARY', status: 'DESTROYED', description: 'Supreme leader compound vicinity, Khamenei KIA confirmed' },
  { id: 't8', name: 'Imam Ali Missile Base', position: [51.3890, 35.6840], type: 'MILITARY', status: 'DESTROYED', description: 'Primary IRBM storage and launch facility' },
  { id: 't9', name: 'Shahid Nojeh AFB', position: [48.6534, 35.2105], type: 'MILITARY', status: 'DAMAGED', description: 'Iranian Air Force base, runways cratered' },
  { id: 't10', name: 'IRGC Bandar Abbas', position: [56.2666, 27.1832], type: 'NAVAL', status: 'DAMAGED', description: 'Fast boat fleet, 40% capacity degraded' },
  { id: 't11', name: 'Kharg Island', position: [50.3248, 29.2352], type: 'INFRASTRUCTURE', status: 'DAMAGED', description: '85% Iranian oil export capacity offline' },
  { id: 't12', name: 'Tabriz Missile Facility', position: [46.3600, 38.0800], type: 'MILITARY', status: 'DAMAGED', description: 'Long-range missile production facility' },
  { id: 't13', name: 'Lavizan-Shian', position: [51.5059, 35.7607], type: 'MILITARY', status: 'TARGETED', description: 'Suspected covert nuclear research complex' },
  { id: 't14', name: 'Imam Khomeini Airport', position: [51.1522, 35.4161], type: 'INFRASTRUCTURE', status: 'TARGETED', description: 'Partial closure, military logistics disrupted' },
  { id: 't15', name: 'IRGC Ahvaz', position: [48.6799, 31.3342], type: 'MILITARY', status: 'DAMAGED', description: 'Regional IRGC command, missile operations degraded' },
  { id: 't16', name: 'Isfahan Drone Base', position: [51.5, 32.5], type: 'MILITARY', status: 'DESTROYED', description: 'Shahid drone production and storage' },
  { id: 't17', name: 'Khamenei Compound', position: [51.4, 35.76], type: 'MILITARY', status: 'DESTROYED', description: 'Supreme Leader compound — confirmed KIA site' },
];

export const ALLIED_ASSETS: Asset[] = [
  { id: 'a1', name: 'USS Ford CVN-78', position: [58.0, 25.5], type: 'CARRIER', nation: 'US', description: 'CSG-12 · Gulf of Oman · F/A-18 sorties ongoing' },
  { id: 'a2', name: 'USS Eisenhower CVN-69', position: [44.0, 12.5], type: 'CARRIER', nation: 'US', description: 'CSG-2 · Red Sea / Gulf of Aden · Iron Dome maritime support' },
  { id: 'a3', name: 'USS Roosevelt CVN-71', position: [65.0, 21.0], type: 'CARRIER', nation: 'US', description: 'CSG-9 · North Arabian Sea · QRF posture' },
  { id: 'a4', name: 'Nevatim AFB', position: [34.9408, 31.2083], type: 'AFB', nation: 'ISRAEL' },
  { id: 'a5', name: 'Ramon AFB', position: [34.6667, 30.7761], type: 'AFB', nation: 'ISRAEL' },
  { id: 'a6', name: 'Palmachim AB', position: [34.6894, 31.8969], type: 'AFB', nation: 'ISRAEL' },
  { id: 'a7', name: 'Tel Nof AB', position: [34.8219, 31.8394], type: 'AFB', nation: 'ISRAEL' },
  { id: 'a8', name: 'Al Udeid AB Qatar', position: [51.3149, 25.1175], type: 'AFB', nation: 'US', description: 'USAF CENTCOM FWD HQ · 10,000 personnel · F-15E / A-10 / AWACS' },
  { id: 'a9', name: 'Al Dhafra AB UAE', position: [54.5477, 24.2483], type: 'AFB', nation: 'US', description: 'F-35A / F-22 operations · Struck by IRGC cruise missile · 1 US KIA' },
  { id: 'a10', name: 'Ali Al Salem AB Kuwait', position: [47.5186, 29.3467], type: 'ARMY_BASE', nation: 'US' },
  { id: 'a11', name: 'Prince Sultan AB', position: [47.5804, 24.0621], type: 'AFB', nation: 'US' },
  { id: 'a12', name: 'NSA Bahrain (5th Fleet)', position: [50.5860, 26.2285], type: 'NAVAL_BASE', nation: 'US', description: 'US 5th Fleet HQ · Struck by IRGC ballistic missile · 2 US KIA' },
  { id: 'a13', name: 'Diego Garcia', position: [72.4232, -7.3195], type: 'AFB', nation: 'US', description: 'USAF/USN BIOT · B-2 Spirit launch origin · ~7,000km from targets' },
  { id: 'a14', name: 'Al-Tanf Base Syria', position: [38.6, 33.5], type: 'ARMY_BASE', nation: 'US' },
  { id: 'a15', name: 'Ayn al-Asad Iraq', position: [42.4412, 33.7856], type: 'ARMY_BASE', nation: 'US' },
];

export const THREAT_ZONES: ThreatZone[] = [
  {
    id: 'z1',
    name: 'Strait of Hormuz Closure',
    coordinates: [[56.0, 26.7], [57.0, 26.5], [57.5, 26.0], [57.0, 25.5], [56.5, 25.6], [56.0, 26.0], [56.0, 26.7]],
    type: 'CLOSURE',
    color: [220, 50, 50, 80],
  },
  {
    id: 'z2',
    name: 'IRGC Persian Gulf Patrol',
    coordinates: [[50.0, 26.0], [56.0, 26.5], [57.5, 24.5], [55.0, 23.5], [51.0, 24.0], [50.0, 26.0]],
    type: 'PATROL',
    color: [220, 150, 50, 60],
  },
  {
    id: 'z3',
    name: 'Iran Declared NFZ',
    coordinates: [[44.0, 38.0], [48.0, 38.5], [52.0, 37.0], [54.0, 33.0], [52.0, 30.0], [48.0, 30.5], [44.0, 34.0], [44.0, 38.0]],
    type: 'NFZ',
    color: [220, 200, 50, 40],
  },
  {
    id: 'z4',
    name: 'Houthi Threat Corridor',
    coordinates: [[38.0, 28.0], [44.0, 28.0], [46.0, 20.0], [43.0, 11.0], [39.0, 12.0], [37.0, 18.0], [38.0, 28.0]],
    type: 'THREAT',
    color: [200, 50, 50, 50],
  },
];

export const HEAT_POINTS: HeatPoint[] = [
  // Fordow [50.5719, 34.8846] weight 1.0
  { position: [50.5719, 34.8846], weight: 1.0 },
  { position: [50.6219, 34.9146], weight: 1.0 },
  { position: [50.5219, 34.8546], weight: 0.9 },
  { position: [50.6019, 34.8546], weight: 0.95 },
  { position: [50.5419, 34.9246], weight: 0.85 },
  { position: [50.5919, 34.8246], weight: 0.9 },

  // Natanz [51.7260, 33.7243] weight 1.0
  { position: [51.7260, 33.7243], weight: 1.0 },
  { position: [51.7760, 33.7743], weight: 0.95 },
  { position: [51.6760, 33.6743], weight: 0.9 },
  { position: [51.7560, 33.6943], weight: 0.85 },
  { position: [51.6960, 33.7743], weight: 0.95 },
  { position: [51.7460, 33.7543], weight: 0.9 },

  // Isfahan [51.6625, 32.4355] weight 0.8
  { position: [51.6625, 32.4355], weight: 0.8 },
  { position: [51.7125, 32.4855], weight: 0.75 },
  { position: [51.6125, 32.3855], weight: 0.7 },
  { position: [51.6925, 32.4155], weight: 0.75 },
  { position: [51.6325, 32.4655], weight: 0.7 },

  // Tehran IRGC [51.3347, 35.7219] weight 0.7
  { position: [51.3347, 35.7219], weight: 0.7 },
  { position: [51.3847, 35.7719], weight: 0.65 },
  { position: [51.2847, 35.6719], weight: 0.6 },
  { position: [51.3647, 35.6919], weight: 0.65 },
  { position: [51.3047, 35.7419], weight: 0.6 },

  // Parchin [51.7757, 35.5194] weight 0.9
  { position: [51.7757, 35.5194], weight: 0.9 },
  { position: [51.8257, 35.5694], weight: 0.85 },
  { position: [51.7257, 35.4694], weight: 0.8 },
  { position: [51.8057, 35.4994], weight: 0.85 },
  { position: [51.7457, 35.5494], weight: 0.8 },
  { position: [51.7957, 35.5294], weight: 0.85 },

  // Bahrain NSA [50.5860, 26.2285] weight 0.5
  { position: [50.5860, 26.2285], weight: 0.5 },
  { position: [50.6360, 26.2785], weight: 0.45 },
  { position: [50.5360, 26.1785], weight: 0.4 },
  { position: [50.6060, 26.1985], weight: 0.45 },
  { position: [50.5660, 26.2585], weight: 0.4 },

  // Al Udeid [51.3149, 25.1175] weight 0.4
  { position: [51.3149, 25.1175], weight: 0.4 },
  { position: [51.3649, 25.1675], weight: 0.35 },
  { position: [51.2649, 25.0675], weight: 0.3 },
  { position: [51.3349, 25.0975], weight: 0.35 },

  // Bandar Abbas [56.2666, 27.1832] weight 0.6
  { position: [56.2666, 27.1832], weight: 0.6 },
  { position: [56.3166, 27.2332], weight: 0.55 },
  { position: [56.2166, 27.1332], weight: 0.5 },
  { position: [56.2966, 27.1532], weight: 0.55 },
  { position: [56.2466, 27.2132], weight: 0.5 },

  // Ahvaz [48.6799, 31.3342] weight 0.6
  { position: [48.6799, 31.3342], weight: 0.6 },
  { position: [48.7299, 31.3842], weight: 0.55 },
  { position: [48.6299, 31.2842], weight: 0.5 },
  { position: [48.7099, 31.3142], weight: 0.55 },
  { position: [48.6599, 31.3642], weight: 0.5 },
];
