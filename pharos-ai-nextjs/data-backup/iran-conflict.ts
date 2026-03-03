import type { ThreatLevel, ConflictStatus, ConflictDaySnapshot } from '@/types/domain';
export type { ThreatLevel, ConflictStatus };

export const CONFLICT = {
  id:            'iran-2026',
  name:          'US–Israel Strikes on Iran',
  codename:      { us: 'Operation Epic Fury', il: 'Operation Roaring Lion' },
  status:        'ONGOING' as const,
  threatLevel:   'CRITICAL' as const,
  startDate:     '2026-02-28T04:30:00Z',  // first strikes, Tehran
  region:        'Iran / Persian Gulf / Middle East',
  escalation:    94,

  summary: `On February 28, 2026, the United States and Israel launched a coordinated joint strike on Iran — the most ambitious Western military operation against the Islamic Republic since its founding. Codenamed Operation Epic Fury by the Pentagon and Operation Roaring Lion by the IDF, the campaign targeted Iranian nuclear facilities, ballistic missile infrastructure, air defense networks, and regime leadership. Supreme Leader Ali Khamenei was killed when his compound in Tehran was struck. 48 Iranian leaders have been killed. Iran responded with Operation True Promise 4 — launching 700+ drones and hundreds of missiles at targets in 9+ countries, killing 6 US service members and 11 Israeli civilians. On Day 3, Hezbollah entered the war and Israel launched a ground incursion into southern Lebanon (40 killed, 246 injured, 30K displaced). Iran struck the US Embassy in Riyadh with drones, forcing the US to close embassies in Saudi Arabia and Kuwait. QatarEnergy halted ALL LNG production. The IDF "struck and dismantled" Iran's state broadcaster IRIB and bombed the Assembly of Experts in Qom — the body that appoints the next Supreme Leader. Iran's death toll stands at 787 across 131+ cities. Brent crude hit a 19-month high approaching $80/bbl. Trump laid out 4 objectives and estimated 4–5 weeks but said the US could go "far longer." Operations are ongoing on Day 4.`,

  keyFacts: [
    'Khamenei confirmed killed — IRNA state media confirmation 14:30 UTC Feb 28',
    'B-2 Spirit bombers struck fortified nuclear and missile sites from Diego Garcia',
    'Strait of Hormuz closure — 200+ vessels anchored, half-dozen shipping companies halted',
    'IRGC launched Operation True Promise 4 — 700+ drones, hundreds of missiles in 2 days',
    'Iran struck targets in 9+ countries: Bahrain, Iraq, Jordan, Kuwait, Oman, Qatar, Saudi Arabia, UAE, Israel, Cyprus',
    '4 US service members KIA (confirmed by Hegseth/CENTCOM), 18 total wounded',
    '10 killed in Israel — 9 in Beit Shemesh synagogue strike, 1 elsewhere; 40+ injured',
    '9 Iranian warships destroyed and sunk — naval HQ "largely destroyed" (Trump/CENTCOM)',
    '48 Iranian leaders killed (per Trump); IDF struck "dozens" of IRGC command centers in Tehran',
    '1,000+ targets hit in first 24h; "tens of thousands of pieces of ordnance" delivered',
    'Iran hit civilian targets across Gulf — Dubai Fairmont, Bahrain Crowne Plaza, airports, AWS data center',
    '1,500+ flights cancelled; Dubai, Kuwait, Bahrain, Erbil airports suspended',
    'Oil: Brent surging, WTI surging; OPEC+ increase: 206K bbl/day (a "rounding error")',
    'Iran forms interim leadership council: Pezeshkian, Mohseni-Ejei, Arafi',
    'Starmer/Macron/Merz joint statement: "Iran pursuing scorched earth strategy"',
    'Houthis resumed Red Sea attacks; first rockets from Lebanon (late March 1)',
    'Day 3: Hezbollah enters war — IDF launches offensive, 31 killed in Lebanon',
    'Day 3: Iranian drone strikes RAF Akrotiri (UK Cyprus) — first strike on NATO territory',
    'Day 3: Saudi Ras Tanura refinery (550K bbl/day) shut after drone strike',
    'Day 3: 3 US F-15s shot down by Kuwaiti air defenses in friendly fire — all 6 crew survived',
    'Day 3: QatarEnergy halts ALL LNG production after Iran attacks Ras Laffan + Mesaieed',
    'Day 3: Larijani rejects negotiations — "We will not negotiate with the US"',
    'Day 3: Iran death toll rises to 555 across 131 cities (Red Crescent)',
    'Day 3: IAEA Grossi warns mass evacuations may be necessary if reactors hit',
    'Day 3: Hegseth Pentagon briefing: "not endless war", 3-part mission, "just beginning"',
    'Day 3: Trump: "the big wave hasn\'t even happened yet", doesn\'t rule out boots on ground',
    'Day 3: MBS vows military force against further Iranian incursions',
    'Day 3: US/Israel strike PMF/Kataib Hezbollah base in Iraq — 2 killed, 5 wounded',
    'Day 3: IDF launches "broad wave" strikes on "heart of Tehran" + simultaneous Lebanon ops',
    'Day 3: IRGC claims 60 strategic targets, 500 facilities, 700+ drones in 2 days',
    'Day 3: Trump White House address — 4 objectives: destroy missiles, annihilate navy, stop nukes, stop terror funding',
    'Day 3: Trump estimates 4–5 weeks but "we have the capability to go far longer"',
    'Day 3: IDF "struck and dismantled" IRIB state broadcaster HQ — 2 employees killed incl. IRINN editor-in-chief',
    'Day 4: Iranian drones hit US Embassy in Riyadh — building empty, limited fire, no casualties',
    'Day 4: US closes embassies in Saudi Arabia and Kuwait; nonessential evacuations ordered across region',
    'Day 4: State Dept travel advisories for 16 Middle Eastern countries',
    'Day 4: Israel ground incursion into southern Lebanon — Netanyahu/Katz approve buffer zone expansion',
    'Day 4: Lebanon: 40 killed, 246 wounded, 30K+ displaced from Israeli operations',
    'Day 4: Assembly of Experts offices bombed in Qom — succession mechanism under direct military pressure',
    'Day 4: US death toll rises to 6 KIA (2 additional bodies recovered)',
    'Day 4: Iran death toll rises to 787 (IRCS) across 131+ cities',
    'Day 4: Brent crude 19-month high ~$80/bbl; Bernstein warns $120–$150 in extreme scenario',
    'Day 4: UK considering HMS Duncan (Type 45) to Cyprus; Starmer says UK "not joining strikes"',
    'Day 4: Trump: "Iranians want to talk, I said it\'s too late!"',
  ],

  objectives: {
    us:  'Destroy Iranian nuclear & missile capability, prevent nuclear breakout, topple regime',
    il:  'Remove existential threats — nuclear/missile programs, eliminate Axis of Resistance leadership',
  },

  commanders: {
    us: ['President Donald Trump', 'SecDef Pete Hegseth', 'CENTCOM CG Dan Caine', 'Adm. Brad Cooper'],
    il: ['PM Benjamin Netanyahu', 'DefMin Israel Katz', 'IDF Chief Eyal Zamir', 'IAF Chief Tomer Bar'],
    ir: ['President Masoud Pezeshkian (interim council)', 'Chief Justice Mohseni-Ejei (interim council)', 'Ayatollah Arafi (interim council)', 'FM Abbas Araghchi'],
  },

  casualties: {
    us:       { kia: 6,   wounded: 18,   civilians: 0 },  // 6 KIA confirmed Mar 3 (2 additional bodies recovered from struck facility); 18 wounded
    israel:   { kia: 0,   wounded: 0,    civilians: 11, injured: 300 },  // 9 Beit Shemesh + 1 Tel Aviv + 1 more; 12 wounded in Mar 3 central Israel missile; 40+ buildings damaged
    iran:     { killed: 787, injured: 1200 },  // IRCS figures as of Mar 3; ~180 students at Minab school; 131+ cities affected; 100K rescuers on alert; "hundreds" per IRCS
    lebanon:  { killed: 40, injured: 246 },  // IDF air + ground operations; 30K displaced; buffer zone expansion approved
    regional: {
      uae:     { killed: 3, injured: 68 },      // Pakistani, Nepalese, Asian nationals; Zayed Airport, Palm Jumeirah, Dubai Int'l
      kuwait:  { killed: 3, injured: 35 },       // 1 civilian + 2 more from subsequent strikes; 3 F-15s shot down (friendly fire, crew survived)
      qatar:   { killed: 0, injured: 16 },       // Residential + energy infrastructure; Ras Laffan + Mesaieed struck; LNG halted
      bahrain: { killed: 1, injured: 4 },        // 5th Fleet HQ targeted; Crowne Plaza; intercepted missile debris killed Asian worker
      oman:    { killed: 1, injured: 5 },        // Duqm port + Palau-flagged tanker off Musandam
      iraq:    { killed: 2, injured: 5 },        // PMF/Kataib Hezbollah at Jurf al-Sakher; Erbil explosions
      jordan:  { killed: 0, injured: 5 },        // 49 drones/missiles intercepted; property damage from fragments
      saudi:   { killed: 0, injured: 0 },        // US Embassy hit by 2 drones (no casualties); Ras Tanura shut; 8 drones intercepted near Riyadh/Al-Kharj
    },
  },

  daySnapshots: [
    // ── DAY 1 — Feb 28, 2026 ──────────────────────────────────────────────
    {
      day: '2026-02-28',
      dayLabel: 'DAY 1',
      summary: 'On February 28, 2026, the United States and Israel launched a coordinated joint strike on Iran — the most ambitious Western military operation against the Islamic Republic since its founding. B-2 bombers dropped 14 GBU-57 MOPs on Fordow and Natanz. Israeli F-35Is struck Khamenei\'s compound in Tehran — the Supreme Leader was confirmed killed. 48 Iranian leaders killed in the opening wave. Iran launched Operation True Promise 3, striking US bases across the Gulf and firing 35+ ballistic missiles at Israel. The IRGC declared the Strait of Hormuz closed. Houthis announced the resumption of Red Sea attacks.',
      keyFacts: [
        'Khamenei confirmed killed — IRNA state media confirmation 14:30 UTC Feb 28',
        'B-2 Spirit bombers struck fortified nuclear and missile sites from Diego Garcia',
        'Strait of Hormuz closure — 200+ vessels anchored, half-dozen shipping companies halted',
        'Iran launched 35+ ballistic missiles at Israel (Shahab-3, Emad, Kheibar Shekan)',
        'Iran struck US bases in Bahrain, Qatar, Kuwait, UAE, Jordan, Saudi Arabia',
        'IDF F-35I struck Khamenei compound in Saadatabad, Tehran',
        'Decapitation strikes: IRGC Commander Pakpour, DefMin Nasirzadeh, NSC Shamkhani, Army Chief Mousavi killed',
        'IAEA confirmed loss of safeguards sensor contact with Fordow and Natanz',
        'Houthis resumed Red Sea shipping attacks — Bab el-Mandeb declared exclusion zone',
        'Trump posted Truth Social video announcing strikes',
        'Russia/China called emergency IAEA and UNSC sessions',
        'Iran forms interim leadership council: Pezeshkian, Mohseni-Ejei, Arafi',
      ],
      escalation: 78,
      casualties: {
        us:       { kia: 0, wounded: 0, civilians: 0 },
        israel:   { kia: 0, wounded: 0, civilians: 0, injured: 0 },
        iran:     { killed: 120, injured: 200 },
        lebanon:  { killed: 0, injured: 0 },
        regional: {
          uae:     { killed: 3, injured: 58 },
          kuwait:  { killed: 0, injured: 0 },
          qatar:   { killed: 0, injured: 0 },
          bahrain: { killed: 1, injured: 6 },
          oman:    { killed: 0, injured: 0 },
          iraq:    { killed: 0, injured: 0 },
          jordan:  { killed: 0, injured: 0 },
          saudi:   { killed: 0, injured: 0 },
        },
      },
      economicImpact: {
        chips: [
          { label: 'Brent Crude', val: '~$74/bbl', sub: '+6% ↑', color: 'var(--warning)' },
          { label: 'WTI', val: '~$69/bbl', sub: '+5% ↑', color: 'var(--warning)' },
          { label: 'Hormuz Transit', val: 'ZERO', sub: 'vessels', color: 'var(--danger)' },
          { label: 'Flights', val: '1,500+', sub: 'cancelled', color: 'var(--warning)' },
        ],
        narrative: 'Opening day of the conflict immediately disrupted two of the world\'s most critical maritime chokepoints. The IRGC closure of the Strait of Hormuz halted ~14M bbl/day of oil transit. Brent surged 6% on initial trading. The dual closure of Hormuz and Bab el-Mandeb is unprecedented.',
      },
      scenarios: [
        { label: 'BEST CASE', subtitle: 'Rapid military success; Iran collapses internally', color: 'var(--success)', prob: '20%',
          body: 'The decapitation of Iranian leadership triggers internal collapse. IRGC units stop fighting within days. Transitional government seeks negotiations through Oman backchannel. Hormuz reopens within a week. Oil retraces quickly.' },
        { label: 'BASE CASE', subtitle: '2-4 week air campaign; sustained Iranian retaliation', color: 'var(--warning)', prob: '55%',
          body: 'US/Israel continue systematic destruction of nuclear and missile infrastructure over 2-4 weeks. Iran continues retaliatory strikes from degrading capability. Hormuz closure persists 2-3 weeks. Hezbollah stays at threshold level. Oil elevated at $75-85/bbl.' },
        { label: 'WORST CASE', subtitle: 'Full regional escalation — Hezbollah, ground war', color: 'var(--danger)', prob: '25%',
          body: 'Hezbollah opens a full northern front against Israel. Iran\'s proxy network activates across the region. Ground operations become necessary. NATO drawn in if European assets are attacked. Oil spikes above $100/bbl. Conflict extends months.' },
      ],
    },

    // ── DAY 2 — Mar 1, 2026 ───────────────────────────────────────────────
    {
      day: '2026-03-01',
      dayLabel: 'DAY 2',
      summary: 'Day 2 of Operation Epic Fury saw sustained US/Israeli strikes against Iranian nuclear and missile infrastructure, with the Pentagon confirming 1,000+ targets hit in the first 24 hours. Three US service members were confirmed KIA from Iranian retaliatory strikes in Kuwait. 11 Israeli civilians were killed, including 9 in a synagogue strike in Beit Shemesh. Trump declared operations "ahead of schedule." The US vetoed a UNSC ceasefire resolution co-sponsored by Russia and China. First rockets were fired from Lebanon toward Israel late in the day, signaling potential Hezbollah escalation.',
      keyFacts: [
        '3 US service members confirmed KIA in Kuwait — first US combat deaths',
        '11 Israeli civilians killed — 9 in Beit Shemesh synagogue strike, 1 elsewhere',
        '1,000+ targets hit in first 24 hours (Pentagon confirmation)',
        'Trump told CNBC operation is "ahead of schedule"',
        'US vetoed UNSC ceasefire resolution co-sponsored by Russia and China',
        'Iran transitional government forming — Pezeshkian / Mohseni Ejei / Arafi',
        'Three tankers damaged in Gulf — cause unclear (IRGC deliberate vs accident)',
        'IRGC Navy struck civilian aviation infrastructure (Kuwait, UAE airports)',
        'Houthis resumed Red Sea attacks; first rockets from Lebanon (late March 1)',
        'Netanyahu: "The job is not finished" — committed to continued strikes',
        'Starmer/Macron/Merz joint statement: "Iran pursuing scorched earth strategy"',
        'Unverified reports of Russian satellite intel sharing with Iranian IRGC remnants',
        'Oil: Brent surging ~10% to ~$77/bbl; WTI ~$71/bbl',
        'OPEC+ increase: 206K bbl/day (a "rounding error" vs 14M bbl/day disruption)',
      ],
      escalation: 88,
      casualties: {
        us:       { kia: 3, wounded: 12, civilians: 0 },
        israel:   { kia: 0, wounded: 0, civilians: 11, injured: 40 },
        iran:     { killed: 310, injured: 480 },
        lebanon:  { killed: 0, injured: 0 },
        regional: {
          uae:     { killed: 3, injured: 58 },
          kuwait:  { killed: 1, injured: 20 },
          qatar:   { killed: 0, injured: 8 },
          bahrain: { killed: 1, injured: 6 },
          oman:    { killed: 1, injured: 5 },
          iraq:    { killed: 0, injured: 0 },
          jordan:  { killed: 0, injured: 0 },
          saudi:   { killed: 0, injured: 0 },
        },
      },
      economicImpact: {
        chips: [
          { label: 'Brent Crude', val: '~$77/bbl', sub: '+10% ↑', color: 'var(--danger)' },
          { label: 'WTI', val: '~$71/bbl', sub: '+8% ↑', color: 'var(--danger)' },
          { label: 'Hormuz Transit', val: 'ZERO', sub: 'vessels', color: 'var(--danger)' },
          { label: 'Flights', val: '3,500+', sub: 'cancelled', color: 'var(--warning)' },
        ],
        narrative: 'Oil markets continued to surge as the Hormuz closure entered Day 2 with no signs of reopening. OPEC+ announced a modest 206K bbl/day increase — a fraction of the ~14M bbl/day disrupted. Three tankers were damaged in the Gulf. Airline cancellations accelerated to 3,500+.',
      },
      scenarios: [
        { label: 'BEST CASE', subtitle: 'Ceasefire within 2 weeks; Hezbollah stands down', color: 'var(--success)', prob: '15%',
          body: 'Iran\'s transitional government negotiates through Oman backchannel. Hezbollah agrees to stand down. Hormuz reopens within 2 weeks. Oil retraces to ~$70-75/bbl. Requires Larijani faction to be overruled by Pezeshkian.' },
        { label: 'BASE CASE', subtitle: '4-week air campaign; limited ground operations', color: 'var(--warning)', prob: '50%',
          body: 'Trump\'s \'4 weeks or less\' timeline plays out. US/Israel complete systematic destruction of nuclear, missile, naval, and command infrastructure. Hezbollah front remains at threshold level. Hormuz closure persists 3-4 weeks. Oil stays elevated at $80-100/bbl. No ground invasion of Iran.' },
        { label: 'WORST CASE', subtitle: 'Full regional war — Hezbollah enters, ground operations', color: 'var(--danger)', prob: '35%',
          body: 'Hezbollah opens a full northern front with its ~2,000 long-range precision missiles. IDF forced into ground operations in Lebanon. Iran\'s 4M-volunteer mobilization suggests protracted resistance. Oil spikes above $110/bbl. Conflict extends months, not weeks.' },
      ],
    },

    // ── DAY 3 — Mar 2, 2026 ───────────────────────────────────────────────
    {
      day: '2026-03-02',
      dayLabel: 'DAY 3',
      summary: 'On Day 3, the conflict expanded dramatically. Hezbollah entered the war, firing rockets and drones at Israel from Lebanon. The IDF launched an offensive campaign against Hezbollah across southern Lebanon, the Bekaa Valley, and Beirut\'s Dahieh suburb — 31 killed in Lebanon. An Iranian drone struck RAF Akrotiri in Cyprus — the first direct attack on European NATO territory. QatarEnergy halted all LNG production after Iran struck Ras Laffan and Mesaieed. Saudi Ras Tanura refinery (550K bbl/day) shut after a drone strike. Iran\'s death toll rose to 555 across 131 cities. Trump said "the big wave hasn\'t even happened yet" and didn\'t rule out boots on ground. MBS vowed military force against further Iranian incursions. 3 US F-15s shot down by Kuwaiti air defenses in friendly fire — all 6 crew survived.',
      keyFacts: [
        'Hezbollah enters war — IDF launches offensive, 31 killed in Lebanon',
        'Iranian drone strikes RAF Akrotiri (UK Cyprus) — first strike on NATO territory',
        'Saudi Ras Tanura refinery (550K bbl/day) shut after drone strike',
        '3 US F-15s shot down by Kuwaiti air defenses in friendly fire — all 6 crew survived',
        'QatarEnergy halts ALL LNG production after Iran attacks Ras Laffan + Mesaieed',
        'Larijani rejects negotiations — "We will not negotiate with the US"',
        'Iran death toll rises to 555 across 131 cities (Red Crescent)',
        'IAEA Grossi warns mass evacuations may be necessary if reactors hit',
        'Hegseth Pentagon briefing: "not endless war", 3-part mission, "just beginning"',
        'Trump: "the big wave hasn\'t even happened yet", doesn\'t rule out boots on ground',
        'MBS vows military force against further Iranian incursions',
        'US/Israel strike PMF/Kataib Hezbollah base in Iraq — 2 killed, 5 wounded',
        'IDF launches "broad wave" strikes on "heart of Tehran" + simultaneous Lebanon ops',
        'IRGC claims 60 strategic targets, 500 facilities, 700+ drones in 2 days',
        '4 US service members KIA total (Hegseth confirmed 4th), 18 total wounded',
        '10 killed in Israel total — 9 in Beit Shemesh, 1 elsewhere; 40+ injured',
        '9 Iranian warships destroyed and sunk — naval HQ "largely destroyed"',
      ],
      escalation: 94,
      casualties: {
        us:       { kia: 4, wounded: 18, civilians: 0 },
        israel:   { kia: 0, wounded: 0, civilians: 10, injured: 40 },
        iran:     { killed: 555, injured: 747 },
        lebanon:  { killed: 31, injured: 149 },
        regional: {
          uae:     { killed: 3, injured: 58 },
          kuwait:  { killed: 1, injured: 32 },
          qatar:   { killed: 0, injured: 16 },
          bahrain: { killed: 1, injured: 6 },
          oman:    { killed: 1, injured: 5 },
          iraq:    { killed: 2, injured: 5 },
          jordan:  { killed: 0, injured: 0 },
          saudi:   { killed: 0, injured: 0 },
        },
      },
      economicImpact: {
        chips: [
          { label: 'Brent Crude', val: '~$79/bbl', sub: '+14% ↑', color: 'var(--danger)' },
          { label: 'WTI', val: '~$73/bbl', sub: '+12% ↑', color: 'var(--danger)' },
          { label: 'Ras Tanura', val: 'OFFLINE', sub: '550K bbl/day', color: 'var(--danger)' },
          { label: 'Hormuz Transit', val: 'ZERO', sub: 'vessels', color: 'var(--danger)' },
          { label: 'Flights', val: '6,000+', sub: 'cancelled', color: 'var(--warning)' },
        ],
        narrative: 'The simultaneous closure of the Strait of Hormuz and Bab el-Mandeb Strait represents an unprecedented dual-chokepoint disruption. Saudi Ras Tanura refinery (550K bbl/day) shut after drone strike. QatarEnergy halted all LNG production. OPEC+ offered only 206K bbl/day increase — a fraction of the ~14M bbl/day disrupted. If Hormuz closure persists beyond 3 weeks, Bloomberg Economics estimates a global GDP shock of 0.8–1.4%.',
      },
      scenarios: [
        { label: 'BEST CASE', subtitle: 'Ceasefire within 2 weeks; Hezbollah stands down', color: 'var(--success)', prob: '10%',
          body: 'Iran\'s transitional government negotiates through Oman backchannel. Hezbollah agrees to ceasefire following IDF offensive. Hormuz reopens within 2 weeks. Oil retraces to ~$70–75/bbl. Requires Larijani faction to be overruled by Pezeshkian. Currently unlikely given Larijani\'s public rejection of talks.' },
        { label: 'BASE CASE', subtitle: '4-week air campaign; limited ground operations', color: 'var(--warning)', prob: '50%',
          body: 'Trump\'s \'4 weeks or less\' timeline plays out. US/Israel complete systematic destruction of nuclear, missile, naval, and command infrastructure. Hezbollah front remains at threshold level (rockets, not precision missiles). Hormuz closure persists 3–4 weeks. Oil stays elevated at $80–100/bbl. No ground invasion of Iran.' },
        { label: 'WORST CASE', subtitle: 'Full regional war — ground invasions, NATO drawn in', color: 'var(--danger)', prob: '40%',
          body: 'NOW PARTIALLY REALIZED: Hezbollah has opened a northern front. IDF chief says \'all options on the table\' including ground invasion of Lebanon. RAF Akrotiri struck — NATO territory under attack. If Hezbollah deploys its ~2,000 long-range precision missiles, Israeli air defenses would be overwhelmed. Ground incursion into Lebanon becomes necessary. Iran\'s 4M-volunteer mobilization suggests protracted resistance. Oil could spike above $120/bbl. Conflict extends months, not weeks.' },
      ],
    },

    // ── DAY 4 — Mar 3, 2026 ───────────────────────────────────────────────
    {
      day: '2026-03-03',
      dayLabel: 'DAY 4',
      summary: 'Day 4 saw Iran strike the US Embassy in Riyadh with drones — the first attack on a US diplomatic compound since Benghazi (2012). The US closed embassies in Saudi Arabia and Kuwait and ordered regional evacuations across 16 countries. US death toll rose to 6 KIA after 2 additional bodies were recovered. The IDF struck and claimed to "dismantle" Iran\'s state broadcaster IRIB in Tehran, and bombed the Assembly of Experts office in Qom — the body that must appoint the next Supreme Leader. Israel launched a ground incursion into southern Lebanon, with Netanyahu and DefMin Katz approving buffer zone expansion. Lebanon casualties reached 40 killed, 246 wounded, 30K+ displaced. Iran\'s death toll rose to 787 across 131+ cities. Brent crude hit a 19-month high approaching $80/bbl. Trump rejected Iranian talks: "Iranians want to talk, I said it\'s too late!" UK considered sending HMS Duncan to defend Cyprus.',
      keyFacts: [
        'Iranian drones hit US Embassy in Riyadh — building empty, limited fire, no casualties',
        'US closes embassies in Saudi Arabia and Kuwait; nonessential evacuations ordered across region',
        'State Dept travel advisories for 16 Middle Eastern countries',
        'US death toll rises to 6 KIA — 2 additional bodies recovered from struck facility',
        'IDF "struck and dismantled" IRIB state broadcaster HQ in Tehran — 2 employees killed incl. IRINN editor-in-chief',
        'Assembly of Experts offices bombed in Qom — succession mechanism under direct military pressure',
        'Israel ground incursion into southern Lebanon — Netanyahu/Katz approve buffer zone expansion',
        'Lebanon: 40 killed, 246 wounded, 30K+ displaced from Israeli operations',
        'Iran death toll rises to 787 (IRCS) across 131+ cities',
        'Brent crude 19-month high ~$80/bbl; Bernstein warns $120–$150 in extreme scenario',
        'UK considering HMS Duncan (Type 45) to Cyprus; Starmer says UK "not joining strikes"',
        'Cyprus blames UK "poor communication" for Akrotiri strike; 2 more drones intercepted',
        'Trump: "Iranians want to talk, I said it\'s too late!"',
        'US Embassy Kuwait separately "targeted" by Iran — Kuwait FM confirmed',
        'Saudi intercepted 8 additional drones near Riyadh and Al-Kharj',
        'Fresh missile strike on central Israel — 12 wounded (Magen David Adom)',
        'Schumer: "President cannot send forces to fight a war without congressional approval"',
        'Speaker Johnson expects War Powers votes to fail — calls operation "limited in scope"',
      ],
      escalation: 96,
      casualties: {
        us:       { kia: 6, wounded: 18, civilians: 0 },
        israel:   { kia: 0, wounded: 0, civilians: 11, injured: 300 },
        iran:     { killed: 787, injured: 1200 },
        lebanon:  { killed: 40, injured: 246 },
        regional: {
          uae:     { killed: 3, injured: 68 },
          kuwait:  { killed: 3, injured: 35 },
          qatar:   { killed: 0, injured: 16 },
          bahrain: { killed: 1, injured: 4 },
          oman:    { killed: 1, injured: 5 },
          iraq:    { killed: 2, injured: 5 },
          jordan:  { killed: 0, injured: 5 },
          saudi:   { killed: 0, injured: 0 },
        },
      },
      economicImpact: {
        chips: [
          { label: 'Brent Crude', val: '~$80/bbl', sub: '19-mo high ↑', color: 'var(--danger)' },
          { label: 'WTI', val: '~$73/bbl', sub: '+12% ↑', color: 'var(--danger)' },
          { label: 'EU Gas TTF', val: '+18%', sub: 'QatarEnergy halt', color: 'var(--danger)' },
          { label: 'Embassies', val: '2 CLOSED', sub: 'Saudi + Kuwait', color: 'var(--danger)' },
          { label: 'Hormuz', val: 'CLOSED', sub: 'Day 4', color: 'var(--danger)' },
        ],
        narrative: 'The energy crisis deepened on Day 4. Brent crude hit a 19-month high approaching $80/bbl. Bernstein raised its 2026 Brent forecast to $80 (from $65) and warned of $120–$150 in a prolonged scenario. European gas surged 18% on QatarEnergy\'s LNG shutdown. The US Embassy closures in Saudi Arabia and Kuwait signal that Washington expects sustained Iranian retaliation against Gulf civilian and diplomatic targets. Global supply chain disruption is now the most severe since the 1973 oil crisis.',
      },
      scenarios: [
        { label: 'BEST CASE', subtitle: 'Ceasefire within 2 weeks; Hezbollah stands down', color: 'var(--success)', prob: '8%',
          body: 'Trump\'s rejection of Iranian talks ("too late") makes diplomatic offramp nearly impossible in the short term. However, if Iran\'s military capability degrades sufficiently, a de facto ceasefire could emerge through exhaustion. Hezbollah agrees to stand down after IDF buffer zone stabilizes. Hormuz reopens within 2 weeks. Oil retraces to ~$70–75/bbl. Extremely unlikely at this stage.' },
        { label: 'BASE CASE', subtitle: '4-5 week air campaign; ground ops in Lebanon only', color: 'var(--warning)', prob: '50%',
          body: 'Trump\'s stated "4–5 weeks" timeline plays out. US/Israel systematically degrade remaining Iranian military infrastructure while IDF conducts limited ground operations in southern Lebanon (buffer zone, not Beirut). Hezbollah\'s missile inventory is degraded through sustained air campaign. No ground invasion of Iran. Hormuz closure persists 4–5 weeks. Oil stays at $80–100/bbl. Embassy closures are temporary.' },
        { label: 'WORST CASE', subtitle: 'Full regional war — ground invasion of Iran, NATO involvement', color: 'var(--danger)', prob: '42%',
          body: 'ESCALATION ACCELERATING: Trump\'s "boots on the ground" language + "big wave hasn\'t happened yet" signal potential ground invasion. IDF already conducting ground ops in Lebanon. Embassy closures suggest Washington preparing for prolonged conflict. Assembly of Experts bombing prevents Iran from reconstituting leadership — regime collapse could trigger unpredictable militancy. Bernstein\'s $120–$150 oil scenario becomes reality. Iran deploys remaining asymmetric capabilities (sleeper cells, cyberattacks on Western infrastructure). Conflict extends months.' },
      ],
    },
  ] as ConflictDaySnapshot[],
};

