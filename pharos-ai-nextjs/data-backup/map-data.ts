import type {
  ActorKey,
  Priority,
  MarkerCategory,
  KineticType,
  KineticStatus,
  InstallationType,
  InstallationStatus,
  ZoneType,
} from '@/data/mapTokens';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type { ActorKey };

export type StrikeArc = {
  id:        string;
  actor:     ActorKey;
  priority:  Priority;
  category:  Extract<MarkerCategory, 'KINETIC'>;
  type:      Extract<KineticType, 'AIRSTRIKE' | 'NAVAL_STRIKE'>;
  status:    Extract<KineticStatus, 'COMPLETE'>;
  timestamp: string;                  // ISO-8601 UTC
  from:      [number, number];        // [lon, lat]
  to:        [number, number];
  label:     string;
  severity:  'CRITICAL' | 'HIGH';
};

export type MissileTrack = {
  id:        string;
  actor:     ActorKey;
  priority:  Priority;
  category:  Extract<MarkerCategory, 'KINETIC'>;
  type:      Extract<KineticType, 'BALLISTIC' | 'CRUISE' | 'DRONE'>;
  status:    Extract<KineticStatus, 'INTERCEPTED' | 'IMPACTED'>;
  timestamp: string;
  from:      [number, number];
  to:        [number, number];
  label:     string;
  severity:  'CRITICAL' | 'HIGH';
};

export type Target = {
  id:          string;
  actor:       ActorKey;
  priority:    Priority;
  category:    Extract<MarkerCategory, 'INSTALLATION'>;
  type:        InstallationType;
  status:      InstallationStatus;
  timestamp:   string;
  name:        string;
  position:    [number, number];     // [lon, lat]
  description: string;
};

export type Asset = {
  id:          string;
  actor:       ActorKey;
  priority:    Priority;
  category:    Extract<MarkerCategory, 'INSTALLATION'>;
  type:        Extract<InstallationType, 'CARRIER' | 'AIR_BASE' | 'NAVAL_BASE' | 'ARMY_BASE'>;
  status:      InstallationStatus;
  name:        string;
  position:    [number, number];
  description?: string;
};

export type ThreatZone = {
  id:          string;
  actor:       ActorKey;
  priority:    Priority;
  category:    Extract<MarkerCategory, 'ZONE'>;
  type:        ZoneType;
  name:        string;
  coordinates: [number, number][];
  color:       [number, number, number, number];
};

export type HeatPoint = {
  position: [number, number];
  weight:   number;
};

// ─── Strike arcs ─────────────────────────────────────────────────────────────

