export interface MapStory {
  id: string;
  title: string;
  tagline: string;
  icon: string; // single emoji
  category: 'STRIKE' | 'RETALIATION' | 'NAVAL' | 'INTEL' | 'DIPLOMATIC';
  narrative: string; // 2-3 sentence AI analysis
  highlightStrikeIds: string[]; // IDs from STRIKE_ARCS
  highlightMissileIds: string[]; // IDs from MISSILE_TRACKS
  highlightTargetIds: string[]; // IDs from TARGETS
  highlightAssetIds: string[]; // IDs from ALLIED_ASSETS
  viewState: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  keyFacts: string[]; // 3-4 bullet facts
  timestamp: string; // ISO when this pattern emerged
}

export const MAP_STORIES: MapStory[] = [
  {
    id: 'b2-sortie',
    title: 'The Long Arm: B-2 Spirit Sortie',
    tagline: 'Diego Garcia to Iranian heartland — 7,000km each way',
    icon: '✈',
    category: 'STRIKE',
    narrative:
      'Five B-2 Spirit stealth bombers launched from Diego Garcia (BIOT) carrying 14 GBU-57 Massive Ordnance Penetrators — the only conventional weapon capable of destroying hardened underground facilities like Fordow. The round-trip mission exceeded 14,000km, requiring multiple aerial refuelings over the Indian Ocean. This represents the longest combat strike mission in US Air Force history.',
    highlightStrikeIds: ['s1', 's2', 's3', 's4', 's5'],
    highlightMissileIds: [],
    highlightTargetIds: ['t1', 't2', 't3', 't4', 't5'],
    highlightAssetIds: ['a13'],
    viewState: { longitude: 62.0, latitude: 14.0, zoom: 3.5 },
    keyFacts: [
      '5x B-2 Spirit stealth bombers deployed',
      '14x GBU-57 Massive Ordnance Penetrators used',
      'Fordow, Natanz, Parchin, Arak all confirmed destroyed',
      '14,000km round trip — longest combat strike in USAF history',
    ],
    timestamp: '2026-03-01T02:00:00Z',
  },
  {
    id: 'nuclear-kill-chain',
    title: 'Nuclear Kill Chain',
    tagline: "Iran's entire nuclear program neutralized in 4 hours",
    icon: '☢',
    category: 'STRIKE',
    narrative:
      "In a coordinated 4-hour window, the United States and Israel systematically struck every significant node of Iran's nuclear program. Fordow's underground centrifuge halls — buried 80m under a mountain — were destroyed by GBU-57 MOPs. Natanz's A-hall, B-hall and advanced centrifuge workshops were obliterated. The Arak IR-40 heavy water reactor, Bushehr power plant, and Isfahan's UCF were simultaneously hit. IAEA Director General Rafael Grossi called it 'the most consequential event in nuclear non-proliferation history.'",
    highlightStrikeIds: ['s1', 's2', 's3', 's6', 's7', 's8', 's9', 's10'],
    highlightMissileIds: [],
    highlightTargetIds: ['t1', 't2', 't3', 't5', 't6', 't16'],
    highlightAssetIds: ['a4', 'a13'],
    viewState: { longitude: 51.5, latitude: 33.5, zoom: 5.5 },
    keyFacts: [
      'All 6 major nuclear facilities struck simultaneously',
      'Fordow destroyed — 14x GBU-57 MOPs penetrated 80m of rock',
      'IAEA emergency session called by Russia and China',
      "Iran's breakout capability estimated at 25+ years to rebuild",
    ],
    timestamp: '2026-03-01T03:00:00Z',
  },
  {
    id: 'hormuz-gambit',
    title: 'The Hormuz Gambit',
    tagline: '20% of global oil supply choked — markets in freefall',
    icon: '⚓',
    category: 'NAVAL',
    narrative:
      "Within hours of the strikes, IRGC Navy forces moved to close the Strait of Hormuz — the chokepoint through which 20% of global oil supply transits daily. Over 200 vessels anchored at the strait's approaches as IRGC fast boats and sea mines created an exclusion zone. Brent crude surged 35% in pre-market trading. USS Gerald R. Ford's strike group responded with Tomahawk strikes on IRGC naval facilities at Bandar Abbas.",
    highlightStrikeIds: ['s13', 's14'],
    highlightMissileIds: [],
    highlightTargetIds: ['t10', 't11'],
    highlightAssetIds: ['a1', 'a12'],
    viewState: { longitude: 57.0, latitude: 27.0, zoom: 6.0 },
    keyFacts: [
      'Strait of Hormuz formally closed to commercial traffic',
      "200+ vessels anchored — Lloyd's of London war risk premium +400%",
      'Oil surged 35% — Brent crude hit $147/barrel',
      'USS Gerald R. Ford CSG engaged IRGC naval forces',
    ],
    timestamp: '2026-03-01T06:00:00Z',
  },
  {
    id: 'three-front-retaliation',
    title: 'Three-Front Retaliation',
    tagline: 'Iran strikes US bases across 5 Gulf nations simultaneously',
    icon: '🎯',
    category: 'RETALIATION',
    narrative:
      "Iran's retaliation was calibrated to maximize US casualties across multiple fronts simultaneously — a deliberate strategy to force American withdrawal from the region. Within 90 minutes of the initial strikes, IRGC ballistic missiles hit NSA Bahrain (2 US KIA), Al Udeid Qatar (1 US KIA), Al Dhafra UAE (wounded), Prince Sultan AB Saudi Arabia, and Ali Al Salem Kuwait. The coordinated salvo demonstrated Iran had pre-planned targeting packages for all US bases in theater.",
    highlightStrikeIds: [],
    highlightMissileIds: ['m4', 'm5', 'm6', 'm7', 'm12'],
    highlightTargetIds: [],
    highlightAssetIds: ['a8', 'a9', 'a10', 'a11', 'a12'],
    viewState: { longitude: 51.5, latitude: 26.0, zoom: 5.0 },
    keyFacts: [
      '5 US bases hit in simultaneous IRGC salvo',
      'NSA Bahrain: 2 US KIA — 5th Fleet HQ struck',
      'Al Udeid Qatar: 1 US KIA — CENTCOM FWD HQ struck',
      'Iran pre-planned targeting packages for all regional US bases',
    ],
    timestamp: '2026-03-01T03:30:00Z',
  },
  {
    id: 'carrier-corridor',
    title: 'Three-Carrier Corridor',
    tagline: 'Largest US naval concentration in the Gulf since 2003',
    icon: '🚢',
    category: 'NAVAL',
    narrative:
      'The United States positioned three carrier strike groups in a 3,000km arc from the Red Sea to the Arabian Sea — the largest US naval concentration in the Middle East since the 2003 Iraq invasion. USS Gerald R. Ford (CVN-78) in the Gulf of Oman provided the primary strike platform. USS Dwight D. Eisenhower (CVN-69) in the Red Sea provided ballistic missile defense coverage for Israel. USS Theodore Roosevelt (CVN-71) in the Arabian Sea served as the quick reaction force.',
    highlightStrikeIds: [],
    highlightMissileIds: [],
    highlightTargetIds: [],
    highlightAssetIds: ['a1', 'a2', 'a3'],
    viewState: { longitude: 57.0, latitude: 20.0, zoom: 4.0 },
    keyFacts: [
      '3 carrier strike groups — CVN-78, CVN-69, CVN-71',
      'Combined air wing: ~250 F/A-18, F-35C aircraft',
      'Largest US naval presence in region since 2003',
      'CSGs positioned to cover Red Sea, Gulf of Oman, Arabian Sea',
    ],
    timestamp: '2026-02-28T18:00:00Z',
  },
  {
    id: 'khamenei-last-hours',
    title: "Khamenei's Last Hours",
    tagline: 'Supreme Leader killed — regime decapitated in 90 minutes',
    icon: '💀',
    category: 'INTEL',
    narrative:
      "Intelligence suggests Khamenei was in his reinforced compound in northern Tehran when B-2-delivered bunker busters struck at 02:14 local time. Iranian state media initially denied his death, but IRGC commanders began communicating via emergency protocols within 20 minutes of the strike — a pattern consistent with loss of central command. At 06:47 local time, IRNA confirmed: 'The Supreme Leader has been martyred.' Iranians took to the streets of Tehran in celebration within hours.",
    highlightStrikeIds: ['s5'],
    highlightMissileIds: [],
    highlightTargetIds: ['t7', 't8', 't17'],
    highlightAssetIds: ['a13'],
    viewState: { longitude: 51.4, latitude: 35.7, zoom: 9.0 },
    keyFacts: [
      'Khamenei killed at 02:14 local time — compound struck by B-2',
      'IRGC emergency comms pattern detected within 20 mins of strike',
      'IRNA confirmed death at 06:47 — 4.5 hours after strike',
      "Iranians celebrate in Tehran streets — 'regime decapitation' achieved",
    ],
    timestamp: '2026-03-01T06:47:00Z',
  },
  {
    id: 'idf-deep-strike',
    title: 'IDF Deep Strike Package',
    tagline: 'Israeli Air Force strikes deepest into Iran ever recorded',
    icon: '⚡',
    category: 'STRIKE',
    narrative:
      "The Israeli Air Force conducted the most ambitious strike package in its history, with F-35I Adir jets flying 1,800km into Iran to strike Tabriz missile production facilities in Iran's northwest — well beyond any previous IDF operation. Simultaneously, F-15I Ra'am aircraft hit Shahid Nojeh AFB and the Natanz/Isfahan/Fordow nuclear cluster. The operation, codenamed Operation Roaring Lion, was synchronized to the minute with US B-2 strikes to overwhelm Iranian air defenses.",
    highlightStrikeIds: ['s6', 's7', 's8', 's9', 's10', 's11', 's12'],
    highlightMissileIds: [],
    highlightTargetIds: ['t1', 't2', 't3', 't9', 't12'],
    highlightAssetIds: ['a4', 'a5', 'a6', 'a7'],
    viewState: { longitude: 42.0, latitude: 34.0, zoom: 5.0 },
    keyFacts: [
      'F-35I Adir jets struck Tabriz — 1,800km from Israeli bases',
      'Deepest IDF strike ever recorded — surpasses 1981 Osirak',
      'Operation Roaring Lion synchronized to-the-minute with US B-2s',
      '7 nuclear/military sites neutralized by IDF alone',
    ],
    timestamp: '2026-03-01T02:00:00Z',
  },
];
