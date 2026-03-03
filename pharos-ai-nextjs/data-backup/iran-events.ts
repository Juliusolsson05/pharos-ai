import type { Severity, EventType, Source, ActorResponse, IntelEvent } from '@/types/domain';
export type { Severity, EventType, Source, ActorResponse, IntelEvent };

export const EVENTS: IntelEvent[] = [
  {
    id:        'evt-001',
    timestamp: '2026-02-28T04:32:00Z',
    severity:  'CRITICAL',
    type:      'MILITARY',
    title:     'First strikes hit Tehran — Khamenei compound targeted',
    location:  'Tehran, Iran',
    summary:   'US B-2 Spirit bombers and Israeli F-35I aircraft launched the opening wave of Operation Epic Fury / Roaring Lion, striking Khamenei\'s residential compound and IRGC headquarters in Tehran. Multiple large explosions reported across the capital. Iranian air defenses were simultaneously suppressed by Tomahawk cruise missile volleys from the USS Gerald R. Ford CSG.',
    fullContent: `At 04:32 UTC on February 28, 2026, US and Israeli forces launched the opening strikes of a coordinated campaign against Iran.

US Air Force B-2 Spirit stealth bombers, operating from Diego Garcia, delivered the first munitions against leadership compounds in Tehran. Simultaneously, IDF F-35I Adir jets struck Khamenei's residential compound in Saadatabad, northwest Tehran. Multiple secondary explosions were observed by satellite.

US Navy Tomahawk cruise missiles from the USS Gerald R. Ford carrier strike group targeted Iranian S-300 and SA-65 air defense batteries in western Iran to suppress retaliatory capability. Pentagon officials confirmed the operation had been in planning for several months.

Israeli Defense Minister Israel Katz issued a public statement within minutes of the strikes commencing: "The IDF is striking the head of the snake." Trump posted a video to Truth Social stating that the US had launched operations alongside Israel to destroy Iran's nuclear program and missile capability.

Iranian state television was disrupted but resumed broadcast within 30 minutes. Initial reports from Tehran residents described a sequence of heavy explosions followed by sustained anti-aircraft fire visible across the city.`,
    verified: true,
    sources: [
      { name: 'Reuters',            tier: 1, reliability: 99 },
      { name: 'IDF Spokesperson',   tier: 1, reliability: 90 },
      { name: 'Pentagon Readout',   tier: 1, reliability: 95 },
      { name: 'NYT live feed',      tier: 1, reliability: 97 },
    ],
    actorResponses: [
      { actorId: 'us',  actorName: 'President Trump',    stance: 'SUPPORTING', type: 'STATEMENT', statement: 'We have launched strikes on Iran alongside our great ally Israel. Their nuclear program is being destroyed. The Iranian people will soon be free.' },
      { actorId: 'idf', actorName: 'IDF Spokesperson',  stance: 'SUPPORTING', type: 'STATEMENT', statement: 'The IDF is conducting Operation Roaring Lion against existential threats to the State of Israel. We are striking the head of the snake.' },
    ],
    tags: ['operation-epic-fury', 'khamenei', 'tehran', 'first-strike'],
  },

  {
    id:        'evt-002',
    timestamp: '2026-02-28T05:50:00Z',
    severity:  'CRITICAL',
    type:      'MILITARY',
    title:     'GBU-57 MOPs strike Fordow and Natanz — largest B-2 strike in US history',
    location:  'Fordow / Natanz, Iran',
    summary:   'In the largest B-2 operational strike in US history, 14 GBU-57A/B Massive Ordnance Penetrators — each weighing 30,000 lbs — were dropped on Iran\'s underground nuclear enrichment facilities at Fordow (near Qom) and Natanz. Both sites are assessed to be heavily damaged or destroyed. IAEA reports loss of sensor contact with both facilities.',
    fullContent: `At approximately 05:50 UTC, USAF B-2 Spirit bombers delivered 14 GBU-57A/B Massive Ordnance Penetrators (MOPs) — the world's most powerful conventional bunker-buster bomb — against the deeply buried nuclear enrichment facilities at Fordow and Natanz.

Fordow, buried 80–100m beneath a mountain near Qom, had been assessed as the most hardened nuclear facility in Iran. The facility housed approximately 1,000 IR-1 centrifuges. Multiple MOPs were required to penetrate to the facility level. Initial BDA (bomb damage assessment) via satellite indicates catastrophic structural damage.

Natanz, the primary uranium enrichment site, was struck with additional GBU-57s and conventional JDAMs. The above-ground pilot fuel enrichment plant was simultaneously targeted by Israeli F-15I aircraft.

Foundation for Defense of Democracies confirmed via FDD Action: "This is the largest B-2 operational strike in US history." The strike employed 14 of the roughly 20 MOPs believed to be in the US arsenal.

IAEA Director General confirmed loss of safeguards sensor contact with both Fordow and Natanz approximately 40 minutes after the strikes. Russia immediately called for an emergency IAEA Board of Governors session.

Former US National Security Advisor John Bolton: "This is exactly what should have been done 20 years ago."`,
    verified: true,
    sources: [
      { name: 'FDD Action',         tier: 2, reliability: 89 },
      { name: 'IAEA Statement',     tier: 1, reliability: 98 },
      { name: 'Reuters',            tier: 1, reliability: 99 },
      { name: 'Pentagon readout',   tier: 1, reliability: 95 },
    ],
    actorResponses: [
      { actorId: 'iaea', actorName: 'IAEA Director General', stance: 'NEUTRAL', type: 'STATEMENT', statement: 'We have lost sensor contact with safeguarded nuclear facilities at Fordow and Natanz. An emergency Board of Governors session has been requested.' },
      { actorId: 'russia', actorName: 'Russian MFA', stance: 'OPPOSING', type: 'STATEMENT', statement: 'Russia condemns the illegal military strikes on civilian nuclear infrastructure under IAEA safeguards. This is a gross violation of international law.' },
    ],
    tags: ['nuclear', 'fordow', 'natanz', 'bunker-buster', 'gbu-57'],
  },

  {
    id:        'evt-003',
    timestamp: '2026-02-28T07:15:00Z',
    severity:  'CRITICAL',
    type:      'INTELLIGENCE',
    title:     'Khamenei, IRGC Commander, Defense Minister, NSC Secretary confirmed killed',
    location:  'Tehran, Iran',
    summary:   'Israeli officials confirmed the IDF killed Supreme Leader Ali Khamenei, IRGC Commander MG Mohammad Pakpour, Defense Minister BG Aziz Nasirzadeh, NSC Secretary Ali Shamkhani, and Army Chief Gen. Abdolrahim Mousavi. Iran\'s state media initially denied Khamenei\'s death before confirming it at 14:30 UTC. The decapitation strikes eliminated virtually the entire Iranian security establishment simultaneously.',
    fullContent: `Multiple senior Israeli intelligence officials, speaking to Axios and other outlets, confirmed the assassination of the following Iranian leadership:

• Supreme Leader Ali Khamenei — struck in Saadatabad residential compound, Tehran. Satellite imagery published by NYT shows multiple buildings within the compound complex destroyed. IRNA confirmed death at 14:30 UTC.

• IRGC Commander Major General Mohammad Pakpour — killed in IRGC HQ strike. Pakpour had replaced Hossein Salami, who was killed in the June 2025 war.

• Defense Minister Brigadier General Aziz Nasirzadeh — killed in Ministry of Defense building strike, Tehran.

• Supreme National Security Council Secretary Ali Shamkhani — killed in SNSC headquarters strike.

• Islamic Republic of Iran Army Chief General Abdolrahim Mousavi — killed in Army HQ strike.

Iranian state media initially denied all deaths. President Masoud Pezeshkian, Judiciary Chief Gholamhossein Mohseni Ejei, and Assembly of Experts head Alireza Arafi have assumed transitional leadership per constitutional succession. Former President Ahmadinejad's condition remains unknown — he was reportedly targeted.

Crowds of Iranians began gathering in Tehran and other cities to celebrate following Khamenei's confirmed death, according to multiple reports and social media footage.`,
    verified: true,
    sources: [
      { name: 'Axios / Israeli officials', tier: 1, reliability: 93 },
      { name: 'IRNA (Iranian state media)', tier: 2, reliability: 80 },
      { name: 'Reuters',                   tier: 1, reliability: 99 },
      { name: 'ISW/CTP Special Report',    tier: 1, reliability: 97 },
    ],
    actorResponses: [
      { actorId: 'iran', actorName: 'Iran Transitional Government', stance: 'OPPOSING', type: 'STATEMENT', statement: 'The Islamic Republic confirms the martyrdom of the Supreme Leader. The revolution will not die with him. All Islamic forces have been called to maximum retaliation.' },
      { actorId: 'idf',  actorName: 'Israeli PM Netanyahu',         stance: 'SUPPORTING', type: 'STATEMENT', statement: 'Israel has eliminated several leaders responsible for the Iranian nuclear programme. The existential threat posed by the Iranian regime is being dismantled.' },
    ],
    tags: ['khamenei', 'decapitation', 'pakpour', 'shamkhani', 'leadership'],
  },

  {
    id:        'evt-004',
    timestamp: '2026-02-28T08:45:00Z',
    severity:  'CRITICAL',
    type:      'MILITARY',
    title:     'Iran launches 35+ ballistic missiles at Israel; Tel Aviv and Jerusalem hit',
    location:  'Israel / Iran',
    summary:   'Iran launched the first retaliatory wave — approximately 35 ballistic missiles targeting Tel Aviv, Jerusalem, Haifa, and Eilat. Iron Dome and Arrow-3 systems intercepted a majority, but Iranian warheads struck residential areas in Jerusalem and Tel Aviv. 11 Israeli civilians were killed, 450+ injured. Ben Gurion Airport declared closed to all commercial traffic.',
    fullContent: `At 08:45 UTC, Iran launched an initial barrage of approximately 35 Shahab-3, Emad, and Kheibar Shekan ballistic missiles from launchers in western and central Iran at Israeli population centers.

Israel's Arrow-3 and Arrow-2 systems intercepted the majority of incoming missiles at high altitude. Iron Dome engaged shorter-range threats. However, several warheads penetrated Israeli defenses and struck:

• Jerusalem: Three missiles struck residential neighborhoods near the Jerusalem suburb of Gilo. 7 confirmed killed, over 200 injured.
• Tel Aviv: Two impacts in the Ramat Aviv and Kiryat Ono districts. 4 killed, 190+ injured.
• Haifa: Iron Dome successfully intercepted all incoming missiles.
• Eilat: Two missiles intercepted by Arrow-3.

Ben Gurion Airport immediately suspended all commercial and charter flights. The US Embassy issued an emergency alert directing all American citizens in Israel to shelter in place. The Embassy stated it was "not in a position to evacuate or directly assist Americans" leaving Israel.

IDF Home Front Command issued a nationwide shelter-in-place order for all Israeli residents.

A second missile barrage was reported approximately 90 minutes later.`,
    verified: true,
    sources: [
      { name: 'IDF Spokesperson', tier: 1, reliability: 90 },
      { name: 'Reuters',          tier: 1, reliability: 99 },
      { name: 'ISW/CTP',          tier: 1, reliability: 97 },
      { name: 'AP',               tier: 1, reliability: 98 },
    ],
    actorResponses: [
      { actorId: 'us',  actorName: 'US Embassy Jerusalem', stance: 'NEUTRAL', type: 'ALERT', statement: 'The U.S. Embassy is not in a position to evacuate or directly assist Americans leaving Israel. All personnel directed to shelter in place.' },
      { actorId: 'iran', actorName: 'IRGC Spokesperson',  stance: 'OPPOSING', type: 'STATEMENT', statement: 'The Islamic Revolutionary Guard Corps confirms the launch of Operation True Promise 3 in response to the criminal aggression of the Zionist regime and its American sponsors.' },
    ],
    tags: ['missile-strike', 'israel', 'jerusalem', 'tel-aviv', 'ben-gurion', 'iron-dome'],
  },

  {
    id:        'evt-005',
    timestamp: '2026-02-28T10:00:00Z',
    severity:  'CRITICAL',
    type:      'MILITARY',
    title:     'Iran strikes US bases in Bahrain, Qatar, Kuwait, UAE, Jordan, Saudi Arabia',
    location:  'Persian Gulf region',
    summary:   'Iran launched simultaneous ballistic missile and drone attacks against US military installations across the Gulf. NSA Al-Dhafra (UAE), Al-Udeid (Qatar), Ali Al Salem (Kuwait), Al-Tanf (Jordan), and multiple Saudi bases were hit. CENTCOM confirmed 3 US service members killed, 5 seriously wounded. Attacks intended to deny US forces ability to continue strike operations.',
    fullContent: `At approximately 10:00 UTC, Iran executed a coordinated multi-directional retaliatory strike against US military installations across the Middle East and Gulf region.

Confirmed strikes and casualties:

• NSA Bahrain (home of US 5th Fleet): Multiple Shahed-136 drones and Fateh-110 missiles intercepted; 4 injuries.
• Al-Udeid Air Base, Qatar: 3 missile impacts on runway and fuel storage. 16 injuries. F-15 sorties temporarily suspended.
• NSA Souda Bay via Iranian proxies in Syria: Unconfirmed.
• Ali Al Salem Air Base, Kuwait: 1 US serviceman killed, 1 Kuwaiti civilian killed.
• Al-Tanf Garrison, Jordan: 2 US service members killed. Direct hit on barracks.
• King Khalid Military City, Saudi Arabia: 3 missile impacts; Saudi defenses intercepted majority.
• Unknown UAE base: 3 UAE civilians killed.

CENTCOM statement at 09:30 ET (14:30 UTC March 1): "Three U.S. service members have been killed in action and five are seriously wounded as part of Operation Epic Fury."

Iran also attacked civilian aviation infrastructure — international airports in Kuwait and UAE were struck by missiles. Maersk immediately suspended Trans-Suez sailings.

President Trump, speaking to CNBC from Mar-a-Lago: "That often happens in war. We are doing this not for now, we are doing this for the future and it is a noble mission."`,
    verified: true,
    sources: [
      { name: 'CENTCOM official statement', tier: 1, reliability: 99 },
      { name: 'Reuters',                    tier: 1, reliability: 99 },
      { name: 'CNBC',                       tier: 1, reliability: 95 },
      { name: 'ISW/CTP',                    tier: 1, reliability: 97 },
    ],
    actorResponses: [
      { actorId: 'us',  actorName: 'CENTCOM',         stance: 'SUPPORTING', type: 'STATEMENT', statement: 'Three U.S. service members have been killed in action and five are seriously wounded as part of Operation Epic Fury. Several others sustained minor injuries.' },
      { actorId: 'trump', actorName: 'President Trump', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'Casualties often happen in war. We are doing this not for now, we are doing this for the future. It is a noble mission. Everything is ahead of schedule.' },
    ],
    tags: ['us-bases', 'gulf', 'casualties', 'centcom', 'al-udeid', 'bahrain'],
  },

  {
    id:        'evt-006',
    timestamp: '2026-02-28T12:00:00Z',
    severity:  'CRITICAL',
    type:      'ECONOMIC',
    title:     'IRGC declares Strait of Hormuz closed — 200+ vessels anchored',
    location:  'Strait of Hormuz',
    summary:   'The IRGC formally declared the Strait of Hormuz closed to all traffic. Over 200 vessels, including oil tankers and LNG carriers, dropped anchor in surrounding waters. Maersk paused Trans-Suez sailings and rerouted via Cape of Good Hope. Three tankers were damaged in the Gulf — unclear if deliberate. 14 million barrels per day of oil flow disrupted.',
    fullContent: `At 12:00 UTC, the IRGC formally announced the closure of the Strait of Hormuz to all commercial and military traffic, executing a long-stated deterrence threat.

The Strait, at its narrowest just 21 nautical miles wide between Iran and Oman, is the world's most critical energy chokepoint. More than 14 million barrels per day — approximately one-third of global seaborne crude exports — transit the Strait annually, along with significant volumes of LNG.

Shipping reports confirmed over 200 vessels, including oil tankers, LNG carriers, and container ships, dropped anchor in the waters approaching the Strait. The IRGC deployed fast-attack craft and threatened to fire upon any vessel attempting transit.

Reuters confirmed: "At least three tankers in the Gulf have been damaged since the U.S. and Israel began trading strikes with Iran. It is unclear whether the damage was done deliberately or accidentally."

Maersk statement: "We have paused Trans-Suez sailings through the Bab el-Mandeb Strait for the moment. Some sailings will be rerouted around the Cape of Good Hope. All vessel crossings in the Strait of Hormuz are also suspended."

Oil futures spiked approximately 35% in after-hours trading. Brent crude hit $143/barrel. US gasoline futures jumped significantly. Economists warned of a severe supply shock if the closure persists beyond 1–2 weeks.

US 5th Fleet issued a statement it was "monitoring the situation" but declined to announce active efforts to reopen the Strait.`,
    verified: true,
    sources: [
      { name: 'Reuters',             tier: 1, reliability: 99 },
      { name: 'Maersk statement',    tier: 1, reliability: 98 },
      { name: 'CNBC',                tier: 1, reliability: 95 },
      { name: 'Kpler data',          tier: 2, reliability: 92 },
    ],
    actorResponses: [
      { actorId: 'iran', actorName: 'IRGC Navy',       stance: 'OPPOSING', type: 'MILITARY ACTION', statement: 'All vessels are warned: the Strait of Hormuz is closed. Any vessel attempting transit will be treated as a hostile actor.' },
      { actorId: 'us',   actorName: 'US 5th Fleet',    stance: 'NEUTRAL',  type: 'STATEMENT',       statement: 'The US Navy Fifth Fleet is monitoring the situation in the Strait of Hormuz and remains committed to freedom of navigation in international waters.' },
    ],
    tags: ['hormuz', 'oil', 'shipping', 'maersk', 'economic', 'energy'],
  },

  {
    id:        'evt-007',
    timestamp: '2026-02-28T16:00:00Z',
    severity:  'HIGH',
    type:      'POLITICAL',
    title:     'Iranians celebrate in Tehran streets following Khamenei\'s confirmed death',
    location:  'Tehran, Isfahan, Shiraz, Iran',
    summary:   'Large crowds gathered in Tehran, Isfahan, and other Iranian cities overnight, celebrating the confirmed death of Supreme Leader Khamenei. This follows the largest protest movement in Iran since the Islamic Revolution (2025–2026), during which Iran killed thousands of civilian protesters. The celebrations represent a major intelligence indicator regarding the regime\'s domestic legitimacy.',
    fullContent: `Following IRNA's confirmation of Supreme Leader Khamenei's death, large crowds of Iranians took to the streets of Tehran, Isfahan, Shiraz, and other cities in scenes of celebration.

The New York Times reported: "Large crowds of Iranians poured into the streets of Tehran and other cities across Iran overnight, celebrating the news that Iran's supreme leader, Ayatollah Ali Khamenei, had been killed during a day of coordinated U.S. and Israeli attacks."

This development has significant intelligence implications. The 2025–2026 Iranian protests — described as the largest since the Islamic Revolution — were met with a massacre of thousands of civilians by regime security forces in January 2026. Trump had stated "help is on the way" in response to the crackdown.

The celebratory response suggests a significant portion of the Iranian population views the regime's collapse as positive. This undermines the regime's claim to represent the Iranian people and complicates the IRGC's ability to mobilize domestic support for continued retaliation.

Senator Mark Warner (D-VA), speaking on CNN, stated: "I saw no intelligence that Iran was on the verge of launching any kind of preemptive strike against the United States of America. None." This directly contradicted the Trump administration's stated justification for the operation.

Transitional government leadership confirmed: President Pezeshkian, Judiciary Chief Mohseni Ejei, and Assembly of Experts head Arafi have assumed collective leadership per constitutional succession procedures.`,
    verified: true,
    sources: [
      { name: 'NYT',               tier: 1, reliability: 97 },
      { name: 'Guardian',          tier: 1, reliability: 96 },
      { name: 'CNN / Sen. Warner', tier: 1, reliability: 95 },
      { name: 'IRNA (state media)', tier: 2, reliability: 78 },
    ],
    actorResponses: [
      { actorId: 'warner', actorName: 'Sen. Mark Warner (D-VA)', stance: 'OPPOSING', type: 'STATEMENT', statement: 'I saw no intelligence that Iran was on the verge of launching any kind of preemptive strike against the United States. None.' },
      { actorId: 'cotton', actorName: 'Sen. Tom Cotton (R-AR)',  stance: 'SUPPORTING', type: 'STATEMENT', statement: 'President Trump is right that it is absolutely vital and necessary to address Iran\'s threat before it fully materializes.' },
    ],
    tags: ['iran-domestic', 'celebration', 'khamenei-death', 'protests', 'transitional'],
  },

  {
    id:        'evt-008',
    timestamp: '2026-02-28T18:30:00Z',
    severity:  'HIGH',
    type:      'DIPLOMATIC',
    title:     'Russia calls emergency IAEA Board of Governors session; UN Security Council convened',
    location:  'Vienna / New York',
    summary:   'Russia formally requested an emergency session of the IAEA Board of Governors, citing US-Israeli strikes on nuclear facilities under IAEA safeguards as a violation of international law. The UN Security Council convened an emergency session. Russia and China vetoed a ceasefire resolution. Western nations defended Israel\'s and the US\'s right to self-defense.',
    fullContent: `Russia's Permanent Mission to the International Organizations in Vienna formally requested an emergency Board of Governors session "on matters related to military strikes of the United States and Israel against the territory of the Islamic Republic of Iran that started in the morning of 28 February 2026."

The diplomatic note specifically cited strikes against "nuclear facilities under IAEA safeguards" as grounds for the emergency convening. The session was confirmed for Monday morning, Vienna time.

Simultaneously, the UN Security Council convened an emergency session. Russia and China introduced a draft resolution calling for an immediate ceasefire. The US vetoed the resolution. The UK abstained.

Key diplomatic positions:
• Russia (opposing): "Gross violation of international law and sovereignty."
• China (opposing): "Unilateral military action against a sovereign state is condemned."
• UK (neutral-supporting): "Raised serious concerns about civilian casualties while affirming Israel's right to self-defense."
• France: "Called for immediate cessation of hostilities pending diplomatic engagement."
• Germany: "Deeply concerned. Called for protection of civilian nuclear infrastructure."

ISW/CTP noted: "The UN Security Council action is unlikely to have practical effect given US veto power but signals significant multilateral diplomatic isolation for Washington and Tel Aviv."`,
    verified: true,
    sources: [
      { name: 'PBS NewsHour',     tier: 1, reliability: 95 },
      { name: 'AP',               tier: 1, reliability: 98 },
      { name: 'Reuters',          tier: 1, reliability: 99 },
      { name: 'ISW/CTP',          tier: 1, reliability: 97 },
    ],
    actorResponses: [
      { actorId: 'russia', actorName: 'Russian MFA',  stance: 'OPPOSING', type: 'DIPLOMATIC', statement: 'Russia calls for an immediate IAEA emergency session. These strikes on safeguarded nuclear facilities represent a grave violation of international law.' },
      { actorId: 'us',     actorName: 'US Ambassador to UN', stance: 'SUPPORTING', type: 'DIPLOMATIC', statement: 'The United States exercised its veto. No other nation has done more to prevent nuclear proliferation. Iran had a nuclear weapon within months.' },
    ],
    tags: ['iaea', 'un', 'russia', 'china', 'diplomatic', 'veto', 'international-law'],
  },

  {
    id:        'evt-009',
    timestamp: '2026-02-28T20:00:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'Houthis announce resumption of Red Sea shipping attacks',
    location:  'Yemen / Red Sea',
    summary:   'Yemen-based Houthis announced they would resume attacks on shipping in the Red Sea and Bab el-Mandeb Strait in solidarity with Iran. The announcement followed the US-Israeli strikes. Maersk, which had already paused Suez sailings, confirmed the Red Sea route was now untenable. Global shipping costs surging. Bab el-Mandeb effectively closed.',
    fullContent: `The Houthis, designated as a terrorist organization by the US and operating from Yemen, announced via their official Telegram channel and spokesperson that they would resume attacks on commercial shipping in the Red Sea, Arabian Sea, and Gulf of Aden in response to US-Israeli strikes on Iran.

"In support of our brothers in the Islamic Republic of Iran and in response to the criminal aggression of the US and Zionist entity, the Yemeni Armed Forces declare the resumption of military operations against all ships linked to the enemies of Islam in the Red Sea, Bab el-Mandeb, and the Arabian Sea."

Maersk confirmed it was pausing all Trans-Suez sailings and rerouting available vessels via the Cape of Good Hope. Other major carriers including CMA CGM and MSC were assessing their routes.

The Bab el-Mandeb closure, combined with the Strait of Hormuz closure, has effectively bottled up oil and gas exports from the Persian Gulf entirely. Lloyd's of London declared a "war risk" zone covering the entire Persian Gulf, Red Sea, and Arabian Sea — triggering insurance rate spikes.

Houthi actions had previously disrupted approximately 15% of global trade during 2024–2025. The resumption of attacks following a period of relative calm significantly widens the conflict's economic impact.

US 5th Fleet confirmed CENTCOM was "re-assessing Houthi threat posture" but no immediate strike operations against Yemen were announced.`,
    verified: true,
    sources: [
      { name: 'Reuters',           tier: 1, reliability: 99 },
      { name: 'Maersk statement',  tier: 1, reliability: 98 },
      { name: 'Times of Israel',   tier: 2, reliability: 86 },
      { name: 'ISW/CTP',           tier: 1, reliability: 97 },
    ],
    actorResponses: [
      { actorId: 'houthis', actorName: 'Houthi Military Spokesperson', stance: 'OPPOSING', type: 'STATEMENT', statement: 'We declare the resumption of military operations against all ships of the enemies in the Red Sea and Bab el-Mandeb in support of Iran.' },
    ],
    tags: ['houthis', 'red-sea', 'shipping', 'bab-el-mandeb', 'maersk', 'maritime'],
  },

  {
    id:        'evt-010',
    timestamp: '2026-03-01T06:00:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'IDF Day 2 strikes — "dozens" of IRGC command centers targeted across Tehran',
    location:  'Tehran / Isfahan / Parchin, Iran',
    summary:   'Israel launched a new wave of strikes into Day 2, targeting "dozens" of IRGC command centers in central Tehran including intelligence HQ, internal security HQ, and Thar-Allah operational command. Explosions rocked Shahrak-e Gharb district and areas near the Intelligence Ministry. CSIS confirmed unverified reports of additional strikes on Isfahan nuclear complex, Parchin, and Iran Atomic Energy Agency HQ. Netanyahu confirmed strikes had killed "several leaders of the Iranian nuclear programme." The IDF also struck IDF intercepted F-4 and F-5 fighter jets as they prepared for takeoff from an Iranian runway.',
    fullContent: `As Operation Roaring Lion entered its second day, Israel launched a new wave of strikes focusing on IRGC command and control infrastructure in central Tehran.

IDF statement: "The strikes were directed at command centers in which IDF intelligence had identified active operational presence of Iranian regime personnel responsible for managing combat operations and planning terror campaigns against the State of Israel and regional countries."

Confirmed targets on Day 2:

IRGC command infrastructure (Tehran):
• "Dozens" of IRGC command centers across Tehran — IDF official statement.
• Intelligence headquarters struck — explosions reported near Gandhi Street area.
• Internal security headquarters targeted.
• Thar-Allah operational command facilities.
• Explosions rocked Shahrak-e Gharb district (upscale residential area with apartment complexes and shopping centers).
• Massive explosions heard near Azadi Stadium, Azadi Square, and the Milad Tower area.

Nuclear-related:
• Isfahan nuclear complex — above-ground administration and research buildings.
• Parchin military complex — explosive research and testing facility (CSIS reports).
• Iran Atomic Energy Agency headquarters, Tehran (unverified per CSIS).

Military:
• IRGC Navy frigate struck — CENTCOM confirmed an Iranian Jamaran-class corvette was struck and was "sinking to the bottom of the Gulf of Oman."
• IDF confirmed striking Iranian F-4 and F-5 fighter jets as they prepared for takeoff from a runway.
• HQ-9B air defense systems around Tehran inactivated.

Israeli strikes also hit a hospital in Tehran's Gandhi Street area — two witnesses told Reuters the hospital was badly damaged and patients were being taken out. Video verified by NBC News showed extensive damage with windows blown out and debris littering streets.

PM Netanyahu statement: "Israeli strikes have also killed several leaders involved in the Iranian nuclear programme and that strikes against sites linked to the programme would continue in the coming days."

CSIS analysis: "Initial reports suggest targets have included administrative hubs and dual-use scientific research facilities."`,
    verified: true,
    sources: [
      { name: 'IDF Spokesperson',  tier: 1, reliability: 90 },
      { name: 'CSIS analysis',     tier: 1, reliability: 94 },
      { name: 'Reuters',           tier: 1, reliability: 99 },
      { name: 'NBC News verified', tier: 1, reliability: 95 },
    ],
    actorResponses: [
      { actorId: 'idf', actorName: 'PM Netanyahu', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'Israeli strikes have killed several leaders of the Iranian nuclear programme. Strikes against nuclear sites will continue in the coming days.' },
      { actorId: 'idf', actorName: 'IDF Spokesperson', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'The strikes were directed at command centers where IDF intelligence identified active operational presence of regime personnel managing combat operations and terror campaigns.' },
    ],
    tags: ['day-2', 'tehran', 'irgc-command', 'isfahan', 'parchin', 'jamaran', 'nuclear-continued'],
  },

  {
    id:        'evt-011',
    timestamp: '2026-03-01T09:30:00Z',
    severity:  'HIGH',
    type:      'POLITICAL',
    title:     'Trump: Iran operations "ahead of schedule"; Democrats question legal basis',
    location:  'Washington D.C. / Mar-a-Lago',
    summary:   'President Trump told CNBC the operation is "moving along very well — ahead of schedule." He described it as "a very noble mission for the world." However, Senate Intelligence Committee ranking member Mark Warner stated he had seen "no intelligence" suggesting Iran was planning a preemptive strike — directly contradicting the administration\'s legal justification. Congressional Democrats demanded briefings.',
    fullContent: `President Trump conducted a phone interview with CNBC's Joe Kernen from Mar-a-Lago on the morning of March 1, 2026:

"We're moving along very well, very well — ahead of schedule. It's a very violent regime, one of the most violent regimes in history. We're doing our job not just for us but for the world. And everything is ahead of schedule."

Trump described a potential off-ramp: "Things are evolving in a very positive way right now, a very positive way." He did not specify terms for a ceasefire.

However, Sen. Mark Warner (D-VA), ranking member of the Senate Intelligence Committee and cleared for highly classified intelligence, contradicted the administration's justification:

"I saw no intelligence that Iran was on the verge of launching any kind of preemptive strike against the United States of America. None." Warner was responding to a senior Trump official's claim that "we had analysis that basically told us, if we sat back and waited to get hit first, the amount of casualties and damage would be substantially higher."

Republican counterpart Sen. Tom Cotton (R-AR) defended the strikes: "President Trump is right that it is absolutely vital and necessary now to address that threat before it fully materializes in the near future."

This political divide has significant implications for the operation's legal standing under the War Powers Resolution and for the bipartisan support required for sustained funding.`,
    verified: true,
    sources: [
      { name: 'CNBC',               tier: 1, reliability: 95 },
      { name: 'CNN State of Union', tier: 1, reliability: 95 },
      { name: 'AP',                 tier: 1, reliability: 98 },
    ],
    actorResponses: [
      { actorId: 'trump',  actorName: 'President Trump',    stance: 'SUPPORTING', type: 'STATEMENT', statement: 'Everything is ahead of schedule. It\'s a very noble mission for the world.' },
      { actorId: 'warner', actorName: 'Sen. Warner (D-VA)', stance: 'OPPOSING',   type: 'STATEMENT', statement: 'I saw no intelligence that Iran was planning a preemptive strike. None. This requires a full congressional briefing.' },
    ],
    tags: ['trump', 'political', 'legal-basis', 'war-powers', 'congress', 'warner'],
  },

  {
    id:        'evt-012',
    timestamp: '2026-03-01T13:42:00Z',
    severity:  'STANDARD',
    type:      'HUMANITARIAN',
    title:     'Iran casualty figures: 200+ killed — IRCS; Minab school death toll rises to 165',
    location:  'Iran (nationwide)',
    summary:   'Iranian Red Crescent Society (IRCS) reported more than 200 killed across Iran from US-Israeli strikes. The Minab school airstrike in Hormozgan Province was updated: 165 students killed after search and recovery operations concluded at the Shajareh Tayyebeh girls primary school, according to the governor of Minab county via Fars News. The school had 264 students and was struck three times, per Iran\'s Ministry of Education spokesperson Ali Farhadi. Ten people killed in Israel, including eight in the Beit Shemesh missile strike. Two killed in the UAE.',
    fullContent: `The Iranian Red Crescent Society reported more than 200 killed across Iran as of March 1, 2026.

The most significant humanitarian incident: the Minab school airstrike in Hormozgan Province, southern Iran. The governor of Minab county announced the end of search and recovery operations for student victims. 165 bodies were recovered from beneath the rubble of the Shajareh Tayyebeh girls primary school, according to Fars News. The school had 264 students and was struck three times, per Ali Farhadi, spokesperson for Iran's Ministry of Education, via state-affiliated Nour News.

Reuters footage showed crews and rescue equipment digging at the destroyed school overnight, with dust billowing as rescuers went through mangled wreckage.

• IDF statement: "We do not target civilian infrastructure. All strikes are against military and strategic targets. We investigate all reports of civilian casualties."
• Iran: "The enemy deliberately targeted civilian shelters."
• UN Secretary-General: "Deeply alarmed by reports of civilian deaths. All parties must comply with international humanitarian law."

Israel casualties:
• 10 people killed in Israel total — 8 in a single Beit Shemesh missile strike (synagogue and bomb shelter destroyed), 2 elsewhere
• 28+ hospitalized from Beit Shemesh strike alone

Regional casualties (outside Iran — from Iranian retaliatory strikes):
• UAE: 2 killed, multiple injured (Dubai Fairmont The Palm hotel, Burj Al Arab area; Abu Dhabi Etihad Towers drone debris; Amazon AWS data center knocked offline)
• Kuwait: 3 US service members killed (Army sustainment unit — Operation Epic Fury's first US KIA)
• Qatar: Doha residential area struck, Hamad International Airport suspended operations
• Bahrain: Crowne Plaza Manama hotel struck; drone debris on residential areas
• Multiple airports closed: Dubai, Kuwait, Bahrain, Erbil (Iraq)`,
    verified: true,
    sources: [
      { name: 'IRCS (Iranian Red Crescent)', tier: 2, reliability: 85 },
      { name: 'HRANA',                       tier: 2, reliability: 88 },
      { name: 'Reuters',                     tier: 1, reliability: 99 },
      { name: 'UN OCHA',                     tier: 1, reliability: 96 },
    ],
    actorResponses: [
      { actorId: 'un',  actorName: 'UN Secretary-General', stance: 'NEUTRAL', type: 'STATEMENT', statement: 'Deeply alarmed by reports of civilian deaths. All parties must comply with international humanitarian law. I call for an immediate ceasefire.' },
      { actorId: 'idf', actorName: 'IDF Spokesperson',     stance: 'NEUTRAL', type: 'STATEMENT', statement: 'We do not target civilian infrastructure. All strikes are directed at military and strategic objectives. We investigate all reports of civilian casualties.' },
    ],
    tags: ['casualties', 'humanitarian', 'minab', 'civilians', 'ircs', 'hrana'],
  },

  // ── MARCH 1 — Additional verified events ──────────────────────────────────

  {
    id:        'evt-013',
    timestamp: '2026-03-01T08:00:00Z',
    severity:  'HIGH',
    type:      'POLITICAL',
    title:     'Iran forms interim leadership council — Pezeshkian, Mohseni-Ejei, Arafi assume powers',
    location:  'Tehran, Iran',
    summary:   'Iran announced the formation of a three-member transitional leadership council to assume the powers of the Supreme Leader following Khamenei\'s killing. The council consists of President Masoud Pezeshkian, Chief Justice Gholam-Hossein Mohseni-Ejei, and Ayatollah Alireza Arafi (selected as the Guardian Council\'s representative). The Guardian Council spokesperson said a new supreme leader "must be determined as soon as possible" but "given wartime conditions, this will take place at the earliest opportunity." This is unprecedented — Iran has had only two supreme leaders since the 1979 revolution.',
    fullContent: `Iran announced the formation of a three-member transitional leadership council to govern the country following the death of Supreme Leader Ayatollah Ali Khamenei.

Constitutional basis: Iran's constitution provides for a transitional council to exercise the powers of the Supreme Leader until the Assembly of Experts selects a successor. The council consists of three members per Article 111.

Council members:
• President Masoud Pezeshkian — reformist president elected August 2024. Had been out of public sight since the strikes began; resurfaced March 1 to announce the council's formation.
• Chief Justice Gholam-Hossein Mohseni-Ejei — hardliner, appointed by Khamenei in 2021. Closely linked to the judiciary's role in suppressing 2022 Mahsa Amini protests.
• Ayatollah Alireza Arafi — 67-year-old Shia cleric, member of the Guardian Council. Selected as the "jurist member" (faqih) of the council, effectively the interim religious authority. Head of Iran's Islamic Seminaries. Considered a conservative loyalist.

Hadi Tahan Nazif, Guardian Council spokesperson, told IRIB News: "The constitution has provisions for the current circumstances, and until a leader is appointed, the leadership council will assume responsibility. Given the wartime conditions, this will take place at the earliest opportunity."

This is historically unprecedented — Iran has had only two supreme leaders: Ayatollah Ruhollah Khomeini (1979–1989) and Ali Khamenei (1989–2026). The succession mechanism has never been tested under wartime conditions, with significant portions of the military and political leadership killed.

NBC News analysis: Richard Engel noted that with "dozens of Iran's top leaders killed" per Israeli claims and strikes still ongoing, "the leadership role is in crisis." The Assembly of Experts — the 88-member clerical body responsible for selecting a new Supreme Leader — has itself likely suffered casualties.`,
    verified: true,
    sources: [
      { name: 'Al Jazeera',        tier: 1, reliability: 95 },
      { name: 'ABC News',          tier: 1, reliability: 95 },
      { name: 'IRIB News (Iranian state)', tier: 2, reliability: 80 },
      { name: 'NBC News / Richard Engel',  tier: 1, reliability: 95 },
    ],
    actorResponses: [
      { actorId: 'iran', actorName: 'Guardian Council Spokesperson', stance: 'NEUTRAL', type: 'STATEMENT', statement: 'The constitution has provisions for the current circumstances. Until a leader is appointed, the leadership council will assume responsibility.' },
    ],
    tags: ['leadership-council', 'pezeshkian', 'arafi', 'succession', 'guardian-council', 'day-2'],
  },

  {
    id:        'evt-014',
    timestamp: '2026-03-01T14:30:00Z',
    severity:  'CRITICAL',
    type:      'MILITARY',
    title:     '3 US service members killed in Kuwait — first US KIA of Operation Epic Fury',
    location:  'Kuwait',
    summary:   'Three US service members were killed in action and five seriously wounded during Operation Epic Fury, US Central Command confirmed. The troops were part of an Army sustainment unit based in Kuwait. Several others sustained minor shrapnel injuries and concussions. CENTCOM said "major combat operations continue and our response effort is ongoing." Trump warned there will "likely be more" American casualties before the operation ends.',
    fullContent: `US Central Command confirmed the first American combat deaths of Operation Epic Fury at approximately 09:30 AM ET on March 1.

CENTCOM statement: "Three U.S. service members have been killed in action and five are seriously wounded as part of Operation Epic Fury. Several others sustained minor shrapnel injuries and concussions — and are in the process of being returned to duty. Major combat operations continue and our response effort is ongoing."

Two US officials confirmed to NBC News that the attack occurred in Kuwait. The troops were part of an Army sustainment unit based in Kuwait.

CENTCOM did not identify the service members, pending notification of next of kin.

President Trump, speaking in a video posted to Truth Social: "As one nation, we grieve for the true American patriots who have made the ultimate sacrifice for our nation, even as we continue the righteous mission for which they gave their lives."

Trump warned: "We'll do everything possible to prevent more casualties. But America will avenge their deaths and deliver the most punishing blow to the terrorists who have waged war against, basically, civilization."

Trump added that "there will likely be more" American casualties before the operation ends.

He also called on the IRGC and Iranian military and police "to lay down your arms and receive full immunity or face certain death."`,
    verified: true,
    sources: [
      { name: 'CENTCOM official statement', tier: 1, reliability: 99 },
      { name: 'NBC News (two US officials)', tier: 1, reliability: 95 },
      { name: 'Reuters',                    tier: 1, reliability: 99 },
      { name: 'Trump Truth Social',         tier: 1, reliability: 90 },
    ],
    actorResponses: [
      { actorId: 'us', actorName: 'President Trump',  stance: 'SUPPORTING', type: 'STATEMENT', statement: 'America will avenge their deaths and deliver the most punishing blow to the terrorists who have waged war against civilization. There will likely be more casualties.' },
      { actorId: 'us', actorName: 'CENTCOM',           stance: 'NEUTRAL',    type: 'STATEMENT', statement: 'Three US service members killed in action, five seriously wounded. Major combat operations continue.' },
    ],
    tags: ['us-kia', 'kuwait', 'centcom', 'casualties', 'day-2'],
  },

  {
    id:        'evt-015',
    timestamp: '2026-03-01T13:00:00Z',
    severity:  'CRITICAL',
    type:      'MILITARY',
    title:     'Beit Shemesh missile strike kills 9 — synagogue and bomb shelter destroyed',
    location:  'Beit Shemesh, Israel',
    summary:   'An Iranian ballistic missile struck a residential neighborhood in Beit Shemesh, near Jerusalem, killing 9 people and injuring more than 40. The missile destroyed a synagogue and caused extensive damage to a public bomb shelter beneath it. Some victims had been sheltering in the communal bunker when it suffered a direct hit. Others were found in the open. Among the dead: 16-year-old Gavriel Baruch. An IDF search-and-rescue spokesperson said it was evidence Iran was targeting civilians — no military bases or command centers were in the vicinity.',
    fullContent: `On the afternoon of March 1 (local time), an Iranian ballistic missile struck a residential neighborhood in Beit Shemesh, a city located approximately 30km west of Jerusalem.

Casualty details (Magen David Adom emergency service):
• 9 killed
• 28 taken to hospitals
• More than 40 total injured
• 16-year-old Gavriel Baruch identified as the fourth named victim

Impact details:
• The missile destroyed a synagogue in the neighborhood.
• A public bomb shelter beneath the synagogue suffered extensive damage from the direct hit.
• Some victims had been sheltering in the communal bunker, per ZAKA (Israeli body recovery organization) spokesperson Zeev Druck.
• Others were found out in the open.
• About a dozen houses in the vicinity showed heavy damage — doors and windows blown open, rubble and broken tile scattered in streets.

At the scene: approximately 200 people gathered, among them police officers and first responders. Bulldozers and heavy equipment were securing the site, collecting forensic evidence and taking witness statements.

An Israeli military search-and-rescue spokesperson at the scene stated it was evidence that Iran was targeting civilians, "pointing out that there were no military bases or command centers in the vicinity."

This was the deadliest single strike on Israeli territory during the conflict — 8 of the 10 total Israeli deaths occurred here.

Separately, an Iranian missile struck a highway on Jerusalem's outskirts, leaving a large crater and injuring 3 people (one in moderate condition). Police bomb disposal experts conducted searches for additional munitions.`,
    verified: true,
    sources: [
      { name: 'Times of Israel',          tier: 2, reliability: 88 },
      { name: 'New York Times',            tier: 1, reliability: 97 },
      { name: 'Reuters',                   tier: 1, reliability: 99 },
      { name: 'Magen David Adom',          tier: 1, reliability: 95 },
      { name: 'The Guardian (video)',      tier: 1, reliability: 95 },
    ],
    actorResponses: [
      { actorId: 'idf',  actorName: 'IDF Search & Rescue',  stance: 'NEUTRAL',  type: 'STATEMENT', statement: 'There are no military bases or command centers in the vicinity. This is evidence Iran is deliberately targeting civilians.' },
      { actorId: 'irgc', actorName: 'IRGC',                 stance: 'OPPOSING', type: 'STATEMENT', statement: 'Iran\'s response has been directed solely and exclusively at US bases and assets.' },
    ],
    tags: ['beit-shemesh', 'synagogue', 'civilian-casualties', 'israel', 'ballistic-missile', 'day-2'],
  },

  {
    id:        'evt-016',
    timestamp: '2026-03-01T17:30:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'Trump: US has sunk 9 Iranian warships and "largely destroyed" Iran\'s naval headquarters',
    location:  'Persian Gulf / Gulf of Oman',
    summary:   'President Trump announced that the US military had destroyed and sunk 9 Iranian warships and was "going after the rest." In a separate attack, Iran\'s naval headquarters was "largely destroyed." Trump said "the rest of Iran\'s fleet of military vessels will soon be floating at the bottom of the sea, also." Earlier, CENTCOM confirmed an Iranian Jamaran-class corvette was struck and sinking in the Gulf of Oman. CENTCOM told the remaining Iranian naval forces: "Abandon ship."',
    fullContent: `President Trump announced on Truth Social that the US military was systematically destroying Iran's navy.

Trump statement: "Nine of their warships have been destroyed and sunk. The rest of Iran's fleet of military vessels will soon be floating at the bottom of the sea, also! In a different attack, we largely destroyed their naval headquarters."

Earlier, CENTCOM had confirmed at least one specific naval engagement: "An Iranian Jamaran-class corvette was struck by U.S. forces as part of Operation Epic Fury. The ship was sinking to the bottom of the Gulf of Oman."

CENTCOM added a direct message to Iran's remaining naval personnel: "As the President said, members of Iran's armed forces, IRGC and police 'must lay down your weapons.' Abandon ship."

The systematic destruction of Iran's navy aligns with the broader US strategy of eliminating Iran's ability to threaten the Strait of Hormuz and Persian Gulf shipping lanes. Iran's conventional navy (IRIN) and the IRGC Navy together operate an estimated 200+ vessels, though many are small fast-attack craft rather than warships.

Reuters confirmed Trump's claim about 9 ships sunk, and Axios reported the naval headquarters was "largely destroyed."`,
    verified: true,
    sources: [
      { name: 'Reuters',              tier: 1, reliability: 99 },
      { name: 'Axios',                tier: 1, reliability: 93 },
      { name: 'Military Times',       tier: 1, reliability: 94 },
      { name: 'CENTCOM statement',    tier: 1, reliability: 99 },
      { name: 'Times of Israel',      tier: 2, reliability: 88 },
    ],
    actorResponses: [
      { actorId: 'us', actorName: 'President Trump',  stance: 'SUPPORTING', type: 'STATEMENT', statement: 'Nine of their warships have been destroyed and sunk. The rest will soon be floating at the bottom of the sea, also!' },
      { actorId: 'us', actorName: 'CENTCOM',           stance: 'SUPPORTING', type: 'STATEMENT', statement: 'An Iranian Jamaran-class corvette was struck and is sinking. Members of Iran\'s armed forces must lay down your weapons. Abandon ship.' },
    ],
    tags: ['navy', 'warships', 'naval-hq', 'trump', 'centcom', 'gulf-of-oman', 'day-2'],
  },

  {
    id:        'evt-017',
    timestamp: '2026-03-01T16:00:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'Iran targets USS Abraham Lincoln — CENTCOM says missiles "didn\'t even come close"',
    location:  'Gulf of Oman / Arabian Sea',
    summary:   'Iran\'s IRGC claimed it fired four ballistic missiles at the USS Abraham Lincoln aircraft carrier. US Central Command responded that the "missiles launched didn\'t even come close" and confirmed the Lincoln was continuing to launch aircraft. The IRGC had been quoted by state-run IRNA as claiming the strike was successful — CENTCOM directly contradicted the claim.',
    fullContent: `Iran's Islamic Revolutionary Guard Corps, the country's most powerful military body, claimed via state-run Islamic Republic News Agency (IRNA) that four ballistic missiles had targeted the USS Abraham Lincoln (CVN-72).

CENTCOM response on X: The missiles "didn't even come close." CENTCOM confirmed the Lincoln was continuing to launch aircraft and conducting normal flight operations.

The USS Abraham Lincoln is one of the primary US carrier strike groups deployed to the region as part of Operation Epic Fury. The carrier is operating in the Gulf of Oman / Arabian Sea — outside the Persian Gulf itself.

The failed attempt to strike a US carrier is significant for several reasons:
1. It demonstrates IRGC intent to target capital warships, not just bases.
2. It demonstrates the failure of Iran's anti-ship ballistic missile capability against a maneuvering carrier with layered air and missile defense.
3. The IRGC's public claim of success, directly contradicted by CENTCOM, follows Iran's pattern of overstating military achievements (as in the April 2024 True Promise operation).

IDF had previously confirmed shooting down 50+ drones launched at Israel from Iran during this period.`,
    verified: true,
    sources: [
      { name: 'CENTCOM (X post)',   tier: 1, reliability: 99 },
      { name: 'NBC News',           tier: 1, reliability: 95 },
      { name: 'IRNA (Iranian state)', tier: 2, reliability: 60 },
    ],
    actorResponses: [
      { actorId: 'us',   actorName: 'CENTCOM',                    stance: 'SUPPORTING', type: 'STATEMENT', statement: 'Missiles launched at USS Abraham Lincoln didn\'t even come close. The Lincoln continues to launch aircraft.' },
      { actorId: 'irgc', actorName: 'IRGC (via IRNA)',           stance: 'OPPOSING',   type: 'STATEMENT', statement: 'Four ballistic missiles have successfully targeted the American aircraft carrier.' },
    ],
    tags: ['uss-lincoln', 'carrier', 'irgc', 'ballistic-missile', 'failed-strike', 'day-2'],
  },

  {
    id:        'evt-018',
    timestamp: '2026-03-01T17:00:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'CENTCOM accuses Iran of targeting civilians — disputes Iran\'s claim of military-only strikes',
    location:  'Middle East (multi-country)',
    summary:   'US Central Command published a fact-check directly contradicting Iran\'s ambassador to the UN, who told the Security Council that Iran\'s response had been directed "solely and exclusively" at US bases and assets. CENTCOM called this a "lie" and listed civilian targets struck by Iran: Dubai International Airport, Kuwait International Airport, UAE airports, Erbil International Airport, Port of Dubai, multiple hotels in Dubai and Bahrain, residential areas in Tel Aviv, Beit Shemesh, Bahrain, Qatar, and Abu Dhabi.',
    fullContent: `CENTCOM published a fact-check statement on X responding to Iran's UN ambassador, who had told the Security Council that Tehran's response was directed "solely and exclusively" at US bases and assets.

CENTCOM statement: "The Iranian Regime is actively targeting civilians and has attacked more than a dozen locations." CENTCOM called the ambassador's assertion a "lie."

Confirmed civilian targets struck by Iran (per CENTCOM):

Airports:
• Dubai International Airport — flights suspended "until further notice"
• Kuwait International Airport — struck
• UAE airports — multiple hit
• Erbil International Airport, Iraq — struck

Hotels and commercial:
• Fairmont The Palm, Dubai — struck, smoke and flames visible
• Burj Al Arab area, Dubai — struck
• Crowne Plaza Manama, Bahrain — struck
• Port of Dubai — struck

Infrastructure:
• Amazon Web Services data center, UAE — "impacted by objects that struck the data center, creating sparks and fire." Fire department shut off power. AWS said getting it back online could take "several hours."

Residential areas struck:
• Tel Aviv, Israel
• Beit Shemesh, Israel (synagogue destroyed, 9 killed)
• Residential areas in Bahrain and Qatar
• Abu Dhabi — Etihad Towers complex hit by drone debris; woman and child injured
• Doha, Qatar — smoke rising from industrial district

Emirates airline suspended all operations "until further notice." Qatar Airways suspended all flights pending reopening of Qatari airspace.

NBC News noted it "has not independently verified CENTCOM's full list of locations" but confirmed several sites via verified video and wire agency reporting.`,
    verified: true,
    sources: [
      { name: 'CENTCOM (X fact-check)',  tier: 1, reliability: 99 },
      { name: 'NBC News',                tier: 1, reliability: 95 },
      { name: 'Reuters',                 tier: 1, reliability: 99 },
      { name: 'BBC',                     tier: 1, reliability: 96 },
      { name: 'The Guardian',            tier: 1, reliability: 95 },
    ],
    actorResponses: [
      { actorId: 'us',   actorName: 'CENTCOM',                        stance: 'SUPPORTING', type: 'STATEMENT', statement: 'The Iranian Regime is actively targeting civilians and has attacked more than a dozen locations. The ambassador\'s claim is a lie.' },
      { actorId: 'iran', actorName: 'Iran UN Ambassador',            stance: 'OPPOSING',   type: 'DIPLOMATIC', statement: 'Iran\'s response has been directed solely and exclusively at US bases and assets.' },
    ],
    tags: ['civilian-targets', 'dubai', 'bahrain', 'centcom', 'fact-check', 'aws', 'airports', 'day-2'],
  },

  {
    id:        'evt-019',
    timestamp: '2026-03-01T18:00:00Z',
    severity:  'HIGH',
    type:      'ECONOMIC',
    title:     'Oil surges 12–14%; OPEC+ announces modest 206K bbl/day increase; 1,500+ flights cancelled',
    location:  'Global markets / Middle East',
    summary:   'When oil trading opened at 6 PM ET Sunday, Brent crude surged ~14% and WTI surged ~12%. OPEC+ pre-emptively announced a collective increase of 206,000 barrels per day — a modest figure given the scale of disruption. More than 1,500 flights to Middle East destinations were cancelled. Lufthansa, KLM, Emirates, Qatar Airways suspended routes. Dubai Airports suspended all flights "until further notice." Over 200 vessels stalled near the Strait of Hormuz. Half a dozen cargo shipping companies halted vessels headed to the waterway.',
    fullContent: `Oil markets:
• Brent crude: surged approximately 14% when trading opened at 6 PM ET Sunday.
• WTI (US crude): surged approximately 12%.
• Oil prices had already risen 17% this year before the strikes, driven by Trump administration rhetoric and escalating sanctions on Iran.

OPEC+ response:
• Eight OPEC+ nations announced plans to increase collective production by 206,000 barrels of crude oil per day.
• Analysts noted the increase was modest relative to the disruption — Iran produces less than 5% of global output, but more than 20% of daily global oil supply passes through the Strait of Hormuz.

Aviation disruptions (as of March 1):
• More than 1,500 flights to Middle East destinations cancelled (Cirium aviation analytics).
• Israel's airspace closed to civil aviation.
• Dubai Airports: suspended flights "until further notice."
• Emirates: "temporarily suspended all operations to and from Dubai."
• Hamad International Airport (Doha): "all aircraft movements suspended."
• Qatar Airways: suspended operations pending reopening of Qatari airspace.
• Lufthansa: suspended flights to Tel Aviv, Beirut, Amman, Erbil, Dammam, Tehran until next Sunday. Dubai and Abu Dhabi flights suspended through Wednesday. Not using airspace over Iran, Israel, Lebanon, Jordan, Iraq, Qatar, Kuwait, Bahrain.
• KLM: no flights to Dubai, UAE, Riyadh, Dammam through Thursday.

Maritime:
• Half a dozen cargo shipping companies halted vessels headed to the Strait of Hormuz.
• 200+ vessels anchored or diverted in the region.
• Maersk had already paused Trans-Suez sailings after Houthi resumption of Red Sea attacks.`,
    verified: true,
    sources: [
      { name: 'NBC News / Steve Kopack', tier: 1, reliability: 95 },
      { name: 'Reuters',                 tier: 1, reliability: 99 },
      { name: 'Cirium (aviation)',        tier: 1, reliability: 95 },
      { name: 'Emirates/Qatar Airways statements', tier: 1, reliability: 99 },
    ],
    actorResponses: [],
    tags: ['oil', 'markets', 'opec', 'flights', 'aviation', 'shipping', 'hormuz', 'day-2'],
  },

  {
    id:        'evt-020',
    timestamp: '2026-03-01T15:30:00Z',
    severity:  'HIGH',
    type:      'POLITICAL',
    title:     'Trump: operations "ahead of schedule"; suggests "decapitating" Iranian leadership; agrees to talk',
    location:  'Mar-a-Lago / Washington D.C.',
    summary:   'In an NBC News interview, Trump said the US strikes are "ahead of schedule" and described possible outcomes including "decapitating" Iran\'s leadership. He confirmed US had killed 48 Iranian leaders. He said Iranian officials were interested in continuing talks but declined to say whether strikes would pause during diplomacy. A senior White House official confirmed Trump will "eventually" talk to "new potential leadership in Iran" but "for now, Operation Epic Fury continues unabated." Trump also called on Iranian citizens to "seize this moment, be brave, be bold, be heroic and take back your country."',
    fullContent: `President Trump gave an interview to NBC News from Mar-a-Lago on March 1, making several significant statements.

On operations: "We expect casualties with something like this. We have three, but we expect casualties — but in the end it's going to be a great deal for the world. We're moving along very well — ahead of schedule."

On desired outcome: "There are many outcomes that are good. Number one is decapitating them, getting rid of their whole group of killers and thugs. And there are many, many outcomes. We could do the short version or the longer version."

On diplomacy: Iranian officials are interested in continuing talks (referencing the Geneva channel through Oman). Asked whether the US will pause strikes during diplomatic efforts: "I don't know. If they can satisfy us. They haven't been able to."

On the pre-strike negotiations: A senior administration official revealed that Iran's Foreign Minister Abbas Araghchi insisted in a Thursday meeting with US envoys Steve Witkoff and Jared Kushner that Iran had the "inalienable right" to enrich uranium. Witkoff replied: "We have the inalienable right to stop you." The US proposed a 10-year enrichment moratorium — Iran refused. Araghchi also declined to share a seven-page document Iran had prepared. Kushner and Witkoff reported to Trump how poorly negotiations had gone, and Trump was "nonplussed."

Senior White House official: Trump will "eventually" talk to "new potential leadership in Iran." "For now, Operation Epic Fury continues unabated."

Trump to Iranian citizens (Truth Social): "Iranian patriots who yearn for freedom — seize this moment, be brave, be bold, be heroic and take back your country. America is with you. I made a promise to you, and I fulfilled that promise. The rest will be up to you, but we'll be there to help."`,
    verified: true,
    sources: [
      { name: 'NBC News interview',  tier: 1, reliability: 95 },
      { name: 'CNBC',                tier: 1, reliability: 95 },
      { name: 'Trump Truth Social',  tier: 1, reliability: 90 },
      { name: 'Reuters',             tier: 1, reliability: 99 },
    ],
    actorResponses: [
      { actorId: 'us', actorName: 'President Trump',           stance: 'SUPPORTING', type: 'STATEMENT', statement: 'We\'re ahead of schedule. Number one outcome is decapitating them. We could do the short version or the longer version.' },
      { actorId: 'us', actorName: 'Senior White House Official', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'For now, Operation Epic Fury continues unabated. The President will eventually talk to new potential leadership in Iran.' },
    ],
    tags: ['trump', 'decapitation', 'diplomacy', 'regime-change', 'geneva', 'witkoff', 'kushner', 'day-2'],
  },

  {
    id:        'evt-021',
    timestamp: '2026-03-01T19:00:00Z',
    severity:  'HIGH',
    type:      'DIPLOMATIC',
    title:     'Omani FM pushes diplomacy; UK allows US to use bases; Congress briefings set for Tuesday',
    location:  'Muscat / London / Washington D.C.',
    summary:   'Omani Foreign Minister Badr al-Busaidi said the "door to diplomacy" remained open, noting Geneva talks had made "genuine progress towards an unprecedented agreement" before the strikes. UK PM Starmer gave consent for US to use British military bases for defensive operations. Congress will receive classified briefings Tuesday from Rubio, Hegseth, CIA Director Ratcliffe, and Joint Chiefs Chairman Gen. Dan Caine. Sen. Mark Kelly (D-AZ) called Khamenei\'s death a "good thing" but criticized the lack of a plan — "Hope is not a strategy." Rep. Ro Khanna (D-CA) said Americans "are not safer today."',
    fullContent: `Diplomatic and political developments on the evening of March 1:

Oman backchannel:
Omani FM Badr al-Busaidi posted on social media: "Talks in Geneva made genuine progress towards an unprecedented agreement between Iran and the United States and although the hope was to avoid war, war should not mean that the hope of peace is extinguished. I still believe in the power of diplomacy to resolve this conflict. The sooner talks are resumed the better it is for everyone."

He had earlier lamented that ongoing negotiations with Iran had been undermined by the strikes and warned that US and global interests could suffer if military operations escalate.

UK position:
PM Keir Starmer gave consent for the US to use British military bases — including RAF Akrotiri in Cyprus and RAF Fairford — for defensive operations related to the conflict. The UK characterized its support as defensive in nature.

Congressional response:
• Congress will receive classified briefings Tuesday — Secretary of State Marco Rubio, Defense Secretary Pete Hegseth, CIA Director John Ratcliffe, and Joint Chiefs Chairman Gen. Dan Caine will brief the full membership of both chambers.
• Senate briefing at 3:30 PM ET, House briefing at 5 PM ET.
• War Powers Resolution push: Rep. Ro Khanna (D-CA) is seeking a vote, saying it would be "close — it depends if we can keep several Democrats in line."
• Sen. Mark Kelly (D-AZ) on Meet the Press: Called Khamenei's death a "good thing" but criticized: "Hope is not a strategy. We got to have a plan here. What is the strategic goal, and how do we achieve it?"
• Rep. Khanna: "The ayatollah was 86. They were picking the new leader before we killed the ayatollah. The question is, is the country going to descend into civil war?"
• Sen. Lindsey Graham (R-SC): "It's not our job to pick Iran's next leader. Our job is to make sure Iran is no longer the largest state sponsor of terrorism. No boots on the ground."`,
    verified: true,
    sources: [
      { name: 'NBC News / Meet the Press', tier: 1, reliability: 95 },
      { name: 'Reuters',                   tier: 1, reliability: 99 },
      { name: 'AP',                        tier: 1, reliability: 98 },
      { name: 'Times of Israel',           tier: 2, reliability: 88 },
    ],
    actorResponses: [
      { actorId: 'oman', actorName: 'Omani FM al-Busaidi',  stance: 'NEUTRAL',    type: 'DIPLOMATIC', statement: 'I still believe in the power of diplomacy to resolve this conflict. The sooner talks are resumed the better.' },
      { actorId: 'uk',   actorName: 'PM Starmer',           stance: 'SUPPORTING', type: 'DIPLOMATIC', statement: 'The UK has authorized the use of British bases for defensive operations.' },
    ],
    tags: ['oman', 'diplomacy', 'uk', 'congress', 'war-powers', 'kelly', 'khanna', 'graham', 'day-2'],
  },

  {
    id:        'evt-022',
    timestamp: '2026-03-01T23:30:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'First rockets from Lebanon in months — sirens across northern Israel as Hezbollah suspected',
    location:  'Northern Israel / Southern Lebanon',
    summary:   'Rockets were launched from Lebanon at northern Israel for the first time in months, setting off air raid sirens across Haifa and the Upper Galilee. The IDF intercepted one rocket; several others fell in open areas. Hezbollah is suspected but has not confirmed responsibility. Separately, multiple suspected drone infiltrations were detected from the north. This would be the first time Hezbollah has joined Iran in the current conflict and the first violation of the November 2024 US-brokered Israel-Lebanon ceasefire.',
    fullContent: `Late on March 1 / early March 2 (local time), sirens were activated across northern Israel.

IDF statement: Projectiles fired from Lebanon. One rocket intercepted; several additional rockets fell in open areas and were not intercepted "in accordance with the military's policies." No reports of casualties or damage.

Sirens sounded in:
• Haifa and surrounding areas
• Multiple locations in the Upper Galilee
• Additional alerts for suspected drone infiltrations in the Upper Galilee

Attribution:
• Hebrew media reports indicate Hezbollah is behind the rocket fire, though the group has not confirmed this.
• It would mark the first time Hezbollah has joined Iran in its attacks on Israel during this conflict.
• It would also be the first violation of the US-brokered Israel-Lebanon ceasefire that went into effect in November 2024.
• Hezbollah did not get involved during the previous Israel-Iran exchanges (June 2025).

The IDF separately confirmed it had shot down over 50 drones launched at Israel from Iran throughout the day.

The potential opening of a northern front represents the most significant escalation risk of the conflict. Hezbollah maintains an estimated 130,000+ rockets and missiles, making it the most heavily armed non-state actor in history.

US Embassy Beirut had earlier issued an Emergency Security Alert advising all US citizens in Lebanon to shelter in place, noting "extremely limited" commercial flight options.`,
    verified: true,
    sources: [
      { name: 'IDF Spokesperson',   tier: 1, reliability: 90 },
      { name: 'Times of Israel',    tier: 2, reliability: 88 },
      { name: 'Magen David Adom',   tier: 1, reliability: 95 },
    ],
    actorResponses: [
      { actorId: 'idf', actorName: 'IDF Spokesperson', stance: 'NEUTRAL', type: 'STATEMENT', statement: 'Projectiles fired from Lebanon. One rocket intercepted. No casualties reported. Details under investigation.' },
    ],
    tags: ['lebanon', 'hezbollah', 'haifa', 'northern-front', 'ceasefire-violation', 'drones', 'day-2'],
  },

  {
    id:        'evt-023',
    timestamp: '2026-03-01T09:00:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'CENTCOM confirms first use of LUCAS kamikaze drones — Task Force Scorpion Strike in combat debut',
    location:  'Iran',
    summary:   'US Central Command formally acknowledged using LUCAS one-way attack drones in its strikes on Iran — the first operational use of Task Force Scorpion Strike, the Pentagon\'s first dedicated kamikaze drone unit. The low-cost drones, modeled after Iran\'s Shahed-136, were launched from land and targeted Iranian facilities. Separately, CENTCOM released strike footage showing missiles launched from warships, fighter jets taking off from carrier decks, and precision hits on Iranian ballistic missile launchers.',
    fullContent: `CENTCOM confirmed on X: "CENTCOM's Task Force Scorpion Strike – for the first time in history – is using one-way attack drones in combat during Operation Epic Fury. These low-cost drones, modeled after Iran's Shaheed drones, are now delivering American-made precision destruction."

Bloomberg had previously reported that the Pentagon's first unit dedicated to one-way attack drones was being prepared for deployment against Iran.

Weapon systems confirmed used in Operation Epic Fury (per Reuters, CENTCOM, Pentagon):
• B-2 Spirit stealth bombers (launched from Diego Garcia)
• BGM-109 Tomahawk cruise missiles (naval-launched)
• LUCAS one-way attack drones (Task Force Scorpion Strike)
• F/A-18 Super Hornets, F-35 Lightning II, F-15E Strike Eagles
• HIMARS precision rockets
• JASSM-ER cruise missiles (air-launched)
• Anthropic's Claude AI was reportedly used in operational planning — Pentagon had $200M AI contract with Anthropic, despite Trump's earlier order to sever ties with the company

Pentagon also used "low-cost, attritable" drones — a concept Iran pioneered with the Shahed family. The irony of using Shahed-derived designs against Iran was noted widely.`,
    verified: true,
    sources: [
      { name: 'CENTCOM (X post)',       tier: 1, reliability: 99 },
      { name: 'Reuters',                tier: 1, reliability: 99 },
      { name: 'Jerusalem Post',          tier: 2, reliability: 88 },
      { name: 'Bloomberg',              tier: 1, reliability: 97 },
      { name: 'The Guardian',           tier: 1, reliability: 95 },
    ],
    actorResponses: [
      { actorId: 'us', actorName: 'CENTCOM', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'Task Force Scorpion Strike — for the first time in history — is using one-way attack drones in combat during Operation Epic Fury.' },
    ],
    tags: ['lucas', 'kamikaze-drones', 'scorpion-strike', 'weapons-systems', 'claude-ai', 'anthropic', 'day-2'],
  },

  {
    id:        'evt-024',
    timestamp: '2026-03-01T12:00:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'Gulf civilian damage escalates: 4 killed in UAE, tanker hit in Hormuz, Oman\'s Duqm port struck',
    location:  'UAE / Strait of Hormuz / Oman',
    summary:   'Iranian retaliatory strikes continued hitting civilian and commercial targets across the Gulf on Day 2. The UAE Ministry of Defence said 137 missiles and 209 drones were fired at the UAE on Day 1 alone. At Abu Dhabi airport, at least 1 killed and 7 wounded. Three killed in the UAE total — Pakistani, Nepalese, and Bangladeshi nationals. A Palau-flagged oil tanker (Skylight) burst into flames after being hit near the Strait of Hormuz; 20 crew (15 Indian, 5 Iranian) were evacuated. Oman\'s Duqm commercial port was struck by two drones — the first attack on Oman, the conflict mediator. The Gulf Cooperation Council condemned the Oman strike.',
    fullContent: `Day 2 saw Iranian strikes widen beyond military targets into civilian and commercial infrastructure across the Gulf:

UAE:
• UAE Ministry of Defence: Iran fired 137 missiles and 209 drones at the UAE on Day 1.
• Abu Dhabi airport: At least 1 person killed and 7 wounded.
• 3 total killed in UAE — Pakistani, Nepalese, and Bangladeshi nationals (UAE MOD).
• Dubai: Palm Jumeirah Fairmont hotel struck by Iranian missile on Day 1 — 4 injured. Burj Al Arab hit by intercepted drone debris — "minor fire" on outer facade.
• Jebel Ali port: Dark smoke rising over one of the busiest ports in the Middle East.
• Abu Dhabi: Etihad Towers complex hit by drone debris; woman and child injured.
• AWS data center in UAE: "impacted by objects" — sparks and fire, power shut off.

Oil tanker — Strait of Hormuz:
• Palau-flagged tanker "Skylight" struck near Musandam's Khasab Port, 5 nautical miles from shore.
• Tanker burst into flames. 20-person crew (15 Indian nationals, 5 Iranian nationals) evacuated safely.
• The tanker was reportedly under US sanctions.
• Iranian state TV claimed a separate tanker was "sinking" after being struck transiting the Strait.

Oman:
• Oman News Agency: Duqm commercial port (Al Wusta Governorate) struck by two drones.
• One expatriate worker injured.
• This was the first attack on Oman — which had been mediating US-Iran negotiations before the strikes.
• GCC condemned the attack. Qatar's MFA spokesperson: "This is an attack on the very principle of mediation."

Explosions continued on Day 2 in Dubai, Doha, and Manama. Witnesses in Doha reported loud bangs and thick black smoke rising on the horizon.`,
    verified: true,
    sources: [
      { name: 'Al Jazeera',                 tier: 1, reliability: 95 },
      { name: 'New York Times',              tier: 1, reliability: 97 },
      { name: 'Reuters',                     tier: 1, reliability: 99 },
      { name: 'Oman News Agency',            tier: 2, reliability: 90 },
      { name: 'Euronews',                    tier: 2, reliability: 88 },
    ],
    actorResponses: [
      { actorId: 'uae',   actorName: 'UAE Ministry of Defence',   stance: 'NEUTRAL', type: 'STATEMENT', statement: '137 missiles and 209 drones were fired at the UAE. Three nationals of Pakistan, Nepal, and Bangladesh have been killed.' },
      { actorId: 'qatar', actorName: 'Qatar MFA Spokesperson',    stance: 'NEUTRAL', type: 'DIPLOMATIC', statement: 'The strike on Oman is an attack on the very principle of mediation.' },
    ],
    tags: ['uae', 'dubai', 'oman', 'duqm', 'tanker', 'hormuz', 'civilian-targets', 'day-2'],
  },

  {
    id:        'evt-025',
    timestamp: '2026-03-01T11:00:00Z',
    severity:  'HIGH',
    type:      'POLITICAL',
    title:     'Qalibaf: "You have crossed our red line" — highest official on camera since strikes; 23 killed in Pakistan protests',
    location:  'Tehran / Karachi / Skardu, Pakistan',
    summary:   'Iran\'s parliamentary speaker Mohammad Bagher Qalibaf — the highest-ranking Iranian official to appear on camera since the strikes began — delivered a televised address: "You have crossed our red line and must pay the price. We will deliver such devastating blows that you yourselves will be driven to beg." Separately, outrage spilled over into Pakistan: at least 23 protesters killed in clashes — 10 in Karachi where security guards at the US consulate fired on demonstrators who breached the outer wall, 11 in Skardu, and 2 in Lahore. Protests also erupted in Iraq, with crowds attempting to storm US diplomatic missions.',
    fullContent: `Iranian domestic politics — Qalibaf statement:
Mohammad Bagher Qalibaf, Speaker of the Iranian Parliament (Majlis), delivered a televised address on Sunday. He is the highest-ranking Iranian official to appear on camera since the strikes began Saturday.

"You have crossed our red line and must pay the price," he said. "We will deliver such devastating blows that you yourselves will be driven to beg."

Qalibaf called US and Israeli leaders "filthy criminals" — per The Hindu.

Pakistan protests:
• Karachi: At least 10 people killed and 70+ wounded near the US consulate. Hundreds of Shiite Muslim protesters stormed the outer wall of the consulate on Mai Kolachi Road. Security guards opened fire. Police fired tear gas. (Al Jazeera, AP, Reuters)
• Skardu (northern Pakistan): 11 killed in clashes near UN offices.
• Lahore: Shiite Muslims set fire at the US consulate entrance gate. 2 killed.
• Total: At least 23 killed, 120+ wounded across Pakistan (Reuters, Washington Post).

Iraq:
• Protests erupted in Baghdad and Basra.
• Crowds attempted to storm US diplomatic missions.
• Iraqi government called for restraint.

The attacks on US consulates represent the first direct spillover of the conflict into South Asia, raising concerns about regional destabilization beyond the Middle East.`,
    verified: true,
    sources: [
      { name: 'Al Jazeera',               tier: 1, reliability: 95 },
      { name: 'Reuters',                   tier: 1, reliability: 99 },
      { name: 'AP',                        tier: 1, reliability: 98 },
      { name: 'Washington Post',           tier: 1, reliability: 97 },
      { name: 'The Hindu',                 tier: 2, reliability: 88 },
    ],
    actorResponses: [
      { actorId: 'iran', actorName: 'Speaker Qalibaf',    stance: 'OPPOSING', type: 'STATEMENT', statement: 'You have crossed our red line and must pay the price. We will deliver such devastating blows that you yourselves will be driven to beg.' },
    ],
    tags: ['qalibaf', 'parliament', 'karachi', 'pakistan', 'protests', 'consulate', 'spillover', 'day-2'],
  },

  {
    id:        'evt-026',
    timestamp: '2026-03-01T16:00:00Z',
    severity:  'HIGH',
    type:      'DIPLOMATIC',
    title:     'Starmer/Macron/Merz joint statement: "Iran pursuing scorched earth strategy" — EU3 ready to "take action"',
    location:  'London / Paris / Berlin',
    summary:   'UK PM Starmer, French President Macron, and German Chancellor Merz issued a rare joint statement: "We did not participate in these strikes, and we will not join offensive action now. But Iran is pursuing a scorched earth strategy — so we are supporting the collective self-defence of our allies." They warned they would "take steps to defend our interests, potentially through enabling necessary and proportionate defensive action to destroy Iran\'s capability to fire missiles and drones at their source." Starmer separately: "We all remember the mistakes of Iraq. We have learned those lessons. It is my duty to protect British lives." RAF jets flying defensive missions. US authorized to use UK bases (RAF Akrotiri, RAF Fairford) for defensive operations.',
    fullContent: `The leaders of the UK, France, and Germany (E3) issued a joint statement on March 1:

"We did not participate in these strikes, and we will not join offensive action now."

"But Iran is pursuing a scorched earth strategy, so we are supporting the collective self-defence of our allies and our people in the region."

"Iran must cease its arbitrary military strikes."

"We call on Iran to seek a negotiated solution."

"We will take steps to defend our interests and those of our allies in the region, potentially through enabling necessary and proportionate defensive action to destroy Iran's capability to fire missiles and drones at their source."

The statement was signed by:
• PM Keir Starmer (UK)
• President Emmanuel Macron (France)
• Chancellor Friedrich Merz (Germany)

Starmer's separate statement (gov.uk, 1 March 2026):
"We all remember the mistakes of Iraq. And we have learned those lessons."
"It is my duty to protect British lives."
"Iran's attacks have targeted allies and are threatening our service personnel and civilians across the region."

UK actions:
• RAF jets are flying defensive missions.
• US authorized to use RAF Akrotiri (Cyprus) and RAF Fairford for defensive operations.
• UK characterized its support as defensive — not joining offensive action.

Erdogan separately spoke with MBS, expressing concern that "unless the necessary intervention is made" the conflict could have "serious" regional and global implications.`,
    verified: true,
    sources: [
      { name: 'gov.uk official statement',   tier: 1, reliability: 99 },
      { name: 'Guardian',                    tier: 1, reliability: 95 },
      { name: 'BBC',                         tier: 1, reliability: 96 },
      { name: 'LBC',                         tier: 2, reliability: 88 },
      { name: 'deutschland.de',              tier: 1, reliability: 95 },
    ],
    actorResponses: [
      { actorId: 'uk',     actorName: 'PM Starmer',           stance: 'NEUTRAL',    type: 'DIPLOMATIC', statement: 'We did not participate in these strikes. But Iran is pursuing a scorched earth strategy. It is my duty to protect British lives.' },
      { actorId: 'france', actorName: 'President Macron',     stance: 'NEUTRAL',    type: 'DIPLOMATIC', statement: 'We call on Iran to stop these reckless attacks immediately. We will take steps to defend our interests.' },
      { actorId: 'turkey', actorName: 'President Erdogan',    stance: 'NEUTRAL',    type: 'DIPLOMATIC', statement: 'Unless the necessary intervention is made, this conflict could have serious regional and global implications.' },
    ],
    tags: ['e3', 'starmer', 'macron', 'merz', 'eu', 'defensive-action', 'raf', 'day-2'],
  },

  {
    id:        'evt-027',
    timestamp: '2026-03-01T14:00:00Z',
    severity:  'STANDARD',
    type:      'INTELLIGENCE',
    title:     'Pentagon confirms Claude AI used in Iran strike planning despite Trump\'s Anthropic ban',
    location:  'Washington D.C.',
    summary:   'The Pentagon used Anthropic\'s Claude AI during the planning and execution of Operation Epic Fury, Reuters reported, citing a source familiar with the situation. This occurred despite Trump\'s earlier order to sever ties with Anthropic. The Guardian reported that Anthropic had refused to allow unrestricted military use of its AI models, particularly for autonomous weapons or mass surveillance. Pentagon had a $200M AI contract with Anthropic. AI was reportedly used for intelligence assessment, target identification, and operational simulations — marking a milestone in AI-integrated military operations.',
    fullContent: `Reuters: "The Pentagon used artificial intelligence services from Anthropic, including its Claude tools, during its attack on Iran, according to a source familiar with the situation."

The Guardian: "The US military reportedly used Claude, Anthropic's AI model, to inform its attack on Iran despite Donald Trump's decision, announced hours earlier, to sever all ties with the company."

Key details:
• Pentagon had contracts worth up to $200 million with Anthropic for AI capabilities.
• Anthropic was among a small group of AI developers (alongside Google and others) awarded Pentagon contracts.
• The dispute stemmed from Anthropic's "refusal to allow unrestricted military use of its AI models, especially for controversial purposes such as fully autonomous weapons or mass surveillance."
• AI was integrated in intelligence assessment, target identification, and operational simulations.
• WION News: "One thing is now very clear: AI has become deeply integrated in US military planning and execution by early 2026."

The use of Claude AI in a major military operation marks a significant milestone — the first confirmed use of a large language model in the planning of a state-on-state military campaign.`,
    verified: true,
    sources: [
      { name: 'Reuters',          tier: 1, reliability: 99 },
      { name: 'The Guardian',     tier: 1, reliability: 95 },
      { name: 'WION News',        tier: 2, reliability: 85 },
      { name: 'Outlook Business', tier: 2, reliability: 85 },
    ],
    actorResponses: [],
    tags: ['ai', 'claude', 'anthropic', 'pentagon', 'military-ai', 'day-2'],
  },

  // ── MARCH 2 — Day 3 ──────────────────────────────────────────────────────

  {
    id:        'evt-028',
    timestamp: '2026-03-02T01:00:00Z',
    severity:  'CRITICAL',
    type:      'MILITARY',
    title:     'Hezbollah launches missiles and drones at Israel — IDF retaliates with strikes across Lebanon',
    location:  'Southern Lebanon / Beirut / Northern Israel',
    summary:   'Hezbollah launched missiles and drones at northern Israel overnight, claiming the attack was in retaliation for the killing of Khamenei. The IDF responded within hours, striking Hezbollah targets across southern Lebanon, the Bekaa Valley, and Beirut\'s Dahieh suburb. Lebanon\'s health ministry reported 31 killed and 149 wounded. IDF chief Eyal Zamir said Israelis should "prepare for many prolonged days of combat ahead." The IDF urged residents of nearly 50 Lebanese villages to evacuate. An IDF spokesperson said "all options are on the table" when asked about a ground invasion.',
    fullContent: `Hezbollah fired rockets and drones at northern Israel beginning around midnight local time (22:00 UTC March 1). Multiple rockets struck open areas in northern Israel. Sirens sounded across Haifa and the Upper Galilee.

IDF response — within hours:
• IAF struck Hezbollah targets across three areas: southern Lebanon, Bekaa Valley, and Beirut's southern suburb (Dahieh).
• Residents of Beirut woke to explosions around 3 a.m. local time as Israeli strikes hit Dahieh — a densely populated commercial and residential area that serves as Hezbollah's stronghold.
• Lebanon's health ministry: 31 killed, 149 wounded from Israeli strikes.
• IDF ordered evacuation of nearly 50 Lebanese villages.

IDF chief of staff Lt. Gen. Eyal Zamir: "We have launched an offensive campaign against Hezbollah. We must be prepared for several days of fighting — many."

IDF spokesperson to reporters: "Hezbollah made a very bad mistake by choosing to strike Israel overnight. The IDF will react very swiftly and they will pay a heavy price. All options are on the table."

When asked specifically about a ground invasion of Lebanon: "All options are on the table."

The Hezbollah attack breaks the November 2024 US-brokered Israel-Lebanon ceasefire. This is the first time Hezbollah has formally joined Iran in retaliatory action against Israel during the current conflict. ISW/CTP previously assessed Hezbollah possesses ~130,000 rockets — the most densely rocket-armed non-state actor in history.`,
    verified: true,
    sources: [
      { name: 'IDF Spokesperson',    tier: 1, reliability: 90 },
      { name: 'Guardian',             tier: 1, reliability: 95 },
      { name: 'NYT',                  tier: 1, reliability: 97 },
      { name: 'Reuters',              tier: 1, reliability: 99 },
      { name: 'Times of Israel',      tier: 2, reliability: 88 },
      { name: 'AP',                   tier: 1, reliability: 98 },
    ],
    actorResponses: [
      { actorId: 'idf',       actorName: 'IDF Chief Zamir',      stance: 'SUPPORTING', type: 'STATEMENT', statement: 'We have launched an offensive campaign against Hezbollah. We must be prepared for several days of fighting — many.' },
      { actorId: 'idf',       actorName: 'IDF Spokesperson',     stance: 'SUPPORTING', type: 'STATEMENT', statement: 'Hezbollah made a very bad mistake. All options are on the table.' },
      { actorId: 'hezbollah', actorName: 'Hezbollah',            stance: 'OPPOSING',   type: 'STATEMENT', statement: 'The Islamic Resistance in Lebanon strikes the Zionist entity in retaliation for the criminal assassination of the Supreme Leader.' },
    ],
    tags: ['hezbollah', 'lebanon', 'dahieh', 'beirut', 'northern-front', 'ground-invasion', 'day-3'],
  },

  {
    id:        'evt-029',
    timestamp: '2026-03-02T06:00:00Z',
    severity:  'CRITICAL',
    type:      'MILITARY',
    title:     'Iran drone strikes RAF Akrotiri — first attack on a UK sovereign base; MoD evacuates families',
    location:  'RAF Akrotiri, Cyprus',
    summary:   'An Iranian drone struck RAF Akrotiri, a UK sovereign base in Cyprus, at approximately midnight local time. No casualties reported but the Ministry of Defence confirmed a "suspected drone strike" and evacuated military families living on the base. Cypriot President Christodoulides confirmed it was an Iranian drone. The strike came hours after PM Starmer authorized US use of UK bases for defensive operations — effectively dragging an EU member state\'s territory into the conflict. Reuters described it as "a marked escalation."',
    fullContent: `UK Ministry of Defence spokesperson: "Our armed forces are responding to a suspected drone strike at RAF Akrotiri in Cyprus at midnight local time."

Cypriot President Nikos Christodoulides confirmed it was an Iranian drone, per BBC News.

Details:
• The drone struck RAF Akrotiri at approximately midnight local time (22:00 UTC March 1).
• Limited damage, no casualties.
• MoD evacuated military families living on the base as a precaution (Daily Mail confirmed).
• Officials believe the drone originated from Iran or an Iranian proxy (possibly Houthi or IRGC launch from Iraq/Syria).

Strategic significance:
• RAF Akrotiri is a British Sovereign Base Area — UK sovereign territory, not Cypriot.
• The strike came hours after PM Starmer gave consent for the US to use UK bases (including Akrotiri) for defensive operations against Iranian missiles and drones.
• This makes it the first direct Iranian strike on a European NATO ally's territory.
• Reuters described it as "a marked escalation effectively dragging an EU member state's sovereign territory into the conflict."
• Cyprus is an EU member; an attack on its sovereign base areas raises questions about NATO Article 5 (UK is NATO member) and EU mutual defense obligations.

UK Defence Secretary John Healey convened an emergency COBRA meeting. UK military posture has shifted from "enabling defensive operations" to "directly under attack."`,
    verified: true,
    sources: [
      { name: 'UK Ministry of Defence',  tier: 1, reliability: 99 },
      { name: 'BBC News',                tier: 1, reliability: 96 },
      { name: 'Reuters',                 tier: 1, reliability: 99 },
      { name: 'Guardian',                tier: 1, reliability: 95 },
      { name: 'Daily Mail',              tier: 2, reliability: 80 },
    ],
    actorResponses: [
      { actorId: 'uk',     actorName: 'UK MoD Spokesperson',           stance: 'NEUTRAL',    type: 'STATEMENT', statement: 'Our armed forces are responding to a suspected drone strike at RAF Akrotiri in Cyprus at midnight local time.' },
      { actorId: 'cyprus', actorName: 'President Christodoulides',     stance: 'NEUTRAL',    type: 'STATEMENT', statement: 'An Iranian drone crashed into the British RAF base in Cyprus.' },
    ],
    tags: ['raf-akrotiri', 'cyprus', 'uk', 'drone', 'nato', 'eu', 'escalation', 'day-3'],
  },

  {
    id:        'evt-030',
    timestamp: '2026-03-02T11:18:00Z',
    severity:  'CRITICAL',
    type:      'MILITARY',
    title:     'CENTCOM confirms: 3 US F-15s shot down by Kuwaiti air defenses in friendly fire incident',
    location:  'Kuwait',
    summary:   'US Central Command confirmed that three US F-15 fighter jets were shot down over Kuwait by Kuwaiti air defenses in a friendly fire incident. All six aircrew ejected safely and are in stable condition. CENTCOM: "During active combat that included attacks from Iranian aircraft, ballistic missiles, and drones — the US Air Force fighter jets were mistakenly shot down by Kuwaiti air defenses." Video showed at least one F-15 spinning to the ground on fire. This is the most significant friendly fire incident involving US aircraft since the 2003 Iraq War.',
    fullContent: `US Central Command released a full statement (centcom.mil):

"Three U.S. F-15s involved in friendly fire incident in Kuwait — pilots safe."

"During active combat — that included attacks from Iranian aircraft, ballistic missiles, and drones — the U.S. Air Force fighter jets were mistakenly shot down by Kuwaiti air defenses."

"The three jets went down over Kuwait due to an apparent friendly fire incident."

"All six aircrew ejected safely, have been safely recovered and are in stable condition."

"The circumstances surrounding the incident remain under investigation and additional information will be released as it becomes available."

Earlier Monday, Kuwait's Ministry of Defence had announced that "several United States military aircraft crashed" without specifying the cause. The War Zone (twz.com) published footage showing an F-15 spinning to the ground while on fire, and a separate video of a pilot being ejected and recovered.

Analysis:
• The fog of war during intense Iranian missile/drone fire caused Kuwaiti air defense operators to misidentify friendly aircraft as hostile incoming threats.
• This is the most significant friendly fire incident involving US aircraft since the 2003 Iraq War (where a US Patriot battery shot down a RAF Tornado GR4 and a US Navy F/A-18C).
• The loss of 3x F-15s (est. $200M+ in aircraft) is a significant material loss, though all crew surviving mitigates the human cost.
• The incident raises questions about air defense coordination (IFF — Identification Friend or Foe) in the chaotic multi-threat environment over the Gulf.`,
    verified: true,
    sources: [
      { name: 'CENTCOM official statement',  tier: 1, reliability: 99 },
      { name: 'Guardian',                    tier: 1, reliability: 95 },
      { name: 'CNN',                         tier: 1, reliability: 95 },
      { name: 'The War Zone',                tier: 2, reliability: 88 },
      { name: 'Telegraph',                   tier: 1, reliability: 93 },
    ],
    actorResponses: [
      { actorId: 'us', actorName: 'CENTCOM', stance: 'NEUTRAL', type: 'STATEMENT', statement: 'Three US F-15s went down over Kuwait due to an apparent friendly fire incident during active combat. All six aircrew ejected safely and are in stable condition.' },
    ],
    tags: ['kuwait', 'f-15', 'friendly-fire', 'centcom', 'air-defense', 'day-3'],
  },

  {
    id:        'evt-031',
    timestamp: '2026-03-02T07:30:00Z',
    severity:  'CRITICAL',
    type:      'ECONOMIC',
    title:     'Saudi Ras Tanura refinery shuts after drone strike — 550K bbl/day offline; oil prices surge further',
    location:  'Ras Tanura, Saudi Arabia / Global markets',
    summary:   'Saudi Aramco shut some operations at its Ras Tanura refinery — the largest in the Middle East at 550,000 barrels per day capacity — after two drones were intercepted in its vicinity, causing "minor damage from falling debris" and a fire. The Saudi energy ministry said the shutdown was precautionary and "without any impact on the supply of petroleum products to local markets." Bloomberg and Reuters confirmed the partial shutdown. Separately, Israeli and Kurdish oil and gas fields were also shut amid the strikes. Oil prices had already surged 8–9% on Sunday evening; Dow futures dropped nearly 600 points.',
    fullContent: `Bloomberg first reported: "Aramco halted operations at Saudi Arabia's largest refinery at Ras Tanura on the Persian Gulf coast after a drone strike in the area."

Reuters confirmed: "Saudi Arabia shut its biggest domestic oil refinery on Monday after a drone strike, a source said, as Israeli and U.S. strikes and Iranian retaliation forced shutdowns of oil and gas facilities across the Middle East."

Ras Tanura details:
• Capacity: 550,000 barrels per day — largest in the Middle East.
• Located on the Persian Gulf coast in Saudi Arabia's Eastern Province.
• Previously targeted in 2021 by Houthis (no damage then).
• Saudi defence ministry said it downed incoming drones with no injuries.
• Aramco shut the refinery "as a precaution" while assessing damages.

Broader energy impact:
• Reuters: "Israeli and U.S. strikes and Iranian retaliation forced shutdowns of oil and gas facilities across the Middle East."
• Kurdish oil and gas fields also shut amid the conflict.
• Israeli energy infrastructure affected.
• Combined with Hormuz closure and tanker attacks, this is the most severe supply disruption since 1973.

Markets (Monday morning):
• Brent crude: ~$79.50 (up ~9% from Friday close, continuing to climb).
• WTI: ~$72.80 (up ~8.5%).
• Dow futures: down nearly 600 points.
• CNBC: "Stocks to come under pressure Monday" following Iran strikes.
• Total flight cancellations across 3 days: ~6,000+.`,
    verified: true,
    sources: [
      { name: 'Bloomberg',            tier: 1, reliability: 97 },
      { name: 'Reuters',              tier: 1, reliability: 99 },
      { name: 'CNBC',                 tier: 1, reliability: 95 },
      { name: 'The National (UAE)',   tier: 2, reliability: 88 },
    ],
    actorResponses: [
      { actorId: 'saudi', actorName: 'Saudi Defence Ministry', stance: 'NEUTRAL', type: 'STATEMENT', statement: 'Saudi Arabia downed incoming drones. There were no reported injuries. Investigations into the Ras Tanura incident are continuing.' },
    ],
    tags: ['ras-tanura', 'aramco', 'oil', 'refinery', 'saudi', 'markets', 'dow', 'day-3'],
  },

  {
    id:        'evt-032',
    timestamp: '2026-03-02T04:17:00Z',
    severity:  'HIGH',
    type:      'DIPLOMATIC',
    title:     'Larijani: "We will not negotiate with the United States" — rejects Trump\'s claim Iran wants talks',
    location:  'Tehran',
    summary:   'Ali Larijani, Secretary of Iran\'s Supreme National Security Council, posted on X at 9:47 AM Tehran time: "We will not negotiate with the United States." This directly contradicts Trump, who told The Atlantic that Iran\'s new leadership "wanted to talk" and that he had "agreed to talk." Larijani also wrote that Trump\'s "wishful thinking" had dragged the region into an unnecessary war. The rejection signals the hardline faction within the interim leadership council is asserting dominance over the reformist Pezeshkian.',
    fullContent: `Ali Larijani, Secretary of Iran's Supreme National Security Council, posted on X (formerly Twitter) at 9:47 AM IST (04:17 UTC) on March 2, 2026:

"We will not negotiate with the United States."

In a follow-up post, Larijani wrote that President Trump's "wishful thinking" had dragged the region into an unnecessary war.

Context:
This directly contradicts Trump, who in an interview with The Atlantic said: "They want to talk and I have agreed to talk, so I will be talking to them. They should have done it sooner. They should have given what was very practical and easy to do sooner. They waited too long."

Analysis:
• Larijani is a powerful conservative figure — Secretary of the SNSC is arguably the most influential security role after the Supreme Leader.
• His public rejection suggests the hardline faction (backed by IRGC remnant leadership and Mohseni-Ejei on the interim council) is overriding any diplomatic signals from reformist President Pezeshkian.
• The Omani FM's backchannel efforts from March 1 now appear undercut.
• A US official had told Al Jazeera on March 1 that the conflict would "last for weeks, not just days" — Larijani's statement confirms there is no near-term diplomatic off-ramp.`,
    verified: true,
    sources: [
      { name: 'Al Jazeera',       tier: 1, reliability: 95 },
      { name: 'NYT',              tier: 1, reliability: 97 },
      { name: 'CNBC TV18',        tier: 2, reliability: 88 },
      { name: 'Firstpost',        tier: 2, reliability: 85 },
    ],
    actorResponses: [
      { actorId: 'iran', actorName: 'Ali Larijani (SNSC)',  stance: 'OPPOSING', type: 'STATEMENT', statement: 'We will not negotiate with the United States. Trump\'s wishful thinking has dragged the region into an unnecessary war.' },
    ],
    tags: ['larijani', 'negotiations-rejected', 'diplomacy', 'hardliners', 'day-3'],
  },

  {
    id:        'evt-033',
    timestamp: '2026-03-02T09:00:00Z',
    severity:  'HIGH',
    type:      'INTELLIGENCE',
    title:     'IAEA Grossi warns of mass evacuations if nuclear power stations attacked — 555 killed in Iran',
    location:  'Vienna / Tehran',
    summary:   'IAEA Director General Grossi warned at the quarterly Board of Governors meeting that "mass evacuation of cities across the Middle East may be necessary" if civil nuclear power stations are attacked, leading to radiological release. He noted the UAE has 4 operating nuclear reactors, and Jordan/Syria have research reactors. "We cannot rule out a possible radiological release with serious consequences, including the necessity to evacuate areas as large or larger than major cities." Separately, Iran\'s Red Crescent Society updated the death toll to 555 killed across 131 Iranian cities, with 100,000 rescuers on "full alert" and 4 million volunteers on standby.',
    fullContent: `IAEA DG Grossi at the IAEA Board of Governors opening (March 2, Vienna):

"We cannot rule out a possible radiological release with serious consequences, including the necessity to evacuate areas as large or larger than major cities."

"Let me underline that the situation today is very concerning. Iran and many other countries in the region that have been subject to military attacks have operational nuclear power plants and nuclear research reactors, as well as associated fuel storage sites, increasing the threat to nuclear safety."

He listed at-risk facilities:
• UAE: 4 operating nuclear reactors (Barakah Nuclear Energy Plant).
• Jordan and Syria: Operational nuclear research reactors.
• Bahrain, Iraq, Kuwait, Oman, Qatar, Saudi Arabia: "These countries all use nuclear applications of some sort. We therefore urge utmost restraint in all military operations."

On Iran's struck facilities: "We have no indication that any of the nuclear installations, including the Bushehr nuclear power plant, the Tehran research reactor, or other nuclear fuel cycle facilities have been damaged or hit. Efforts to contact the Iranian nuclear regulatory authorities continue with no response so far."

He expressed "a strong sense of frustration" that negotiations had failed: "Diplomacy is hard, but it is never impossible. Nuclear diplomacy is even more difficult, but it's never impossible."

Iranian Red Crescent Society (Telegram post, March 2):
• 555 people killed in Iran across 131 cities from US-Israeli strikes.
• Over 100,000 rescuers on "full alert."
• Network of approximately 4 million volunteers on standby for humanitarian services and psychosocial support.
• Guardian noted: "We have not been able to independently verify these figures yet."`,
    verified: true,
    sources: [
      { name: 'Guardian (Patrick Wintour)', tier: 1, reliability: 95 },
      { name: 'IAEA Board of Governors',   tier: 1, reliability: 99 },
      { name: 'Iranian Red Crescent (Telegram)', tier: 2, reliability: 80 },
    ],
    actorResponses: [
      { actorId: 'iaea', actorName: 'IAEA DG Grossi',  stance: 'NEUTRAL', type: 'STATEMENT', statement: 'We cannot rule out a possible radiological release requiring evacuation of areas as large or larger than major cities. We urge utmost restraint.' },
    ],
    tags: ['iaea', 'nuclear-safety', 'grossi', 'uae-reactors', 'casualties-555', 'evacuation', 'day-3'],
  },

  {
    id:        'evt-034',
    timestamp: '2026-03-02T06:30:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'Smoke rises near US Embassy in Kuwait City — embassy says "continuing threat"; shelter in place',
    location:  'Kuwait City, Kuwait',
    summary:   'AFP correspondents reported smoke rising from the area where the US Embassy is located in Kuwait City on Monday morning. The embassy did not confirm it was directly hit but issued a security alert: "There is a continuing threat of missile and UAV attacks over Kuwait. Do not come to the embassy. US Embassy personnel are sheltering in place." This follows the 3 US KIA at Ali Al Salem and the crash of several US warplanes in Kuwait the same morning.',
    fullContent: `AFP (via Kuwait Times): An AFP correspondent reported smoke rising from the area where the US Embassy is located in Kuwait City on Monday, March 2.

US Embassy Kuwait security alert:
"There is a continuing threat of missile and UAV attacks over Kuwait. Do not come to the Embassy. Take cover in your residence on the lowest available floor and away from windows. US Embassy personnel are sheltering in place."

The embassy did not announce it had been directly hit.

This adds to the escalating situation in Kuwait:
• March 1: 3 US service members killed at Ali Al Salem AB (Army sustainment unit).
• March 2 morning: "Several" US warplanes crashed during intense Iranian fire — all crew survived.
• March 2 morning: Smoke rising near US Embassy.
• Kuwait was one of the Gulf states struck by Iranian retaliatory missiles from Day 1.

DW News: "Iran: Smoke rises from US embassy in Kuwait."
CBS News: "U.S. Embassy personnel are sheltering in place."`,
    verified: true,
    sources: [
      { name: 'AFP / Kuwait Times',   tier: 1, reliability: 95 },
      { name: 'DW News',              tier: 1, reliability: 93 },
      { name: 'CBS News',             tier: 1, reliability: 95 },
      { name: 'US Embassy Kuwait',    tier: 1, reliability: 99 },
    ],
    actorResponses: [],
    tags: ['kuwait', 'embassy', 'smoke', 'shelter-in-place', 'day-3'],
  },

  {
    id:        'evt-035',
    timestamp: '2026-03-02T05:00:00Z',
    severity:  'HIGH',
    type:      'POLITICAL',
    title:     'Trump: Iran operation could take "four weeks or less" — Daily Mail interview',
    location:  'Washington D.C.',
    summary:   'In an interview with the Daily Mail, Trump said the operation against Iran could take approximately four weeks. "It was always a four-week process. It\'s a big country. It will take four weeks or less." This was the first time the US president gave a specific timeline for the operation. Separately, Trump told Fox News that 48 leaders had been killed. A US official told Al Jazeera the conflict would "last for weeks, not just days" and would continue until the US can "guarantee Iran does not possess nuclear weapons or ballistic missiles."',
    fullContent: `Trump interview with the Daily Mail (published March 1/2):

"It was always a four-week process. It's a big country. It will take four weeks or less."

This was the first specific operational timeline given by the US president.

Related statements:
• Trump to Fox News: "Nobody can believe the success we're having. 48 leaders are gone in one shot."
• US official to Al Jazeera: The conflict would "last for weeks, not just days" and continue "until it can guarantee Iran does not possess nuclear weapons or ballistic missiles."
• CBS News headline: "Trump says Iran operation could take 'four weeks or less,' 3 U.S. troops killed."

Analysis:
A 4-week timeline suggests the US is planning an extended air campaign, not a quick strike-and-withdraw. This aligns with:
• Continued IDF strikes on IRGC command infrastructure (Day 2-3).
• Task Force Scorpion Strike drone operations (ongoing).
• Systematic destruction of Iran's navy (9 warships, naval HQ).
• SEAD operations degrading Iranian air defense.
• The opening of the Lebanon front (complicating Israeli focus).

The timeline also explains why the US is not rushing to negotiate — Trump sees this as a methodical campaign with defined objectives, not a punitive raid.`,
    verified: true,
    sources: [
      { name: 'Daily Mail interview',  tier: 2, reliability: 85 },
      { name: 'CBS News',              tier: 1, reliability: 95 },
      { name: 'Al Jazeera (US official)', tier: 1, reliability: 93 },
      { name: 'Fox News (Trump)',       tier: 2, reliability: 85 },
    ],
    actorResponses: [
      { actorId: 'us', actorName: 'President Trump', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'It was always a four-week process. It\'s a big country. It will take four weeks or less.' },
    ],
    tags: ['trump', 'timeline', 'four-weeks', 'campaign-duration', 'day-3'],
  },

  {
    id:        'evt-036',
    timestamp: '2026-03-02T11:00:00Z',
    severity:  'HIGH',
    type:      'DIPLOMATIC',
    title:     'US and 6 Gulf states joint statement: Iran\'s "indiscriminate and reckless attacks" condemn',
    location:  'Washington D.C. / Gulf region',
    summary:   'The United States and six Gulf allied states — Kuwait, Saudi Arabia, Bahrain, Qatar, Jordan, and the UAE — issued a joint statement condemning Iran\'s "indiscriminate and reckless attacks across the region, which targeted sovereign territories, endangered civilians, and inflicted damage on civilian infrastructure." The statement confirmed attacks in Bahrain, Iraq (including Kurdistan), Jordan, Kuwait, Oman, Qatar, Saudi Arabia, and the UAE. They affirmed their "right to self-defense" and commended "effective cooperation in air and missile defense that prevented greater loss of life."',
    fullContent: `Joint statement from the US and six allied Gulf states:

"Iran's actions represent a dangerous escalation that violates the sovereignty of multiple states and threatens regional stability."

"Targeting civilians and non-combatant states is reckless behavior that undermines stability."

"We stand united in defense of our citizens, our sovereignty, and our territories, and we reaffirm our right to self-defense in the face of these attacks, while underscoring our commitment to regional security and commending the effective cooperation in air and missile defense that prevented greater loss of life and destruction."

Signatories: United States, Kuwait, Saudi Arabia, Bahrain, Qatar, Jordan, United Arab Emirates.

The statement confirmed Iranian attacks occurred in: Bahrain, Iraq (including the Kurdistan Region), Jordan, Kuwait, Oman, Qatar, Saudi Arabia, and the United Arab Emirates.

This is the broadest US-Gulf coalition statement since the 1991 Gulf War. The inclusion of Qatar is notable — Qatar has historically maintained closer ties to Iran than other Gulf states and hosts the Al Udeid US air base.`,
    verified: true,
    sources: [
      { name: 'Guardian',     tier: 1, reliability: 95 },
      { name: 'Reuters',      tier: 1, reliability: 99 },
      { name: 'AP',           tier: 1, reliability: 98 },
    ],
    actorResponses: [],
    tags: ['gulf-coalition', 'joint-statement', 'sovereignty', 'air-defense', 'day-3'],
  },

  {
    id:        'evt-037',
    timestamp: '2026-03-02T12:00:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'Two more drones heading toward RAF Akrotiri intercepted — Cyprus government confirms',
    location:  'RAF Akrotiri, Cyprus',
    summary:   'Two unmanned drones heading toward RAF Akrotiri in Cyprus were "successfully intercepted," Cyprus government spokesperson Konstantinos Letymbiotis confirmed. This comes after the first Iranian drone struck the UK base overnight. The repeated targeting of a UK sovereign base in an EU member state represents a sustained attempt by Iran to punish the UK for authorizing US use of its bases.',
    fullContent: `Cyprus government spokesperson Konstantinos Letymbiotis confirmed that two unmanned drones heading toward RAF Akrotiri in Cyprus were "successfully intercepted."

This is the third drone targeting the UK base:
• Overnight: 1 Iranian drone struck RAF Akrotiri — limited damage, no casualties, families evacuated.
• Midday March 2: 2 additional drones heading toward Akrotiri intercepted before reaching the base.

The sustained targeting suggests Iran views UK bases as legitimate targets following Starmer's authorization of US use of UK facilities for defensive operations.

Cyprus — an EU member state — is now effectively under sustained drone attack from Iran, raising questions about EU mutual defense obligations and NATO coordination.`,
    verified: true,
    sources: [
      { name: 'Guardian',                        tier: 1, reliability: 95 },
      { name: 'Cyprus Government Spokesperson',  tier: 1, reliability: 95 },
    ],
    actorResponses: [],
    tags: ['raf-akrotiri', 'cyprus', 'drones', 'intercepted', 'uk', 'day-3'],
  },

  {
    id:        'evt-038',
    timestamp: '2026-03-02T10:00:00Z',
    severity:  'CRITICAL',
    type:      'ECONOMIC',
    title:     'QatarEnergy halts all LNG production after Iran attacks on Ras Laffan and Mesaieed',
    location:  'Ras Laffan / Mesaieed, Qatar',
    summary:   'QatarEnergy — the world\'s largest LNG producer — announced the suspension of all LNG production after Iranian drone attacks struck its facilities at Ras Laffan Industrial City and Mesaieed Industrial City. The company was set to declare force majeure on its LNG shipments. 82% of QatarEnergy\'s clients are Asian, meaning the shutdown will severely impact energy supplies to Japan, South Korea, China, and India. European gas prices surged on the news. This is the most significant attack on global energy infrastructure since the 1990 Iraqi invasion of Kuwait.',
    fullContent: `QatarEnergy official statement (March 2): "Due to military attacks on QatarEnergy's operating facilities in Ras Laffan Industrial City and Mesaieed Industrial City in the State of Qatar, QatarEnergy has ceased production of liquefied natural gas (LNG) and associated products."

Ras Laffan Industrial City is the world's largest LNG production hub. QatarEnergy produces approximately 77 million tonnes per annum (MTPA) of LNG — nearly one-third of global LNG supply.

Reuters confirmed: QatarEnergy was set to declare force majeure on its LNG shipments after Iranian drone attacks.

Impact:
• 82% of QatarEnergy's clients are Asian (Japan, South Korea, China, India, Taiwan).
• European gas prices surged immediately. TTF benchmark jumped 18%.
• Combined with Hormuz closure (blocking tanker transit), Qatar's land-based production shutdown, and Saudi Ras Tanura refinery closure — the Gulf is now effectively a no-go zone for energy production AND export.
• Al Jazeera: "Gas prices soar as QatarEnergy halts LNG production after Iran attacks."
• CNBC confirmed the attacks struck both Ras Laffan and Mesaieed.

This escalation is particularly significant because Qatar had maintained closer ties to Iran than other Gulf states and was a signatory to the March 2 joint statement condemning Iran. Iran striking Qatari energy infrastructure represents burning the last remaining Gulf diplomatic bridge.`,
    verified: true,
    sources: [
      { name: 'Al Jazeera',          tier: 1, reliability: 95 },
      { name: 'Reuters',             tier: 1, reliability: 99 },
      { name: 'CNBC',                tier: 1, reliability: 95 },
      { name: 'Khaleej Times',       tier: 2, reliability: 88 },
      { name: 'The Peninsula Qatar', tier: 2, reliability: 88 },
    ],
    actorResponses: [
      { actorId: 'qatar', actorName: 'QatarEnergy', stance: 'NEUTRAL', type: 'STATEMENT', statement: 'Due to military attacks on our operating facilities in Ras Laffan and Mesaieed, QatarEnergy has ceased production of LNG and associated products.' },
    ],
    tags: ['qatar', 'lng', 'ras-laffan', 'mesaieed', 'energy', 'force-majeure', 'day-3'],
  },

  {
    id:        'evt-039',
    timestamp: '2026-03-02T13:00:00Z',
    severity:  'CRITICAL',
    type:      'POLITICAL',
    title:     'Hegseth Pentagon briefing: "not endless war", 3-part mission, 4th US KIA confirmed, 1,000+ targets hit',
    location:  'Pentagon, Washington D.C.',
    summary:   'Defense Secretary Pete Hegseth and Joint Chiefs Chairman Gen. Dan Caine gave a press briefing at the Pentagon. Hegseth outlined a three-part mission: destroy offensive missile systems, dismantle production, ensure Iran never gets a nuclear weapon. He confirmed a 4th US service member killed and 18 total wounded. Over 1,000 targets struck in first 24 hours, "tens of thousands of pieces of ordnance" delivered. Caine: "This work is just beginning." Hegseth rejected Iraq comparisons — "This is not endless war. This is not Iraq. This is not nation building." He refused to set a timetable: "I would never hang a timeframe." No boots on ground in Iran currently. US Cyber Command and Space Command also involved.',
    fullContent: `Defense Secretary Pete Hegseth and Chairman of the Joint Chiefs of Staff Gen. Dan Caine held a Pentagon press briefing on Monday, March 2, 2026 — approximately 57 hours into Operation Epic Fury.

Key announcements:

Three-part mission:
1. Destroy Iran's offensive missile systems
2. Dismantle missile production capacity
3. Ensure Tehran never obtains a nuclear weapon

Hegseth: "Our ambitions are not utopian; they are realistic."

Operational details:
• 1,000+ targets struck in first 24 hours.
• "Tens of thousands of pieces of ordnance" delivered since operations began.
• More than 100 aircraft launched at H-hour from land bases and carrier decks in synchronized wave.
• Fighters, refueling tankers, AWACS, bombers, and unmanned systems moved together.
• US Navy destroyers fired Tomahawk cruise missiles.
• US Cyber Command disrupted Iranian radar and communications before and during strikes.
• US Space Command involved in coordination.
• Two carrier strike groups operating: USS Gerald R. Ford and USS Abraham Lincoln.

Casualties:
• 4 US service members killed since operation began (up from 3).
• 18 total wounded (significant increase from previous 5 seriously wounded figure).
• One Iranian missile penetrated layered air defenses and hit a fortified tactical operations center.
• US and partner air defenses have intercepted "hundreds" of ballistic missiles and drones.

On duration: "I would never hang a timeframe. We will execute on the president's terms."
On Iraq comparison: "This is not endless war. This is not Iraq. This is not nation building."
On boots on ground: "There are no American boots on the ground inside Iran." Declined to outline future limits: "Why in the world would we tell the enemy what we will or will not do?"

Gen. Caine: "This work is just beginning." Described opening hours as "one of the most complex joint operations in recent memory."

Coalition air defense: Qatar, UAE, Kuwait, Jordan, Saudi Arabia operating alongside US Patriot and THAAD batteries.`,
    verified: true,
    sources: [
      { name: 'Military.com / AP photo',  tier: 1, reliability: 95 },
      { name: 'Reuters',                   tier: 1, reliability: 99 },
      { name: 'Fox News',                  tier: 2, reliability: 85 },
      { name: 'Washington Post',           tier: 1, reliability: 97 },
    ],
    actorResponses: [
      { actorId: 'us', actorName: 'SecDef Hegseth',     stance: 'SUPPORTING', type: 'STATEMENT', statement: 'This is not endless war. This is not Iraq. This is not nation building. Our ambitions are not utopian — they are realistic.' },
      { actorId: 'us', actorName: 'Gen. Dan Caine (JCS)', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'This work is just beginning. The opening hours were one of the most complex joint operations in recent memory.' },
    ],
    tags: ['hegseth', 'pentagon', 'briefing', 'caine', 'us-kia-4', 'not-endless-war', 'day-3'],
  },

  {
    id:        'evt-040',
    timestamp: '2026-03-02T14:00:00Z',
    severity:  'CRITICAL',
    type:      'MILITARY',
    title:     'IDF launches "broad wave" of strikes on "heart of Tehran" — simultaneous Lebanon and Iran operations',
    location:  'Tehran, Iran / Lebanon',
    summary:   'The IDF announced an "additional wave of strikes against the Iranian terror regime at the heart of Tehran," guided by IDF intelligence. Simultaneously, the IDF said it was attacking Lebanon and Iran at the same time — a dual-front offensive. Iran\'s Tasnim news agency confirmed fresh explosions across Tehran. Separately, the IDF confirmed they are also striking Hezbollah targets in Beirut\'s southern suburbs, southern Lebanon, and the Bekaa Valley simultaneously with the Tehran strikes. This is the most complex multi-theater operation Israel has ever conducted.',
    fullContent: `IDF statement (via AFP): "The Israeli Air Force, guided by IDF intelligence, has begun an additional wave of strikes against the Iranian terror regime at the heart of Tehran."

The IDF confirmed it was striking Lebanon and Iran "simultaneously" — a dual-front offensive that has no precedent in Israeli military history.

Iran's semi-official Tasnim news agency confirmed explosions in multiple areas of Tehran.

The Guardian (March 2 live blog): "Israel launches new attacks on 'heart of Tehran'" — alongside images of new explosions over the Iranian capital.

Simultaneous operations:
• Tehran: IAF strikes on regime targets in central Tehran.
• Southern Lebanon: IDF striking Hezbollah positions.
• Dahieh (Beirut): Strikes on Hezbollah's stronghold.
• Bekaa Valley: IAF targeting Hezbollah infrastructure.

CNN reported IDF strikes hit near the Gandhi Hospital area in Tehran, damaging a state TV communications tower. Two witnesses told Reuters the hospital was badly damaged.

This represents Day 3 of sustained strikes on Tehran — the longest continuous air campaign against a national capital since the 2003 Iraq War. The simultaneous multi-theater nature of the operation (Iran + Lebanon + Gulf defense) is stretching both US and Israeli military resources.`,
    verified: true,
    sources: [
      { name: 'IDF Spokesperson / AFP', tier: 1, reliability: 90 },
      { name: 'Guardian live blog',      tier: 1, reliability: 95 },
      { name: 'Times of Israel',         tier: 2, reliability: 88 },
      { name: 'CNN',                     tier: 1, reliability: 95 },
      { name: 'Tasnim (semi-official)',   tier: 2, reliability: 70 },
    ],
    actorResponses: [
      { actorId: 'idf', actorName: 'IDF Spokesperson', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'The Israeli Air Force has begun an additional wave of strikes against the Iranian terror regime at the heart of Tehran.' },
    ],
    tags: ['tehran', 'heart-of-tehran', 'simultaneous', 'lebanon', 'multi-theater', 'day-3'],
  },

  {
    id:        'evt-041',
    timestamp: '2026-03-02T14:30:00Z',
    severity:  'HIGH',
    type:      'POLITICAL',
    title:     'Trump: "the big wave hasn\'t even happened yet" — doesn\'t rule out boots on ground in Iran',
    location:  'Washington D.C.',
    summary:   'President Trump gave interviews to CNN and the New York Post, signaling major escalation ahead. To CNN: "We\'re knocking the crap out of them... the big wave hasn\'t even happened yet." He said the operation was "a little ahead of schedule." To the New York Post: "I don\'t have the yips with respect to boots on the ground — like every president says, \'There will be no boots on the ground.\' I don\'t say it." He left open the possibility of sending ground troops into Iran "if they were necessary." He also said he is not swayed by polling showing disapproval of the strikes.',
    fullContent: `Trump gave two significant interviews on Monday, March 2:

CNN interview:
• "We're knocking the crap out of them."
• "The big wave hasn't even happened yet."
• "A little ahead of schedule."
• Left open possibility of ground troops "if they were necessary."
• Said he's not swayed by polling showing disapproval of strikes.

New York Post interview:
• "I don't have the yips with respect to boots on the ground — like every president says, 'There will be no boots on the ground.' I don't say it."
• This is the most explicit signal yet that a ground invasion of Iran is being considered.

Analysis:
• "The big wave hasn't even happened yet" — combined with Hegseth's "this work is just beginning" and Caine's similar language — suggests a significant escalation is planned in the coming days.
• The boots on ground comment directly contradicts Hegseth's earlier statement that there are currently no American troops in Iran, but leaves the door open for future deployment.
• Trump's dismissal of disapproval polling suggests he is committed to the operation regardless of domestic opposition.
• NBC, Guardian, NYMag all led with the "boots on the ground" headline.`,
    verified: true,
    sources: [
      { name: 'CNN interview',     tier: 1, reliability: 95 },
      { name: 'New York Post',     tier: 2, reliability: 85 },
      { name: 'NYT live updates',  tier: 1, reliability: 97 },
      { name: 'Guardian live blog', tier: 1, reliability: 95 },
      { name: 'NBC News',          tier: 1, reliability: 95 },
    ],
    actorResponses: [
      { actorId: 'us', actorName: 'President Trump', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'The big wave hasn\'t even happened yet. I don\'t have the yips with respect to boots on the ground.' },
    ],
    tags: ['trump', 'boots-on-ground', 'escalation', 'big-wave', 'ground-invasion', 'day-3'],
  },

  {
    id:        'evt-042',
    timestamp: '2026-03-02T12:30:00Z',
    severity:  'HIGH',
    type:      'DIPLOMATIC',
    title:     'Crown Prince MBS vows military force against further Iranian incursions into Saudi airspace',
    location:  'Riyadh, Saudi Arabia',
    summary:   'Saudi Crown Prince Mohammed bin Salman, with US backing, vowed to employ military force against further Iranian incursions into Saudi territory. He called Iranian strikes "cowardly" — notably, Iran had targeted Saudi airspace despite Saudi Arabia closing its airspace to US and Israeli attackers. CNN reported MBS\'s vow came with direct US backing. This represents a significant shift: Saudi Arabia moving from passive air defense coordination to threatening active military response against Iran.',
    fullContent: `CNN reported that Crown Prince Mohammed bin Salman (MBS), with US backing, vowed to employ military force against further Iranian incursions, calling Iranian strikes "cowardly."

Context:
• Saudi Arabia had closed its airspace to US and Israeli attack aircraft — attempting to maintain a degree of neutrality.
• Despite this, Iran targeted Saudi territory with missiles and drones, hitting near Riyadh and in the Eastern Province.
• The Saudi Ministry of Foreign Affairs confirmed strikes targeting both the capital Riyadh and the Eastern Province (home to major oil infrastructure and King Abdulaziz Air Base).
• Saudi Arabia has officially reported no casualties.
• However, the Ras Tanura refinery (550K bbl/day) was shut after drone strikes hit the vicinity.

MBS's statement represents a significant posture shift:
• From: passive air defense participation (intercepting missiles over Saudi territory).
• To: threatening active military response against Iran.
• This is the strongest Saudi language against Iran since the 2019 Aramco attacks.

The "with US backing" qualifier from CNN is significant — it suggests Washington is actively building a broader military coalition against Iran, potentially including Saudi offensive action.

Erdogan separately spoke with MBS expressing concern about wider escalation.

Wikipedia (March 2 section): "CNN reported that Crown Prince Salman, with US backing, vowed to employ military force against further Iranian incursions, calling Iranian strikes 'cowardly' due to Saudi airspace being closed to US and Israeli attackers."`,
    verified: true,
    sources: [
      { name: 'CNN',                tier: 1, reliability: 95 },
      { name: 'Wikipedia aggregation', tier: 2, reliability: 85 },
      { name: 'Guardian',            tier: 1, reliability: 95 },
    ],
    actorResponses: [
      { actorId: 'saudi', actorName: 'Crown Prince MBS', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'Saudi Arabia will employ military force against further Iranian incursions. These strikes are cowardly — our airspace was closed to US and Israeli forces.' },
    ],
    tags: ['mbs', 'saudi', 'military-force', 'coalition', 'airspace', 'day-3'],
  },

  {
    id:        'evt-043',
    timestamp: '2026-03-02T10:30:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'IRGC claims: 60 strategic targets, 500 facilities hit; 700+ drones, hundreds of missiles fired in 2 days',
    location:  'Tehran (statement) / Middle East (targets)',
    summary:   'The IRGC released a summary of its retaliatory operations over the first two days of the conflict. The Guards claimed they attacked 60 "strategic targets" and 500 US/Israeli military facilities, firing over 700 drones and hundreds of missiles of various types. Separately, Iran claimed 560 US personnel were killed or wounded — a claim firmly rejected by Washington (actual US figures: 4 KIA, 18 wounded). While the IRGC figures are inflated, the scale of Iran\'s response — even discounted — represents the largest retaliatory barrage in Iranian military history.',
    fullContent: `IRGC statement (via Euronews, Pravda News): "Since the start of the conflict, the brave soldiers of the Iranian armed forces have attacked 60 strategic targets and 500 American military targets and targets of the Zionist regime."

Claimed weapons employed:
• 700+ drones launched
• "Hundreds" of ballistic and cruise missiles

Additional Iranian claims:
• 560 US personnel killed or wounded — Washington firmly rejected this, with CENTCOM confirming 4 KIA and 18 wounded.
• "All Israeli and US military targets in the Middle East have been struck" — also false per independent reporting.

Assessment:
• While IRGC claims are systematically inflated (as documented in previous True Promise operations), the underlying scale is real.
• Iran HAS struck targets in 9+ countries: Bahrain, Iraq, Jordan, Kuwait, Oman, Qatar, Saudi Arabia, UAE, Israel, and Cyprus (UK base).
• Even discounting by 50-70% (standard IRGC inflation), this represents hundreds of actual missile/drone launches — far exceeding any previous Iranian military operation.
• CENTCOM's own admission of "hundreds" of intercepted missiles and drones corroborates a massive barrage even if Iran's specific claims are exaggerated.
• This is the largest Iranian retaliatory operation in history — dwarfing True Promise 1 (April 2024: ~300 drones and missiles) and True Promise 2/3.`,
    verified: true,
    sources: [
      { name: 'Euronews',                     tier: 2, reliability: 88 },
      { name: 'Pravda News (IRGC statement)',  tier: 3, reliability: 60 },
      { name: 'SSBCrack (claims analysis)',    tier: 3, reliability: 70 },
    ],
    actorResponses: [
      { actorId: 'irgc', actorName: 'IRGC Statement', stance: 'OPPOSING', type: 'STATEMENT', statement: 'Iranian armed forces have attacked 60 strategic targets and 500 American and Zionist facilities, firing 700+ drones and hundreds of missiles.' },
    ],
    tags: ['irgc', 'claims', 'true-promise-4', '700-drones', 'propaganda', 'day-3'],
  },

  {
    id:        'evt-044',
    timestamp: '2026-03-02T08:00:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'US/Israel strike Jurf al-Sakher PMF base in Iraq — 2 Kataib Hezbollah fighters killed, 5 wounded',
    location:  'Jurf al-Sakher (Jurf al-Nasr), Iraq',
    summary:   'US and Israeli forces targeted the Jurf al-Sakher base in southern Iraq, which houses the Popular Mobilisation Forces (PMF) — mostly Shia fighters — and the Iran-backed Iraqi paramilitary group Kataib Hezbollah. Iraqi state media and sources within Kataib Hezbollah confirmed 2 fighters killed and 5 wounded. Separately, powerful explosions were reported near the US consulate and international airport in Erbil, northern Iraq. This represents the opening of an Iraqi front — the first direct US/Israeli strikes on Iraqi-based Iranian proxies in this conflict.',
    fullContent: `Al Jazeera confirmed: The US and Israel targeted the Jurf al-Sakher base (also known as Jurf al-Nasr) in southern Iraq.

The base houses:
• Popular Mobilisation Forces (PMF / Hashd al-Shaabi) — a coalition of mostly Shia fighters, formally part of Iraqi security forces but with strong ties to Iran.
• Kataib Hezbollah — an Iran-backed Iraqi paramilitary group designated as a terrorist organization by the US.

Casualties:
• Iraqi state media: 2 fighters killed, 5 wounded.
• Kataib Hezbollah internal sources confirmed the same figures.

Northern Iraq:
• Several powerful explosions reported near the US consulate and Erbil International Airport in the semiautonomous Kurdistan Region.
• Air defenses intercepted drone attacks on Saturday per initial reports.
• The US is reported to still have troops in the Kurdish region.

Significance:
• This is the first confirmed US/Israeli strike on Iraqi territory in this conflict.
• Jurf al-Sakher has been under PMF control since 2014 when it was seized from ISIS.
• Striking PMF targets inside Iraq risks drawing the Iraqi government into the conflict and could trigger a replay of the 2020 crisis (when the US killed IRGC General Soleimani in Baghdad).
• The Iraqi government has called for restraint but has not condemned the strikes — a notable silence given Iraq's historical sensitivity to foreign military operations on its soil.`,
    verified: true,
    sources: [
      { name: 'Al Jazeera',              tier: 1, reliability: 95 },
      { name: 'Iraqi state media',       tier: 2, reliability: 80 },
      { name: 'Kataib Hezbollah sources', tier: 3, reliability: 70 },
    ],
    actorResponses: [],
    tags: ['iraq', 'pmf', 'kataib-hezbollah', 'jurf-al-sakher', 'proxy', 'day-3'],
  },

  // ── Day 3 Evening / Day 4 (March 2 PM – March 3) ───────────────────────────

  {
    id:        'evt-045',
    timestamp: '2026-03-02T16:00:00Z',
    severity:  'CRITICAL',
    type:      'POLITICAL',
    title:     'Trump White House address: 4 objectives laid out, war "4–5 weeks", could go "far longer"',
    location:  'White House, Washington D.C.',
    summary:   'President Trump gave his first in-person public address on the Iran operation at a Medal of Honor ceremony in the White House East Room. He laid out four objectives: (1) destroying Iran\'s conventional missile capabilities, (2) annihilating their navy, (3) ensuring Iran never obtains a nuclear weapon, (4) stopping the world\'s #1 sponsor of terror from funding groups. He said the war was this generation\'s "last best chance" to neutralize the Iranian threat. He estimated 4–5 weeks but said the US has "the capability to go far longer." He vowed to "avenge" the deaths of 6 US service members, and said more US troops were "likely" to die. He also confirmed the Khamenei kill, calling it "a very precise operation."',
    fullContent: `Trump spoke at 11 AM ET (16:00 UTC) on March 2 from the White House, before awarding the Medal of Honor to three soldiers.

Four stated objectives:
1. Destroy Iran's conventional ballistic missile capabilities
2. Annihilate their navy
3. Ensure Iran never obtains a nuclear weapon
4. Stop the world's #1 sponsor of terror from ever funding terrorist groups again

Key quotes:
• "This was our last best chance. Iran ignored every warning."
• "Iran's rapidly growing conventional ballistic missile program posed an unacceptable threat."
• "As one nation, we grieve for the true American patriots who have made the ultimate sacrifice."
• "We have the capability to go far longer" than 4–5 weeks.
• On boots on the ground: "I don't have the yips" — would not rule it out.

CNN analysis: Trump's messaging marked by "exaggerated threats and shifting, contradictory goals." His pre-war justifications included claims at times "at odds with US intelligence."

NPR: Hegseth's Pentagon briefing and Trump's White House address represented the administration's first coordinated public messaging — 57+ hours after the first strikes.

Speaker Johnson said he expected War Powers votes later this week to fail, calling the operation "limited in scope, limited in its objective."`,
    verified: true,
    sources: [
      { name: 'CBS News',     tier: 1, reliability: 95 },
      { name: 'NPR',          tier: 1, reliability: 95 },
      { name: 'Guardian',     tier: 1, reliability: 95 },
      { name: 'CNN',          tier: 1, reliability: 95 },
      { name: 'Al Jazeera',   tier: 1, reliability: 95 },
    ],
    actorResponses: [
      { actorId: 'us', actorName: 'President Trump', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'This was our last best chance. Iran ignored every warning. We have four objectives: destroy missiles, annihilate the navy, stop nukes, stop terror funding.' },
    ],
    tags: ['trump', 'white-house', 'objectives', '4-5-weeks', 'medal-of-honor', 'day-3'],
  },

  {
    id:        'evt-046',
    timestamp: '2026-03-02T23:00:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'IDF strikes and claims to "dismantle" IRIB state broadcaster headquarters in Tehran',
    location:  'Evin district, Tehran',
    summary:   'The IDF announced it had "struck and dismantled" the headquarters of Iran\'s state radio and television broadcaster (IRIB) in the Evin district of northern Tehran. The IDF described it as a "communications centre of the Iranian terrorist regime" used by the IRGC. Iran confirmed parts of the facilities were struck — IRINN (the news channel) said its offices were hit by four bombs. Two IRIB employees were killed, including IRINN\'s editor-in-chief. Broadcasting was briefly interrupted but resumed. Iran denied the building was "destroyed." The strike is significant as a psychological/information warfare operation — targeting the regime\'s primary propaganda infrastructure.',
    fullContent: `IDF statement: "The Israeli Air Force struck and dismantled the headquarters of the Islamic Republic of Iran Broadcasting (IRIB)."

The IDF said: "The activities taking place at the center were carried out and directed by the Iranian Revolutionary Guards Corps" and that the broadcaster "called for the destruction of the state of Israel and for the use of nuclear weapons."

Iran's response:
• IRINN (news channel) said its offices were struck by four bombs.
• Two employees killed, including IRINN's editor-in-chief.
• IRIB head confirmed the strike but said broadcasting continued — only a brief interruption.
• Iran denied the building was destroyed, saying only "parts of the facilities" were hit.

Straits Times: The IDF claimed the strike was carried out in the "Evin district of northern Tehran."

Deadline: Israel says IRIB has been "destroyed" but Iran pushed back.

Analysis:
• This is a classic information warfare/psychological operations strike — degrading the regime's ability to communicate with its own population.
• IRIB is the sole legal broadcaster in Iran with ~30 TV channels, 30+ radio stations.
• The strike also targeted the regime's narrative control during a leadership crisis (Khamenei dead, Assembly of Experts bombed).
• However, Iran managed to resume broadcasting relatively quickly, suggesting redundant transmission infrastructure.`,
    verified: true,
    sources: [
      { name: 'IDF Spokesperson',  tier: 1, reliability: 90 },
      { name: 'Straits Times',     tier: 1, reliability: 90 },
      { name: 'Deadline',          tier: 2, reliability: 85 },
      { name: 'Guardian live blog', tier: 1, reliability: 95 },
      { name: 'DW News',           tier: 1, reliability: 90 },
    ],
    actorResponses: [
      { actorId: 'idf', actorName: 'IDF Spokesperson', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'The Israeli Air Force struck and dismantled the headquarters of the IRIB — a communications centre of the Iranian terrorist regime directed by the IRGC.' },
    ],
    tags: ['irib', 'state-broadcaster', 'tehran', 'evin', 'psyops', 'information-warfare', 'day-3'],
  },

  {
    id:        'evt-047',
    timestamp: '2026-03-03T04:00:00Z',
    severity:  'CRITICAL',
    type:      'MILITARY',
    title:     'Iranian drones hit US Embassy in Riyadh — US closes embassies in Saudi Arabia and Kuwait',
    location:  'Riyadh, Saudi Arabia / Kuwait City',
    summary:   'Two Iranian drones struck the US Embassy in Saudi Arabia\'s capital Riyadh early Tuesday, causing a limited fire and minor material damage. The building was empty — no casualties. The Saudi Defense Ministry confirmed and said it also intercepted 8 additional drones near Riyadh and Al-Kharj. Hours later, the US closed its embassies in both Saudi Arabia and Kuwait and ordered nonessential staff to evacuate across the region. The Kuwait Embassy was separately "targeted" by Iran per Kuwait\'s Foreign Ministry. State Department issued travel advisories for 16 Middle Eastern countries "due to serious safety risks." This is the first strike on a US diplomatic compound since the 2012 Benghazi attack.',
    fullContent: `Saudi Defense Ministry (post on X): The US embassy in Riyadh was hit by two drones resulting in "a limited fire and some material damage" (initial assessment).

Reuters confirmed: The embassy building was empty at the time. No casualties.

NYT: "About two hours after announcing the drone attack, the Saudi defense ministry said it had intercepted and destroyed eight drones near the cities of Riyadh and Al-Kharj."

Kuwait:
• Kuwait's Foreign Ministry said the US Embassy in Kuwait City was "targeted" by Iran.
• The US Embassy in Kuwait announced it was closing until further notice.

State Department response:
• US closed embassies in Saudi Arabia and Kuwait on Tuesday.
• Ordered nonessential personnel to evacuate across the region.
• Travel advisories issued for 16 countries: Bahrain, Egypt, Iran, Iraq, Israel, West Bank, Gaza, Jordan, Kuwait, Lebanon, Oman, Qatar, Saudi Arabia, Syria, UAE, Yemen.

Analysis:
• Striking the US Embassy is an extreme escalation — even by Iranian standards. While the building was empty, the symbolic significance is immense.
• This is the first direct strike on a US diplomatic compound in the Middle East since Benghazi (2012).
• Combined with the Riyadh drone strikes, this confirms Iran's ability to project force deep into Saudi territory despite Saudi air defenses.
• The embassy closures represent a major diplomatic retreat — the US is effectively evacuating its civilian presence from the Gulf.`,
    verified: true,
    sources: [
      { name: 'Reuters',            tier: 1, reliability: 99 },
      { name: 'NYT',                tier: 1, reliability: 97 },
      { name: 'Al Jazeera',         tier: 1, reliability: 95 },
      { name: 'CNBC',               tier: 1, reliability: 95 },
      { name: 'Axios',              tier: 1, reliability: 90 },
      { name: 'Saudi Defense Min.', tier: 1, reliability: 90 },
    ],
    actorResponses: [
      { actorId: 'saudi', actorName: 'Saudi Defense Ministry', stance: 'NEUTRAL', type: 'STATEMENT', statement: 'The US embassy in Riyadh was hit by two drones resulting in a limited fire and some material damage. Eight additional drones were intercepted near Riyadh and Al-Kharj.' },
    ],
    tags: ['us-embassy', 'riyadh', 'kuwait', 'drones', 'embassy-closed', 'benghazi', 'day-4'],
  },

  {
    id:        'evt-048',
    timestamp: '2026-03-03T08:00:00Z',
    severity:  'CRITICAL',
    type:      'MILITARY',
    title:     'Israel launches ground incursion into southern Lebanon — Netanyahu and Katz approve buffer zone expansion',
    location:  'Southern Lebanon',
    summary:   'Israeli Prime Minister Netanyahu and Defense Minister Israel Katz approved a military ground incursion into southern Lebanon. Katz said the army had been instructed "to advance and seize additional controlling areas in Lebanon to prevent firing on Israeli border settlements." The IDF issued evacuation orders for dozens of Lebanese locations. This comes after 4 days of escalating Israeli air strikes that have killed 40 and wounded 246 in Lebanon. The IDF later described the new deployment as an "advanced military posture" while denying it constituted a "ground manoeuvre." 30,000+ Lebanese displaced.',
    fullContent: `Al Jazeera: "Israel's Defense Minister Israel Katz said Israel's army had been instructed to advance and seize additional controlling areas in Lebanon to prevent firing on Israeli border settlements."

NYT: "The Israeli military said its move to advance into southern Lebanon and seize areas of the country on Tuesday was intended to expand a military buffer zone between Lebanon and communities in northern Israel."

Reuters: "Lebanon was pulled deeper into the war on Tuesday as Hezbollah launched missiles at Israel for a second consecutive day and Israel sent troops into the south and carried out waves of air strikes."

Key details:
• Netanyahu and Katz gave formal approval for the operation.
• IDF issued new evacuation orders for dozens of southern Lebanon locations.
• IDF spokesperson later denied the deployment was a "ground manoeuvre" — called it "advanced military posture."
• Lebanese Health Ministry: 40 killed, 246 wounded total from Israeli strikes.
• At least 30,000 displaced in Lebanon.
• This expands an existing buffer zone from the 2024 ceasefire period.

Context:
• Hezbollah broke the November 2024 ceasefire on March 2 by firing rockets and drones at Haifa — first time since the agreement.
• Hezbollah said its attack was a "defensive act" in response to the Khamenei assassination.
• This is now effectively a three-front war for Israel: Iran (air campaign), Lebanon (air + ground), and defending the home front from IRGC missiles.`,
    verified: true,
    sources: [
      { name: 'Al Jazeera',         tier: 1, reliability: 95 },
      { name: 'NYT',                tier: 1, reliability: 97 },
      { name: 'Reuters',            tier: 1, reliability: 99 },
      { name: 'Guardian',           tier: 1, reliability: 95 },
      { name: 'The National (UAE)', tier: 2, reliability: 88 },
    ],
    actorResponses: [
      { actorId: 'idf', actorName: 'DefMin Israel Katz', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'The army has been instructed to advance and seize additional controlling areas in Lebanon to prevent firing on Israeli border settlements.' },
    ],
    tags: ['lebanon', 'ground-incursion', 'buffer-zone', 'netanyahu', 'katz', 'hezbollah', 'day-4'],
  },

  {
    id:        'evt-049',
    timestamp: '2026-03-03T14:25:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'Assembly of Experts offices bombed in Qom and Tehran — body responsible for choosing next Supreme Leader',
    location:  'Qom / Tehran, Iran',
    summary:   'Israeli-US strikes targeted the offices of the Assembly of Experts — the clerical body responsible for appointing Iran\'s next Supreme Leader — in both Qom and Tehran. The Qom strike was reported by Tasnim on March 3: "The American-Zionist criminals attacked the Assembly of Experts building in Qom." A separate strike hit the Assembly\'s Tehran compound on March 2. With Khamenei dead and the Assembly\'s physical infrastructure under attack, Iran\'s constitutional succession mechanism is now under direct military pressure. This is a deliberate strategy to prevent Iran from reconstituting its supreme leadership.',
    fullContent: `NYT (March 3, 9:25 AM ET): "An office of the Assembly of Experts, a clerical body that is supposed to appoint Iran's next supreme leader, was bombed in the city of Qom."

Tasnim news agency (semi-official Iranian): "The American-Zionist criminals attacked the Assembly of Experts building in Qom."

Times of Israel: Confirmed Israeli and US strikes hit the Tehran building of the body "tasked with electing Iran's new supreme leader."

The Hindu: Israeli and US strikes hit the building in Qom, with evacuation warnings issued.

Context:
• The Assembly of Experts is an 88-member body of senior clerics elected by the public.
• Its primary constitutional role: appoint, supervise, and if necessary dismiss the Supreme Leader.
• With Khamenei dead since Feb 28, the Assembly is the ONLY body that can constitutionally appoint a successor.
• Striking both the Tehran and Qom offices — the two main locations — puts direct military pressure on the succession process.
• Iran formed an interim leadership council (Pezeshkian, Mohseni-Ejei, Arafi) but a permanent Supreme Leader requires Assembly action.
• This represents a deliberate "decapitation plus succession denial" strategy.`,
    verified: true,
    sources: [
      { name: 'NYT',                    tier: 1, reliability: 97 },
      { name: 'Tasnim (semi-official)',  tier: 2, reliability: 70 },
      { name: 'Times of Israel',        tier: 2, reliability: 88 },
      { name: 'The Hindu',              tier: 2, reliability: 85 },
    ],
    actorResponses: [],
    tags: ['assembly-of-experts', 'qom', 'tehran', 'succession', 'supreme-leader', 'decapitation', 'day-4'],
  },

  {
    id:        'evt-050',
    timestamp: '2026-03-03T06:00:00Z',
    severity:  'HIGH',
    type:      'MILITARY',
    title:     'US death toll rises to 6 — two additional bodies recovered from struck regional facility',
    location:  'Middle East (multiple locations)',
    summary:   'CENTCOM confirmed the US death toll has risen to 6 service members killed. The original 3 were killed at Ali Al Salem AB in Kuwait during Iran\'s initial retaliatory strikes. A 4th died of wounds on March 2. On March 3, CENTCOM announced 2 additional bodies were recovered from "a regional facility struck by Iran" — bringing the total to 6 KIA and 18 wounded. CBS/NPR confirmed. Trump vowed to "avenge" the deaths. Kuwait\'s Defense Ministry also confirmed 3 Kuwaiti deaths (1 civilian + 2 from the F-15 friendly fire incident aftermath) and 35 wounded total.',
    fullContent: `CBS News: "U.S. death toll in Iran war rises to 6 as Trump says campaign could last 5 weeks."

CENTCOM timeline:
• March 1 (Sunday 9:30 AM ET): 3 US service members killed, 5 seriously injured — at Ali Al Salem AB, Kuwait.
• March 2 (Monday): 4th service member died of injuries sustained in Iran's initial attacks.
• March 3 (Tuesday): 2 additional bodies recovered from a regional facility struck by Iran — total now 6 KIA.
• 18 total wounded (revised upward from 5 seriously wounded initially).

NPR: "CENTCOM said Monday that six U.S. service members died during Iran's initial attacks."

CBS: "The fourth service member, who was seriously wounded during Iran's initial attacks, eventually died."

Kuwait casualties updated:
• 3 killed total (up from 1): 1 civilian + impacts from subsequent strikes.
• 35 wounded (up from 32).
• 3 US F-15 fighters shot down by Kuwaiti air defenses (friendly fire) — all 6 crew ejected safely.
  CENTCOM: "The U.S. Air Force fighter jets were mistakenly shot down by Kuwaiti air defenses. All six aircrew ejected safely, have been safely recovered, and are in stable condition."
  Video showed a Kuwaiti man approaching a female US pilot: "You're fine? No problem, you're safe. Thank you for helping us."`,
    verified: true,
    sources: [
      { name: 'CBS News',  tier: 1, reliability: 95 },
      { name: 'NPR',       tier: 1, reliability: 95 },
      { name: 'CENTCOM',   tier: 1, reliability: 99 },
      { name: 'NYT',       tier: 1, reliability: 97 },
    ],
    actorResponses: [
      { actorId: 'us', actorName: 'CENTCOM', stance: 'SUPPORTING', type: 'STATEMENT', statement: 'Six US service members have been killed during Iran\'s attacks. 18 total wounded. All F-15 crew from Kuwaiti friendly fire have been safely recovered.' },
    ],
    tags: ['us-kia-6', 'centcom', 'casualties', 'kuwait', 'friendly-fire', 'f-15', 'day-4'],
  },

  {
    id:        'evt-051',
    timestamp: '2026-03-03T10:00:00Z',
    severity:  'HIGH',
    type:      'DIPLOMATIC',
    title:     'UK considers sending HMS Duncan to defend Cyprus — Starmer says UK "not joining strikes"',
    location:  'London / Cyprus',
    summary:   'Defence Secretary John Healey is considering sending Royal Navy Type 45 destroyer HMS Duncan to Cyprus to defend RAF Akrotiri from future drone attacks. PM Starmer stated the UK is "not joining strikes" on Iran but will continue defensive action. Meanwhile, Cyprus blamed Britain\'s "poor communication" for the initial drone strike on Akrotiri and opened the door to reviewing the UK\'s basing rights. Two additional drones heading toward Akrotiri were intercepted by Cypriot government forces. Home Secretary Yvette Cooper briefed MPs. This represents NATO\'s most significant defensive response to the Iran conflict so far.',
    fullContent: `Guardian: "Defence Secretary John Healey is considering sending Royal Navy destroyer HMS Duncan to Cyprus to help defend the Akrotiri RAF airbase."

Telegraph: "Starmer should have sent warship to Cyprus sooner." Critics called the delayed response "pathetic."

Express: "Cyprus has blamed Britain's 'poor communication' for the drone strike on RAF Akrotiri and opened the door to reviewing the UK's sovereign base areas."

Cypriot government: Two additional unmanned drones heading towards RAF Akrotiri were intercepted — "confronted in time."

Starmer: UK is "not joining strikes" on Iran but will continue defensive action.

Guardian also reported an explosion in Larnaca, Cyprus — separate from the Akrotiri strikes.

Analysis:
• HMS Duncan is a Type 45 Daring-class destroyer — one of the most advanced air defense ships in the world, designed specifically for the anti-air/anti-missile role.
• Sending it to Cyprus would be the most significant NATO military deployment in response to the Iran conflict.
• Cyprus's threat to review basing rights is significant — the UK has held sovereign base areas since 1960.
• The UK is trying to walk a fine line: allowing US forces to use UK bases (contributing to strikes) while claiming not to be a combatant.`,
    verified: true,
    sources: [
      { name: 'Guardian',   tier: 1, reliability: 95 },
      { name: 'Telegraph',  tier: 2, reliability: 88 },
      { name: 'Express',    tier: 2, reliability: 80 },
      { name: 'Sky News',   tier: 2, reliability: 88 },
    ],
    actorResponses: [
      { actorId: 'uk', actorName: 'PM Starmer', stance: 'NEUTRAL', type: 'STATEMENT', statement: 'The UK is not joining strikes on Iran but will continue defensive action to protect our sovereign bases and personnel.' },
    ],
    tags: ['uk', 'hms-duncan', 'cyprus', 'akrotiri', 'starmer', 'nato', 'type-45', 'day-4'],
  },

  {
    id:        'evt-052',
    timestamp: '2026-03-03T14:00:00Z',
    severity:  'CRITICAL',
    type:      'ECONOMIC',
    title:     'Brent crude hits 19-month high; Bernstein warns prices could reach $120–$150 in prolonged conflict',
    location:  'Global markets',
    summary:   'Oil prices continued to climb on Day 4. Brent settled at $77.74 (+6.68%) on Monday and kept rising Tuesday, hitting a 19-month high approaching $80/bbl. WTI settled at $71.23 (+6.28%). Bernstein raised its 2026 Brent forecast to $80 (from $65) and warned prices could reach $120–$150 in an extreme prolonged scenario. European gas prices surged 18% after QatarEnergy\'s LNG shutdown. Stock markets fell across Europe (FTSE -1.2%). Gold firmed, USD strengthened. Airlines sank. The global energy supply chain is now facing the most severe disruption since the 1973 oil crisis — Hormuz closed, Ras Tanura shut, Qatar LNG halted, Israeli/Kurdish fields offline.',
    fullContent: `Reuters (March 3): "Oil prices keep climbing amid Iran conflict, with Brent hitting 19-month high."

Bernstein raised 2026 Brent oil price assumption to $80/bbl from $65, but said prices could reach $120-$150 in an extreme prolonged conflict.

Monday close (March 2):
• Brent: $77.74/bbl (+6.68%, +$4.87)
• WTI: $71.23/bbl (+6.28%, +$4.21)
• Both extended gains after-hours on Hormuz closure confirmation

Tuesday (March 3):
• Brent approaching $80, hitting 19-month high
• US crude up further
• European gas TTF benchmark surged 18% on QatarEnergy LNG shutdown
• Gold firmed (safe haven)
• USD strengthened
• Airlines sank across the board

CNBC: "Oil is spiking and stocks are slumming after the attacks on Iran."
CNN: "US stocks erased earlier losses" — defense stocks surging while energy-dependent sectors cratered.

Supply disruptions now active:
1. Strait of Hormuz — closed by IRGC, 200+ vessels anchored
2. Saudi Ras Tanura refinery — 550K bbl/day offline
3. QatarEnergy — ALL LNG production halted (~77 MTPA, ~30% of global supply)
4. Israeli oil/gas fields — offline
5. Iraqi Kurdistan production — stopped
6. UAE stock exchanges — closed
7. Multiple airports — suspended (Dubai, Kuwait, Bahrain, Erbil, Qatar)

NPR: "Oil prices surge, but no panic yet." Brent remained in $77-80 range rather than spiking to $100+ — suggesting markets believe the conflict will be relatively short.`,
    verified: true,
    sources: [
      { name: 'Reuters',    tier: 1, reliability: 99 },
      { name: 'CNBC',       tier: 1, reliability: 95 },
      { name: 'CNN',        tier: 1, reliability: 95 },
      { name: 'NPR',        tier: 1, reliability: 95 },
      { name: 'Bernstein',  tier: 1, reliability: 90 },
    ],
    actorResponses: [],
    tags: ['oil', 'brent', 'markets', 'energy', 'bernstein', '$80', 'hormuz', 'day-4'],
  },
];

export const SEV_STYLE: Record<Severity, { bg: string; color: string; dimBg: string }> = {
  CRITICAL: { bg: 'var(--danger)',  color: 'var(--danger)',  dimBg: 'var(--danger-dim)' },
  HIGH:     { bg: 'var(--warning)', color: 'var(--warning)', dimBg: 'var(--warning-dim)' },
  STANDARD: { bg: 'var(--info)',    color: 'var(--info)',    dimBg: 'var(--info-dim)' },
};