export const STRIKE_ARCS: StrikeArc[] = [
  { id: 's1',  actor: 'US',     priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:14:00Z', from: [72.4232, -7.3195], to: [50.5719, 34.8846], label: 'B-2 Strike: Diego Garcia → Fordow',             severity: 'CRITICAL' },
  { id: 's2',  actor: 'US',     priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:17:00Z', from: [72.4232, -7.3195], to: [51.7260, 33.7243], label: 'B-2 Strike: Diego Garcia → Natanz',             severity: 'CRITICAL' },
  { id: 's3',  actor: 'US',     priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:22:00Z', from: [72.4232, -7.3195], to: [51.6625, 32.4355], label: 'B-2 Strike: Diego Garcia → Isfahan',            severity: 'CRITICAL' },
  { id: 's4',  actor: 'US',     priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:35:00Z', from: [72.4232, -7.3195], to: [51.7757, 35.5194], label: 'B-2 Strike: Diego Garcia → Parchin',            severity: 'CRITICAL' },
  { id: 's5',  actor: 'US',     priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:14:00Z', from: [72.4232, -7.3195], to: [51.3347, 35.7219], label: 'B-2 Strike: Diego Garcia → IRGC HQ Tehran',     severity: 'CRITICAL' },
  { id: 's6',  actor: 'ISRAEL', priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:14:00Z', from: [34.9408, 31.2083], to: [50.5719, 34.8846], label: 'IDF Strike: Nevatim → Fordow',                  severity: 'CRITICAL' },
  { id: 's7',  actor: 'ISRAEL', priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:14:00Z', from: [34.9408, 31.2083], to: [51.7260, 33.7243], label: 'IDF Strike: Nevatim → Natanz',                  severity: 'CRITICAL' },
  { id: 's8',  actor: 'ISRAEL', priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:22:00Z', from: [34.9408, 31.2083], to: [51.6625, 32.4355], label: 'IDF Strike: Nevatim → Isfahan',                 severity: 'HIGH'     },
  { id: 's9',  actor: 'ISRAEL', priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:25:00Z', from: [34.9408, 31.2083], to: [49.2310, 34.1902], label: 'IDF Strike: Nevatim → Arak Reactor',            severity: 'HIGH'     },
  { id: 's10', actor: 'ISRAEL', priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:28:00Z', from: [34.9408, 31.2083], to: [50.8858, 28.8308], label: 'IDF Strike: Nevatim → Bushehr',                 severity: 'HIGH'     },
  { id: 's11', actor: 'ISRAEL', priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:14:00Z', from: [34.6667, 30.7761], to: [46.3600, 38.0800], label: 'IDF Strike: Ramon → Tabriz Missile Facility',   severity: 'HIGH'     },
  { id: 's12', actor: 'ISRAEL', priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:19:00Z', from: [34.6667, 30.7761], to: [48.6534, 35.2105], label: 'IDF Strike: Ramon → Shahid Nojeh AFB',          severity: 'HIGH'     },
  { id: 's13', actor: 'US',     priority: 'P2', category: 'KINETIC', type: 'NAVAL_STRIKE', status: 'COMPLETE', timestamp: '2026-03-01T07:30:00Z', from: [58.0,    25.5   ], to: [56.2666, 27.1832], label: 'Naval Strike: USS Ford → IRGC Bandar Abbas',    severity: 'HIGH'     },
  { id: 's14', actor: 'US',     priority: 'P2', category: 'KINETIC', type: 'NAVAL_STRIKE', status: 'COMPLETE', timestamp: '2026-03-01T07:45:00Z', from: [58.0,    25.5   ], to: [50.3248, 29.2352], label: 'Naval Strike: USS Ford → Kharg Island',         severity: 'HIGH'     },
  { id: 's15', actor: 'US',     priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:30:00Z', from: [51.3149, 25.1175], to: [51.4,    35.7   ], label: 'USAF Strike: Al Udeid → Tehran Radar',          severity: 'HIGH'     },
  { id: 's16', actor: 'US',     priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T02:30:00Z', from: [54.5477, 24.2483], to: [51.5059, 35.7607], label: 'USAF Strike: Al Dhafra → Lavizan Complex',      severity: 'HIGH'     },

  // ── Day 2 (March 1) — Verified strike arcs ─────────────────────────────────
  { id: 's17', actor: 'ISRAEL', priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T06:00:00Z', from: [34.9408, 31.2083], to: [51.42,   35.70  ], label: 'IDF Day 2: Nevatim → IRGC HQ Tehran (dozens of command centers)', severity: 'CRITICAL' },
  { id: 's18', actor: 'ISRAEL', priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T06:00:00Z', from: [34.9408, 31.2083], to: [51.45,   35.72  ], label: 'IDF Day 2: Nevatim → IRGC Intelligence HQ Tehran',              severity: 'CRITICAL' },
  { id: 's19', actor: 'ISRAEL', priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T06:30:00Z', from: [34.9408, 31.2083], to: [51.38,   35.74  ], label: 'IDF Day 2: Nevatim → IRGC Air Force Command Tehran',            severity: 'HIGH'     },
  { id: 's20', actor: 'ISRAEL', priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',    status: 'COMPLETE', timestamp: '2026-03-01T06:30:00Z', from: [34.9408, 31.2083], to: [51.40,   35.68  ], label: 'IDF Day 2: Nevatim → Internal Security HQ Tehran',             severity: 'HIGH'     },
  { id: 's21', actor: 'US',     priority: 'P2', category: 'KINETIC', type: 'NAVAL_STRIKE', status: 'COMPLETE', timestamp: '2026-03-01T05:00:00Z', from: [58.0,    25.5   ], to: [60.6223, 25.3467], label: 'Naval Day 2: USS Ford → IRGC Chabahar (Jamaran corvette sunk)',  severity: 'HIGH'     },
  { id: 's22', actor: 'US',     priority: 'P2', category: 'KINETIC', type: 'NAVAL_STRIKE', status: 'COMPLETE', timestamp: '2026-03-01T13:54:00Z', from: [59.5,    23.0   ], to: [56.2666, 27.1832], label: 'Naval Day 2: USS Lincoln → IRGC Naval HQ (largely destroyed)',   severity: 'HIGH'     },

  // ── Day 3 (March 2) — Verified strike arcs ─────────────────────────────────
  { id: 's23', actor: 'ISRAEL', priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE',  status: 'COMPLETE', timestamp: '2026-03-02T01:00:00Z', from: [34.9408, 31.2083], to: [35.5184, 33.8706], label: 'IDF Day 3: Nevatim → Hezbollah Dahieh, Beirut (31 killed)',      severity: 'CRITICAL' },
  { id: 's24', actor: 'ISRAEL', priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',  status: 'COMPLETE', timestamp: '2026-03-02T03:00:00Z', from: [34.9408, 31.2083], to: [35.5,    33.2   ], label: 'IDF Day 3: Nevatim → Hezbollah S.Lebanon (50 villages evacuated)', severity: 'HIGH'     },
  { id: 's25', actor: 'ISRAEL', priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',  status: 'COMPLETE', timestamp: '2026-03-02T03:00:00Z', from: [34.9408, 31.2083], to: [36.2,    34.0   ], label: 'IDF Day 3: Nevatim → Hezbollah Bekaa Valley',                    severity: 'HIGH'     },

  // ── Day 3 Evening (March 2 PM) — Heart of Tehran wave ──────────────────────
  { id: 's26', actor: 'ISRAEL', priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE',  status: 'COMPLETE', timestamp: '2026-03-02T14:00:00Z', from: [34.9408, 31.2083], to: [51.42,   35.70  ], label: 'IDF Day 3 PM: "Broad wave" strikes on "heart of Tehran"',           severity: 'CRITICAL' },
  { id: 's27', actor: 'ISRAEL', priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE',  status: 'COMPLETE', timestamp: '2026-03-02T23:00:00Z', from: [34.9408, 31.2083], to: [51.44,   35.79  ], label: 'IDF Day 3 Night: IRIB State Broadcaster HQ (Evin, Tehran)',        severity: 'CRITICAL' },
  { id: 's28', actor: 'US',     priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',  status: 'COMPLETE', timestamp: '2026-03-02T16:00:00Z', from: [51.3149, 25.1175], to: [45.8,    32.6   ], label: 'USAF Day 3: Al Udeid → Jurf al-Sakher PMF base, Iraq',            severity: 'HIGH'     },

  // ── Day 4 (March 3) — Continued strikes ────────────────────────────────────
  { id: 's29', actor: 'ISRAEL', priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE',  status: 'COMPLETE', timestamp: '2026-03-03T06:00:00Z', from: [34.9408, 31.2083], to: [51.68,   34.64  ], label: 'IDF Day 4: Assembly of Experts compound, Qom',                     severity: 'HIGH'     },
  { id: 's30', actor: 'ISRAEL', priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',  status: 'COMPLETE', timestamp: '2026-03-03T08:00:00Z', from: [34.9408, 31.2083], to: [35.5184, 33.8706], label: 'IDF Day 4: Continued Beirut southern suburbs strikes',             severity: 'HIGH'     },
  { id: 's31', actor: 'ISRAEL', priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE',  status: 'COMPLETE', timestamp: '2026-03-03T08:00:00Z', from: [34.9408, 31.2083], to: [35.30,   33.10  ], label: 'IDF Day 4: Ground ops + air strikes S. Lebanon buffer zone',       severity: 'HIGH'     },
];

// ─── Missile tracks ───────────────────────────────────────────────────────────

export const MISSILE_TRACKS: MissileTrack[] = [
  { id: 'm1',  actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'INTERCEPTED', timestamp: '2026-03-01T03:42:00Z', from: [51.4,    35.7   ], to: [34.7818, 32.0853], label: 'IRGC Ballistic: Tehran → Tel Aviv (Wave 1)',            severity: 'CRITICAL' },
  { id: 'm2',  actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'INTERCEPTED', timestamp: '2026-03-01T03:42:00Z', from: [51.4,    35.7   ], to: [34.8854, 31.9999], label: 'IRGC Ballistic: Tehran → Ben Gurion Airport',           severity: 'CRITICAL' },
  { id: 'm3',  actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'INTERCEPTED', timestamp: '2026-03-01T03:42:00Z', from: [51.4,    35.7   ], to: [35.1551, 30.9977], label: 'IRGC Ballistic: Tehran → Dimona (intercepted)',         severity: 'CRITICAL' },
  { id: 'm4',  actor: 'IRGC',   priority: 'P1', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED',    timestamp: '2026-03-01T03:47:00Z', from: [48.6799, 31.3342], to: [50.5860, 26.2285], label: 'IRGC Ballistic: Ahvaz → NSA Bahrain (HIT)',             severity: 'CRITICAL' },
  { id: 'm5',  actor: 'IRGC',   priority: 'P1', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED',    timestamp: '2026-03-01T03:49:00Z', from: [56.2666, 27.1832], to: [51.3149, 25.1175], label: 'IRGC Ballistic: Bandar Abbas → Al Udeid Qatar (HIT)',   severity: 'CRITICAL' },
  { id: 'm6',  actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED',    timestamp: '2026-03-01T03:52:00Z', from: [56.2666, 27.1832], to: [54.5477, 24.2483], label: 'IRGC Ballistic: Bandar Abbas → Al Dhafra UAE (HIT)',    severity: 'HIGH'     },
  { id: 'm7',  actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED',    timestamp: '2026-03-01T03:52:00Z', from: [48.6799, 31.3342], to: [47.5186, 29.3467], label: 'IRGC Ballistic: Ahvaz → Ali Al Salem Kuwait (HIT)',    severity: 'HIGH'     },
  { id: 'm8',  actor: 'HOUTHI', priority: 'P3', category: 'KINETIC', type: 'BALLISTIC', status: 'INTERCEPTED', timestamp: '2026-03-01T04:00:00Z', from: [44.2066, 15.3694], to: [34.9408, 31.2083], label: 'Houthi Ballistic: Sanaa → Nevatim AFB (intercepted)',   severity: 'HIGH'     },
  { id: 'm9',  actor: 'HOUTHI', priority: 'P3', category: 'KINETIC', type: 'BALLISTIC', status: 'INTERCEPTED', timestamp: '2026-03-01T04:00:00Z', from: [42.9541, 14.7969], to: [44.0,    12.5   ], label: 'Houthi: Hodeidah → USS Eisenhower (intercepted)',       severity: 'HIGH'     },
  { id: 'm10', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'INTERCEPTED', timestamp: '2026-03-01T04:30:00Z', from: [51.3890, 35.6840], to: [34.7818, 32.0853], label: 'IRGC Ballistic: Imam Ali Base → Tel Aviv (Wave 2)',     severity: 'CRITICAL' },
  { id: 'm11', actor: 'IRGC',   priority: 'P3', category: 'KINETIC', type: 'BALLISTIC', status: 'INTERCEPTED', timestamp: '2026-03-01T04:30:00Z', from: [46.3600, 38.0800], to: [35.0018, 32.7940], label: 'IRGC Ballistic: Tabriz → Haifa (intercepted)',          severity: 'HIGH'     },
  { id: 'm12', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED',    timestamp: '2026-03-01T03:52:00Z', from: [48.6799, 31.3342], to: [47.5804, 24.0621], label: 'IRGC Ballistic: Ahvaz → Prince Sultan AB Saudi (HIT)', severity: 'HIGH'     },

  // ── Day 2 (March 1) — Operation True Promise 4 waves ───────────────────────
  { id: 'm13', actor: 'IRGC',   priority: 'P1', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED', timestamp: '2026-03-01T13:00:00Z',    from: [51.4,    35.7   ], to: [34.9913, 31.7308], label: 'IRGC Day 2: Tehran → Beit Shemesh (HIT — 9 killed, synagogue destroyed)', severity: 'CRITICAL' },
  { id: 'm14', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED', timestamp: '2026-03-01T13:00:00Z',    from: [51.4,    35.7   ], to: [35.2137, 31.7683], label: 'IRGC Day 2: Tehran → Jerusalem highway (HIT — 3 injured)',            severity: 'HIGH'     },
  { id: 'm15', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'INTERCEPTED', timestamp: '2026-03-01T10:00:00Z', from: [51.4,    35.7   ], to: [34.8219, 31.8394], label: 'IRGC True Promise 4: Tehran → Tel Nof AB (intercepted)',             severity: 'HIGH'     },
  { id: 'm16', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'INTERCEPTED', timestamp: '2026-03-01T10:00:00Z', from: [51.4,    35.7   ], to: [34.7900, 32.0700], label: 'IRGC True Promise 4: Tehran → HaKirya IDF HQ Tel Aviv (intercepted)', severity: 'CRITICAL' },
  { id: 'm17', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'INTERCEPTED', timestamp: '2026-03-01T16:00:00Z', from: [51.4,    35.7   ], to: [59.5,    23.0   ], label: 'IRGC True Promise 4: → USS Abraham Lincoln (miss — "didn\'t even come close")', severity: 'CRITICAL' },
  { id: 'm18', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'DRONE',     status: 'INTERCEPTED', timestamp: '2026-03-01T12:00:00Z', from: [51.4,    35.7   ], to: [34.7818, 32.0853], label: 'IRGC Day 2: 50+ Shahed drones → Israel (IDF: all shot down)',       severity: 'HIGH'     },
  { id: 'm19', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED', timestamp: '2026-03-01T14:00:00Z',    from: [51.4,    35.7   ], to: [55.3281, 25.2048], label: 'IRGC Day 2: → Dubai (Fairmont The Palm hotel, airports)',            severity: 'HIGH'     },
  { id: 'm20', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED', timestamp: '2026-03-01T14:30:00Z',    from: [48.6799, 31.3342], to: [50.5750, 26.2150], label: 'IRGC Day 2: Ahvaz → Bahrain (Crowne Plaza Manama)',                 severity: 'HIGH'     },
  { id: 'm21', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED', timestamp: '2026-03-01T14:30:00Z',    from: [48.6799, 31.3342], to: [47.9800, 29.3300], label: 'IRGC Day 2: Ahvaz → Kuwait (Ali Al Salem — 3 US KIA)',              severity: 'CRITICAL' },
  { id: 'm22', actor: 'IRGC',   priority: 'P3', category: 'KINETIC', type: 'DRONE',     status: 'IMPACTED', timestamp: '2026-03-01T15:00:00Z',    from: [51.4,    35.7   ], to: [54.6500, 24.4500], label: 'IRGC Day 2: Drone debris → Abu Dhabi (Etihad Towers area)',         severity: 'HIGH'     },
  { id: 'm23', actor: 'IRGC',   priority: 'P3', category: 'KINETIC', type: 'DRONE',     status: 'IMPACTED', timestamp: '2026-03-01T15:00:00Z',    from: [51.4,    35.7   ], to: [54.5800, 24.4200], label: 'IRGC Day 2: → UAE (AWS data center struck, sparks & fire)',         severity: 'HIGH'     },
  { id: 'm24', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED', timestamp: '2026-03-01T16:00:00Z',    from: [56.2666, 27.1832], to: [56.3700, 26.1500], label: 'IRGC Day 2: → Tanker "Skylight" struck in Strait of Hormuz (fire)', severity: 'HIGH'     },
  { id: 'm25', actor: 'IRGC',   priority: 'P3', category: 'KINETIC', type: 'DRONE',     status: 'IMPACTED', timestamp: '2026-03-01T17:00:00Z',    from: [51.4,    35.7   ], to: [57.7088, 19.6686], label: 'IRGC Day 2: → Oman Duqm port (2 drones — first strike on Oman)',    severity: 'HIGH'     },
  { id: 'm26', actor: 'IRGC',   priority: 'P3', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED', timestamp: '2026-03-01T17:00:00Z',    from: [51.4,    35.7   ], to: [55.0271, 25.0157], label: 'IRGC Day 2: → Jebel Ali port Dubai (dark smoke over port)',         severity: 'HIGH'     },
  { id: 'm27', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED', timestamp: '2026-03-01T16:30:00Z',    from: [51.4,    35.7   ], to: [54.6510, 24.4430], label: 'IRGC Day 2: → Abu Dhabi airport (1 killed, 7 wounded)',             severity: 'HIGH'     },
  { id: 'm28', actor: 'IRGC',   priority: 'P3', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED', timestamp: '2026-03-01T17:00:00Z',    from: [48.6799, 31.3342], to: [51.5320, 25.2610], label: 'IRGC Day 2: → Doha industrial district (explosions, smoke)',          severity: 'HIGH'     },

  // ── Day 3 (March 2) — Verified missile/drone tracks ───────────────────────
  { id: 'm29', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'DRONE',     status: 'IMPACTED', timestamp: '2026-03-02T00:00:00Z',    from: [51.4,    35.7   ], to: [34.5833, 32.9889], label: 'Iran Day 3: Drone → RAF Akrotiri Cyprus (UK sovereign base struck)',  severity: 'CRITICAL' },
  { id: 'm30', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'DRONE',     status: 'IMPACTED', timestamp: '2026-03-02T07:30:00Z',    from: [51.4,    35.7   ], to: [50.1644, 26.6398], label: 'Iran Day 3: Drone → Ras Tanura refinery Saudi (Aramco shutdown)',      severity: 'CRITICAL' },
  { id: 'm31', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED', timestamp: '2026-03-02T06:00:00Z',    from: [48.6799, 31.3342], to: [47.9742, 29.3759], label: 'Iran Day 3: → Kuwait City area (smoke near US Embassy)',               severity: 'HIGH'     },

  // ── Day 3 evening / Day 4 missile tracks ────────────────────────────────────
  { id: 'm32', actor: 'IRGC',   priority: 'P1', category: 'KINETIC', type: 'DRONE',     status: 'IMPACTED', timestamp: '2026-03-03T04:00:00Z',    from: [51.4,    35.7   ], to: [46.6753, 24.6903], label: 'Iran Day 4: 2× Drone → US Embassy Riyadh (limited fire)',              severity: 'CRITICAL' },
  { id: 'm33', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'DRONE',     status: 'INTERCEPTED', timestamp: '2026-03-03T04:30:00Z', from: [51.4,    35.7   ], to: [46.72,   24.65  ], label: 'Iran Day 4: 8× Drones intercepted near Riyadh / Al-Kharj',            severity: 'HIGH'     },
  { id: 'm34', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'DRONE',     status: 'IMPACTED', timestamp: '2026-03-03T06:00:00Z',    from: [48.6799, 31.3342], to: [47.9742, 29.3759], label: 'Iran Day 4: Drone → US Embassy Kuwait City (targeted per Kuwait FM)',  severity: 'HIGH'     },
  { id: 'm35', actor: 'USIL',   priority: 'P1', category: 'KINETIC', type: 'CRUISE',  status: 'IMPACTED', timestamp: '2026-03-02T23:00:00Z',    from: [34.0,    29.0   ], to: [51.4246, 35.7948], label: 'US/IL Day 3: 4× bombs → IRIB State Broadcaster HQ, Evin, Tehran',    severity: 'CRITICAL' },
  { id: 'm36', actor: 'USIL',   priority: 'P1', category: 'KINETIC', type: 'CRUISE',  status: 'IMPACTED', timestamp: '2026-03-03T14:25:00Z',    from: [34.0,    29.0   ], to: [50.8826, 34.6416], label: 'US/IL Day 4: Strike → Assembly of Experts, Qom',                     severity: 'CRITICAL' },
  { id: 'm37', actor: 'USIL',   priority: 'P2', category: 'KINETIC', type: 'CRUISE',  status: 'IMPACTED', timestamp: '2026-03-02T20:00:00Z',    from: [34.0,    29.0   ], to: [51.42,   35.73  ], label: 'US/IL Day 3: Strike → Assembly of Experts, Tehran compound',          severity: 'HIGH'     },
  { id: 'm38', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'DRONE',     status: 'IMPACTED', timestamp: '2026-03-02T10:00:00Z',    from: [51.4,    35.7   ], to: [51.5333, 25.9333], label: 'Iran Day 3: Drones → Ras Laffan (QatarEnergy LNG shutdown)',          severity: 'CRITICAL' },
  { id: 'm39', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'DRONE',     status: 'IMPACTED', timestamp: '2026-03-02T10:00:00Z',    from: [51.4,    35.7   ], to: [51.5500, 24.9833], label: 'Iran Day 3: Drones → Mesaieed (QatarEnergy LNG shutdown)',            severity: 'CRITICAL' },
  { id: 'm40', actor: 'IRGC',   priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED', timestamp: '2026-03-03T12:00:00Z',    from: [51.4,    35.7   ], to: [34.85,   31.75  ], label: 'Iran Day 4: Ballistic → Central Israel (12 injured, Magen David Adom)', severity: 'HIGH'     },
  { id: 'm41', actor: 'IRGC',   priority: 'P3', category: 'KINETIC', type: 'DRONE',     status: 'INTERCEPTED', timestamp: '2026-03-03T09:00:00Z', from: [51.4,    35.7   ], to: [34.5833, 32.9889], label: 'Iran Day 4: 2× Drones intercepted → RAF Akrotiri, Cyprus (Cypriot forces)', severity: 'HIGH' },
];

// ─── Targets (Iranian installations) ─────────────────────────────────────────

export const TARGETS: Target[] = [
  { id: 't1',  actor: 'IRAN', priority: 'P1', category: 'INSTALLATION', type: 'NUCLEAR_SITE',   status: 'DESTROYED', timestamp: '2026-03-01T02:14:00Z', name: 'Fordow',              position: [50.5719, 34.8846], description: 'Underground U-235 enrichment, 14× GBU-57 MOPs' },
  { id: 't2',  actor: 'IRAN', priority: 'P1', category: 'INSTALLATION', type: 'NUCLEAR_SITE',   status: 'DESTROYED', timestamp: '2026-03-01T02:17:00Z', name: 'Natanz',              position: [51.7260, 33.7243], description: 'Primary enrichment complex, centrifuge halls collapsed' },
  { id: 't3',  actor: 'IRAN', priority: 'P2', category: 'INSTALLATION', type: 'NUCLEAR_SITE',   status: 'DAMAGED', timestamp: '2026-03-01T02:22:00Z', name: 'Isfahan Nuclear',     position: [51.6625, 32.4355], description: 'UCF and research reactors, partial structural damage' },
  { id: 't4',  actor: 'IRAN', priority: 'P2', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'DESTROYED', timestamp: '2026-03-01T02:35:00Z', name: 'Parchin',             position: [51.7757, 35.5194], description: 'High explosive testing, suspected weaponization research' },
  { id: 't5',  actor: 'IRAN', priority: 'P2', category: 'INSTALLATION', type: 'NUCLEAR_SITE',   status: 'DESTROYED', timestamp: '2026-03-01T02:25:00Z', name: 'Arak IR-40',          position: [49.2310, 34.1902], description: 'Heavy water reactor, rendered inoperable' },
  { id: 't6',  actor: 'IRAN', priority: 'P3', category: 'INSTALLATION', type: 'NUCLEAR_SITE',   status: 'DAMAGED', timestamp: '2026-03-01T02:28:00Z', name: 'Bushehr Plant',       position: [50.8858, 28.8308], description: 'Power plant reactor damaged, IAEA inspection pending' },
  { id: 't7',  actor: 'IRGC', priority: 'P1', category: 'INSTALLATION', type: 'COMMAND',        status: 'DESTROYED', timestamp: '2026-03-01T02:14:00Z', name: 'IRGC HQ Tehran',      position: [51.3347, 35.7219], description: 'Supreme leader compound vicinity, Khamenei KIA confirmed' },
  { id: 't8',  actor: 'IRGC', priority: 'P1', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'DESTROYED', timestamp: '2026-03-01T02:14:00Z', name: 'Imam Ali Missile Base', position: [51.3890, 35.6840], description: 'Primary IRBM storage and launch facility' },
  { id: 't9',  actor: 'IRAN', priority: 'P2', category: 'INSTALLATION', type: 'AIR_BASE',       status: 'DAMAGED', timestamp: '2026-03-01T02:19:00Z', name: 'Shahid Nojeh AFB',   position: [48.6534, 35.2105], description: 'Iranian Air Force base, runways cratered' },
  { id: 't10', actor: 'IRGC', priority: 'P2', category: 'INSTALLATION', type: 'NAVAL_BASE',     status: 'DAMAGED', timestamp: '2026-03-01T07:30:00Z', name: 'IRGC Bandar Abbas',   position: [56.2666, 27.1832], description: 'Fast boat fleet, 40% capacity degraded' },
  { id: 't11', actor: 'IRAN', priority: 'P2', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'DAMAGED', timestamp: '2026-03-01T07:45:00Z', name: 'Kharg Island',        position: [50.3248, 29.2352], description: '85% Iranian oil export capacity offline' },
  { id: 't12', actor: 'IRGC', priority: 'P2', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'DAMAGED', timestamp: '2026-03-01T02:14:00Z', name: 'Tabriz Missile Facility', position: [46.3600, 38.0800], description: 'Long-range missile production facility' },
  { id: 't13', actor: 'IRAN', priority: 'P3', category: 'INSTALLATION', type: 'COMMAND',        status: 'STRUCK', timestamp: '2026-03-01T02:30:00Z', name: 'Lavizan-Shian',       position: [51.5059, 35.7607], description: 'Suspected covert nuclear research complex' },
  { id: 't14', actor: 'IRAN', priority: 'P3', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'STRUCK', timestamp: '2026-03-01T03:00:00Z', name: 'Imam Khomeini Airport', position: [51.1522, 35.4161], description: 'Partial closure, military logistics disrupted' },
  { id: 't15', actor: 'IRGC', priority: 'P3', category: 'INSTALLATION', type: 'COMMAND',        status: 'DAMAGED', timestamp: '2026-03-01T02:30:00Z', name: 'IRGC Ahvaz',          position: [48.6799, 31.3342], description: 'Regional IRGC command, missile operations degraded' },
  { id: 't16', actor: 'IRAN', priority: 'P3', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'DESTROYED', timestamp: '2026-03-01T02:22:00Z', name: 'Isfahan Drone Base',  position: [51.5,    32.5   ], description: 'Shahid drone production and storage' },
  { id: 't17', actor: 'IRAN', priority: 'P1', category: 'INSTALLATION', type: 'COMMAND',        status: 'DESTROYED', timestamp: '2026-03-01T02:14:00Z', name: 'Khamenei Compound',   position: [51.4,    35.76  ], description: 'Supreme Leader compound — confirmed KIA site' },

  // ── Day 2 (March 1) — Verified targets ─────────────────────────────────────
  { id: 't18', actor: 'IRGC', priority: 'P1', category: 'INSTALLATION', type: 'COMMAND',        status: 'DESTROYED', timestamp: '2026-03-01T06:00:00Z', name: 'IRGC Intelligence HQ Tehran',   position: [51.45,   35.72  ], description: 'Day 2 — IDF struck intelligence headquarters near Gandhi St, hospital damaged nearby' },
  { id: 't19', actor: 'IRGC', priority: 'P1', category: 'INSTALLATION', type: 'COMMAND',        status: 'DESTROYED', timestamp: '2026-03-01T06:00:00Z', name: 'IRGC Air Force Command',        position: [51.38,   35.74  ], description: 'Day 2 — IDF struck IRGC Air Force command centers, HQ-9B air defense inactivated' },
  { id: 't20', actor: 'IRGC', priority: 'P1', category: 'INSTALLATION', type: 'COMMAND',        status: 'DESTROYED', timestamp: '2026-03-01T06:00:00Z', name: 'Internal Security HQ Tehran',    position: [51.40,   35.68  ], description: 'Day 2 — IDF struck internal security headquarters' },
  { id: 't21', actor: 'IRGC', priority: 'P2', category: 'INSTALLATION', type: 'NAVAL_BASE',     status: 'DESTROYED', timestamp: '2026-03-01T05:00:00Z', name: 'IRGC Chabahar Naval Base',       position: [60.6223, 25.3467], description: 'Day 2 — Jamaran-class corvette sunk at pier (CENTCOM confirmed + imagery), "Abandon ship"' },
  { id: 't22', actor: 'IRGC', priority: 'P1', category: 'INSTALLATION', type: 'NAVAL_BASE',     status: 'DESTROYED', timestamp: '2026-03-01T17:30:00Z', name: 'IRGC Naval Headquarters',        position: [56.28,   27.19  ], description: 'Day 2 — Trump: "largely destroyed." Total 9 warships sunk across fleet' },
  { id: 't23', actor: 'IRAN', priority: 'P2', category: 'INSTALLATION', type: 'COMMAND',        status: 'STRUCK', timestamp: '2026-03-01T08:00:00Z', name: 'Tehran Revolutionary Court',     position: [51.42,   35.69  ], description: 'Day 2 — Revolutionary Court building destroyed per OSINT/satellite' },
  { id: 't24', actor: 'IRAN', priority: 'P2', category: 'INSTALLATION', type: 'AIR_BASE',       status: 'STRUCK', timestamp: '2026-03-01T10:00:00Z', name: 'Iranian Air Force Runway',        position: [51.30,   35.65  ], description: 'Day 2 — IDF struck F-4 and F-5 fighter jets as they prepared for takeoff from runway' },

  // ── Day 3 (March 2) — Verified targets ─────────────────────────────────────
  { id: 't25', actor: 'IRAN', priority: 'P2', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'STRUCK', timestamp: '2026-03-02T07:30:00Z', name: 'Ras Tanura Refinery, Saudi Arabia',    position: [50.1644, 26.6398], description: 'Day 3 — Iranian drone strike, Aramco shutdown, 550K bbl/day offline' },
  { id: 't26', actor: 'IRAN', priority: 'P2', category: 'INSTALLATION', type: 'AIR_BASE',       status: 'STRUCK', timestamp: '2026-03-02T00:00:00Z', name: 'RAF Akrotiri, Cyprus (UK)',             position: [34.5833, 32.9889], description: 'Day 3 — Iranian drone struck UK sovereign base, no casualties, families evacuated' },
  { id: 't27', actor: 'IRAN', priority: 'P2', category: 'INSTALLATION', type: 'COMMAND',        status: 'STRUCK', timestamp: '2026-03-02T01:00:00Z', name: 'Hezbollah Dahieh, Beirut',              position: [35.5184, 33.8706], description: 'Day 3 — IDF struck Hezbollah stronghold, 31 killed, 149 wounded per Lebanon MoH' },
  { id: 't28', actor: 'IRAN', priority: 'P3', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'STRUCK', timestamp: '2026-03-02T03:00:00Z', name: 'Hezbollah S.Lebanon / Bekaa targets',  position: [35.5,    33.2   ], description: 'Day 3 — IDF struck positions, ~50 villages ordered evacuated' },

  // ── Day 3 evening / Day 4 (March 2 PM – March 3) — Verified targets ────────
  { id: 't29', actor: 'IRGC', priority: 'P1', category: 'INSTALLATION', type: 'COMMAND',        status: 'DESTROYED', timestamp: '2026-03-02T23:00:00Z', name: 'IRIB State Broadcaster HQ, Tehran',  position: [51.4246, 35.7948], description: 'Day 3 — IDF "struck and dismantled" IRIB in Evin district; 2 employees KIA incl IRINN editor-in-chief; 4 bombs hit' },
  { id: 't30', actor: 'IRGC', priority: 'P1', category: 'INSTALLATION', type: 'COMMAND',        status: 'STRUCK',    timestamp: '2026-03-03T14:25:00Z', name: 'Assembly of Experts, Qom',            position: [50.8826, 34.6416], description: 'Day 4 — Bombed; body appoints next Supreme Leader; Tasnim confirmed' },
  { id: 't31', actor: 'IRGC', priority: 'P2', category: 'INSTALLATION', type: 'COMMAND',        status: 'STRUCK',    timestamp: '2026-03-02T20:00:00Z', name: 'Assembly of Experts, Tehran',          position: [51.42,   35.73  ], description: 'Day 3 — Tehran compound struck; succession infrastructure targeted' },
  { id: 't32', actor: 'IRAN', priority: 'P2', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'STRUCK',    timestamp: '2026-03-03T04:00:00Z', name: 'US Embassy compound, Riyadh',          position: [46.6753, 24.6903], description: 'Day 4 — 2 Iranian drones hit; limited fire; building empty; first US embassy strike since Benghazi' },
  { id: 't33', actor: 'IRAN', priority: 'P2', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'STRUCK',    timestamp: '2026-03-03T06:00:00Z', name: 'US Embassy, Kuwait City',               position: [47.9742, 29.3759], description: 'Day 4 — "Targeted" by Iran per Kuwait FM; embassy closed until further notice' },
  { id: 't34', actor: 'IRAN', priority: 'P3', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'STRUCK',    timestamp: '2026-03-02T10:00:00Z', name: 'QatarEnergy Ras Laffan, Qatar',        position: [51.5333, 25.9333], description: 'Day 3 — Iranian drones hit; world\'s largest LNG hub; production halted; force majeure' },
  { id: 't35', actor: 'IRAN', priority: 'P3', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'STRUCK',    timestamp: '2026-03-02T10:00:00Z', name: 'QatarEnergy Mesaieed, Qatar',           position: [51.5500, 24.9833], description: 'Day 3 — Iranian drones hit; LNG production halted; ~30% of global LNG supply offline' },
];

// ─── Allied assets ────────────────────────────────────────────────────────────

export const ALLIED_ASSETS: Asset[] = [
  // ── Carrier Strike Groups — P1 ─────────────────────────────────────────────
  { id: 'a1',  actor: 'US',     priority: 'P1', category: 'INSTALLATION', type: 'CARRIER',    status: 'ACTIVE',  name: 'USS Ford CVN-78',        position: [58.0,    25.5   ], description: 'CSG-12 · Gulf of Oman · F/A-18 sorties ongoing' },
  { id: 'a2',  actor: 'US',     priority: 'P1', category: 'INSTALLATION', type: 'CARRIER',    status: 'ACTIVE',  name: 'USS Eisenhower CVN-69',  position: [44.0,    12.5   ], description: 'CSG-2 · Red Sea / Gulf of Aden · Iron Dome maritime support' },
  { id: 'a3',  actor: 'US',     priority: 'P1', category: 'INSTALLATION', type: 'CARRIER',    status: 'ACTIVE',  name: 'USS Abraham Lincoln CVN-72', position: [59.5, 23.0], description: 'CSG-3 · Gulf of Oman / Arabian Sea · Targeted by IRGC (miss) · Launching aircraft' },
  { id: 'a33', actor: 'US',     priority: 'P1', category: 'INSTALLATION', type: 'CARRIER',    status: 'ACTIVE',  name: 'USS Truman CVN-75',      position: [28.0,    34.5   ], description: 'CSG-8 · Eastern Mediterranean · F/A-18 SEAD/DEAD · Aegis BMD' },

  // ── IDF Air Bases — P1/P2 ─────────────────────────────────────────────────
  { id: 'a4',  actor: 'ISRAEL', priority: 'P1', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Nevatim AFB',            position: [34.9408, 31.2083] },
  { id: 'a5',  actor: 'ISRAEL', priority: 'P1', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Ramon AFB',              position: [34.6667, 30.7761] },
  { id: 'a6',  actor: 'ISRAEL', priority: 'P2', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Palmachim AB',           position: [34.6894, 31.8969] },
  { id: 'a7',  actor: 'ISRAEL', priority: 'P2', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Tel Nof AB',             position: [34.8219, 31.8394] },
  { id: 'a31', actor: 'ISRAEL', priority: 'P3', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Ramat David AFB',        position: [35.1795, 32.6653], description: 'F-16I Sufa · Haifa air defense corridor' },
  { id: 'a32', actor: 'ISRAEL', priority: 'P3', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Hatzor AFB',             position: [34.7231, 31.7605], description: 'F-16C/D · Strike and QRA mission' },

  // ── US Bases — Gulf (P1 = struck HQs, P2 = major, P3 = peripheral) ────────
  { id: 'a8',  actor: 'US',     priority: 'P1', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'STRUCK',  name: 'Al Udeid AB Qatar',      position: [51.3149, 25.1175], description: 'USAF CENTCOM FWD HQ · 10,000 personnel · Struck by IRGC missile' },
  { id: 'a9',  actor: 'US',     priority: 'P1', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'STRUCK',  name: 'Al Dhafra AB UAE',       position: [54.5477, 24.2483], description: 'F-35A / F-22 operations · Struck by IRGC cruise missile' },
  { id: 'a10', actor: 'US',     priority: 'P2', category: 'INSTALLATION', type: 'ARMY_BASE',  status: 'STRUCK',  name: 'Ali Al Salem AB Kuwait',  position: [47.5186, 29.3467], description: 'Struck — 3 US KIA (Army sustainment unit) · Also Italian troops stationed' },
  { id: 'a11', actor: 'US',     priority: 'P2', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'STRUCK',  name: 'Prince Sultan AB',       position: [47.5804, 24.0621] },
  { id: 'a12', actor: 'US',     priority: 'P1', category: 'INSTALLATION', type: 'NAVAL_BASE', status: 'STRUCK',  name: 'NSA Bahrain (5th Fleet)', position: [50.5860, 26.2285], description: 'US 5th Fleet HQ · Struck by IRGC missile · Smoke visible in video' },
  { id: 'a13', actor: 'US',     priority: 'P1', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Diego Garcia',           position: [72.4232, -7.3195], description: 'USAF/USN BIOT · B-2 Spirit launch origin · ~7,000km from targets' },
  { id: 'a14', actor: 'US',     priority: 'P3', category: 'INSTALLATION', type: 'ARMY_BASE',  status: 'ACTIVE',  name: 'Al-Tanf Base Syria',     position: [38.6,    33.5   ] },
  { id: 'a15', actor: 'US',     priority: 'P2', category: 'INSTALLATION', type: 'ARMY_BASE',  status: 'ACTIVE',  name: 'Ayn al-Asad Iraq',       position: [42.4412, 33.7856] },
  { id: 'a16', actor: 'US',     priority: 'P2', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Erbil Air Base',         position: [44.0901, 36.2337], description: 'USAF FOL · Iraqi Kurdistan · F-15E/AWACS ops' },
  { id: 'a17', actor: 'US',     priority: 'P2', category: 'INSTALLATION', type: 'ARMY_BASE',  status: 'ACTIVE',  name: 'Camp Arifjan',           position: [48.0400, 29.2000], description: '1st TSC HQ · Kuwait · ~20,000 US troops' },
  { id: 'a18', actor: 'US',     priority: 'P2', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Al Jaber AB',            position: [47.7886, 29.0925], description: 'USAF/KUAF joint · A-10C / F-16 rotational' },
  { id: 'a19', actor: 'US',     priority: 'P3', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Thumrait AB',            position: [54.0247, 17.6694], description: 'USAF FOL · Oman · B-52H staging, KC-135 tankers' },
  { id: 'a20', actor: 'US',     priority: 'P3', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Masirah Island AB',      position: [58.9033, 20.6681], description: 'USAF/USN · Oman · P-8A Poseidon maritime patrol' },
  { id: 'a21', actor: 'US',     priority: 'P3', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Camp Lemonnier',         position: [43.1471, 11.5466], description: 'AFRICOM primary · Djibouti · ~4,000 personnel · JSOC hub' },
  { id: 'a22', actor: 'US',     priority: 'P2', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Muwaffaq Salti AB',      position: [36.7922, 32.3566], description: 'USAF FOL · Jordan · F-22 / F-16 rotational' },
  { id: 'a23', actor: 'US',     priority: 'P3', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'King Faisal AB Tabuk',   position: [36.6189, 28.3654], description: 'USAF rotational · NW Saudi Arabia' },
  { id: 'a24', actor: 'US',     priority: 'P3', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'King Khalid AB Khamis',  position: [42.8000, 18.3000], description: 'USAF · Patriot battery + F-15C air defense cover' },
  { id: 'a25', actor: 'US',     priority: 'P3', category: 'INSTALLATION', type: 'NAVAL_BASE', status: 'ACTIVE',  name: 'Fujairah Naval Facility', position: [56.3394, 25.1217], description: 'USN fueling · Outside Strait of Hormuz' },

  // ── NATO Bases — P2/P3 ────────────────────────────────────────────────────
  { id: 'a26', actor: 'NATO',   priority: 'P2', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Incirlik AB',            position: [35.4259, 37.0021], description: 'USAF/NATO · Turkey · B61 nuclear store · ~1,500 US personnel' },
  { id: 'a27', actor: 'NATO',   priority: 'P2', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'RAF Akrotiri',           position: [32.9883, 34.5903], description: 'UK sovereign base · Cyprus · Typhoon FGR4 · Sentinel R1 ISR' },
  { id: 'a28', actor: 'NATO',   priority: 'P3', category: 'INSTALLATION', type: 'NAVAL_BASE', status: 'ACTIVE',  name: 'Souda Bay Naval Base',   position: [24.0739, 35.4935], description: 'US/NATO · Crete · DDG/CG port calls · P-8 Poseidon' },
  { id: 'a29', actor: 'NATO',   priority: 'P3', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'NAS Sigonella',          position: [14.9228, 37.4017], description: 'USAF/USN · Sicily · P-8A, MQ-4C Triton, C-17 logistics' },
  { id: 'a30', actor: 'NATO',   priority: 'P3', category: 'INSTALLATION', type: 'AIR_BASE',   status: 'ACTIVE',  name: 'Aviano AB',              position: [12.5978, 46.0313], description: 'USAF 31st FW · NE Italy · F-16C/D · Nuclear sharing DCA' },
];

// ─── Threat zones ─────────────────────────────────────────────────────────────

export const THREAT_ZONES: ThreatZone[] = [
  {
    id: 'z1', actor: 'IRGC', priority: 'P1', category: 'ZONE', type: 'CLOSURE', 
    name: 'Strait of Hormuz Closure',
    coordinates: [[56.0, 26.7], [57.0, 26.5], [57.5, 26.0], [57.0, 25.5], [56.5, 25.6], [56.0, 26.0], [56.0, 26.7]],
    color: [220, 50, 50, 80],
  },
  {
    id: 'z2', actor: 'IRGC', priority: 'P2', category: 'ZONE', type: 'PATROL', 
    name: 'IRGC Persian Gulf Patrol',
    coordinates: [[50.0, 26.0], [56.0, 26.5], [57.5, 24.5], [55.0, 23.5], [51.0, 24.0], [50.0, 26.0]],
    color: [220, 150, 50, 60],
  },
  {
    id: 'z3', actor: 'IRAN', priority: 'P2', category: 'ZONE', type: 'NFZ', 
    name: 'Iran Declared NFZ',
    coordinates: [[44.0, 38.0], [48.0, 38.5], [52.0, 37.0], [54.0, 33.0], [52.0, 30.0], [48.0, 30.5], [44.0, 34.0], [44.0, 38.0]],
    color: [220, 200, 50, 40],
  },
  {
    id: 'z4', actor: 'HOUTHI', priority: 'P3', category: 'ZONE', type: 'THREAT_CORRIDOR', 
    name: 'Houthi Threat Corridor',
    coordinates: [[38.0, 28.0], [44.0, 28.0], [46.0, 20.0], [43.0, 11.0], [39.0, 12.0], [37.0, 18.0], [38.0, 28.0]],
    color: [200, 50, 50, 50],
  },
];

// ─── Heat points (strike intensity overlay) ───────────────────────────────────

export const HEAT_POINTS: HeatPoint[] = [
  // Fordow cluster
  { position: [50.5719, 34.8846], weight: 1.0 }, { position: [50.6219, 34.9146], weight: 1.0 },
  { position: [50.5219, 34.8546], weight: 0.9 }, { position: [50.6019, 34.8546], weight: 0.95 },
  { position: [50.5419, 34.9246], weight: 0.85 }, { position: [50.5919, 34.8246], weight: 0.9 },
  // Natanz cluster
  { position: [51.7260, 33.7243], weight: 1.0 }, { position: [51.7760, 33.7743], weight: 0.95 },
  { position: [51.6760, 33.6743], weight: 0.9 }, { position: [51.7560, 33.6943], weight: 0.85 },
  { position: [51.6960, 33.7743], weight: 0.95 }, { position: [51.7460, 33.7543], weight: 0.9 },
  // Isfahan cluster
  { position: [51.6625, 32.4355], weight: 0.8 }, { position: [51.7125, 32.4855], weight: 0.75 },
  { position: [51.6125, 32.3855], weight: 0.7 }, { position: [51.6925, 32.4155], weight: 0.75 },
  { position: [51.6325, 32.4655], weight: 0.7 },
  // Tehran IRGC cluster
  { position: [51.3347, 35.7219], weight: 0.7 }, { position: [51.3847, 35.7719], weight: 0.65 },
  { position: [51.2847, 35.6719], weight: 0.6 }, { position: [51.3647, 35.6919], weight: 0.65 },
  { position: [51.3047, 35.7419], weight: 0.6 },
  // Parchin cluster
  { position: [51.7757, 35.5194], weight: 0.9 }, { position: [51.8257, 35.5694], weight: 0.85 },
  { position: [51.7257, 35.4694], weight: 0.8 }, { position: [51.8057, 35.4994], weight: 0.85 },
  { position: [51.7457, 35.5494], weight: 0.8 }, { position: [51.7957, 35.5294], weight: 0.85 },
  // Bahrain NSA cluster
  { position: [50.5860, 26.2285], weight: 0.5 }, { position: [50.6360, 26.2785], weight: 0.45 },
  { position: [50.5360, 26.1785], weight: 0.4 }, { position: [50.6060, 26.1985], weight: 0.45 },
  { position: [50.5660, 26.2585], weight: 0.4 },
  // Al Udeid cluster
  { position: [51.3149, 25.1175], weight: 0.4 }, { position: [51.3649, 25.1675], weight: 0.35 },
  { position: [51.2649, 25.0675], weight: 0.3 }, { position: [51.3349, 25.0975], weight: 0.35 },
  // Bandar Abbas cluster
  { position: [56.2666, 27.1832], weight: 0.6 }, { position: [56.3166, 27.2332], weight: 0.55 },
  { position: [56.2166, 27.1332], weight: 0.5 }, { position: [56.2966, 27.1532], weight: 0.55 },
  { position: [56.2466, 27.2132], weight: 0.5 },
  // Ahvaz cluster
  { position: [48.6799, 31.3342], weight: 0.6 }, { position: [48.7299, 31.3842], weight: 0.55 },
  { position: [48.6299, 31.2842], weight: 0.5 }, { position: [48.7099, 31.3142], weight: 0.55 },
  { position: [48.6599, 31.3642], weight: 0.5 },
  // Day 2: Tehran IRGC command cluster (intensified)
  { position: [51.42,   35.70  ], weight: 0.9 }, { position: [51.45,   35.72  ], weight: 0.85 },
  { position: [51.38,   35.74  ], weight: 0.8 }, { position: [51.40,   35.68  ], weight: 0.8 },
  { position: [51.43,   35.71  ], weight: 0.85 }, { position: [51.41,   35.73  ], weight: 0.8 },
  { position: [51.44,   35.69  ], weight: 0.75 }, { position: [51.39,   35.72  ], weight: 0.75 },
  // Day 2: Shahrak-e Gharb / Azadi area explosions
  { position: [51.35,   35.72  ], weight: 0.7 }, { position: [51.33,   35.70  ], weight: 0.65 },
  { position: [51.37,   35.71  ], weight: 0.7 },
  // Day 2: Chabahar naval cluster
  { position: [60.6223, 25.3467], weight: 0.8 }, { position: [60.67,   25.38  ], weight: 0.7 },
  { position: [60.58,   25.30  ], weight: 0.65 },
  // Day 2: Beit Shemesh impact
  { position: [34.9913, 31.7308], weight: 0.85 }, { position: [34.98,   31.73  ], weight: 0.7 },
  // Day 2: Dubai impacts
  { position: [55.3281, 25.2048], weight: 0.5 }, { position: [55.31,   25.20  ], weight: 0.45 },
  // Day 2: Ali Al Salem / Kuwait impacts
  { position: [47.5186, 29.3467], weight: 0.65 }, { position: [47.53,   29.35  ], weight: 0.55 },
  // Day 2: Jebel Ali port / Hormuz tanker / Oman Duqm
  { position: [55.0271, 25.0157], weight: 0.5 }, { position: [56.37,   26.15  ], weight: 0.6 },
  { position: [57.7088, 19.6686], weight: 0.4 },
  // Day 2: Abu Dhabi airport impact
  { position: [54.6510, 24.4430], weight: 0.55 }, { position: [54.64,   24.44  ], weight: 0.45 },
  // Day 2: Doha industrial district
  { position: [51.5320, 25.2610], weight: 0.45 },
  // Day 3: RAF Akrotiri Cyprus
  { position: [34.5833, 32.9889], weight: 0.6 },
  // Day 3: Ras Tanura refinery
  { position: [50.1644, 26.6398], weight: 0.7 }, { position: [50.17, 26.64], weight: 0.6 },
  // Day 3: Dahieh Beirut (Hezbollah strikes)
  { position: [35.5184, 33.8706], weight: 0.75 }, { position: [35.52, 33.87], weight: 0.65 },
  { position: [35.51, 33.86], weight: 0.6 },
  // Day 3: South Lebanon
  { position: [35.5, 33.2], weight: 0.55 }, { position: [35.48, 33.18], weight: 0.5 },
  // Day 3: Kuwait City / Embassy area
  { position: [47.9742, 29.3759], weight: 0.5 },
];
