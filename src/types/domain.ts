// Central domain types. Data files import from here; component props stay local.

// Conflict Days

export type ConflictDay = string;

export type ActorDaySnapshot = {
  activityLevel: ActivityLevel;
  activityScore: number;
  stance: Stance;
  saying: string;
  doing: string[];
  assessment: string;
};

export type ConflictDaySnapshot = {
  day: ConflictDay;
  dayLabel: string;
  summary: string;
  keyFacts: string[];
  escalation: number;
  casualties: {
    us:       { kia: number; wounded: number; civilians: number };
    israel:   { kia: number; wounded: number; civilians: number; injured: number };
    iran:     { killed: number; injured: number };
    lebanon:  { killed: number; injured: number };
    regional: Record<string, { killed: number; injured: number }>;
  };
  economicImpact: { chips: { label: string; val: string; sub: string; color: string }[]; narrative: string };
  scenarios: { label: string; subtitle: string; color: string; prob: string; body: string }[];
};

// Conflict

export type ThreatLevel = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MONITORING';
export type ConflictStatus = 'ONGOING' | 'PAUSED' | 'CEASEFIRE' | 'RESOLVED';

export type Conflict = {
  id: string;
  name: string;
  codename: { us: string; il: string };
  startDate: string;
  status: ConflictStatus;
  threatLevel: ThreatLevel;
  region: string;
  timezone: string;
  escalation: number;
  summary: string;
  keyFacts: string[];
  objectives: { us: string; il: string };
  commanders: { us: string[]; il: string[]; ir: string[] };
};

// Actors

export type ActivityLevel = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE';
export type Stance = 'AGGRESSOR' | 'DEFENDER' | 'RETALIATING' | 'PROXY' | 'NEUTRAL' | 'CONDEMNING';

export type RecentAction = {
  date: string;
  type: 'MILITARY' | 'DIPLOMATIC' | 'POLITICAL' | 'ECONOMIC' | 'INTELLIGENCE';
  description: string;
  verified: boolean;
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
};

export type Actor = {
  id: string;
  name: string;
  fullName: string;
  countryCode?: string;
  type: 'STATE' | 'NON-STATE' | 'ORGANIZATION' | 'INDIVIDUAL';
  mapKey?: string;
  cssVar?: string;
  colorRgb?: number[];
  affiliation?: 'FRIENDLY' | 'HOSTILE' | 'NEUTRAL';
  mapGroup?: string;
  activityLevel: ActivityLevel;
  activityScore: number;
  stance: Stance;
  saying: string;
  doing: string[];
  assessment: string;
  recentActions: RecentAction[];
  keyFigures: string[];
  linkedEventIds: string[];
  daySnapshots: Record<ConflictDay, ActorDaySnapshot>;
};

// Events

export type Severity = 'CRITICAL' | 'HIGH' | 'STANDARD';
export type EventType = 'MILITARY' | 'DIPLOMATIC' | 'INTELLIGENCE' | 'ECONOMIC' | 'HUMANITARIAN' | 'POLITICAL';

export type Source = {
  name: string;
  tier: number;
  reliability: number;
  url?: string | null;
};

export type ActorResponse = {
  actorId: string;
  actorName: string;
  stance: 'SUPPORTING' | 'OPPOSING' | 'NEUTRAL' | 'UNKNOWN';
  type: string;
  statement: string;
};

export type IntelEvent = {
  id: string;
  timestamp: string;
  severity: Severity;
  type: EventType;
  title: string;
  location: string;
  summary: string;
  fullContent: string;
  verified: boolean;
  sources: Source[];
  actorResponses: ActorResponse[];
  tags: string[];
};

// X Posts (Field Signals)

export type Significance = 'BREAKING' | 'HIGH' | 'STANDARD';
export type AccountType = 'military' | 'government' | 'journalist' | 'analyst' | 'official';

export type PostType = 'XPOST' | 'NEWS_ARTICLE' | 'OFFICIAL_STATEMENT' | 'PRESS_RELEASE' | 'ANALYSIS';
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'FAILED' | 'PARTIAL' | 'SKIPPED';

export type XPost = {
  id: string;
  tweetId?: string;
  postType?: PostType;
  handle: string;
  displayName: string;
  avatar: string;
  avatarColor: string;
  verified: boolean;
  accountType: AccountType;
  significance: Significance;
  timestamp: string;
  content: string;
  images?: string[];
  videoThumb?: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  eventId?: string;
  actorId?: string;
  actorCssVar?: string | null;
  actorColorRgb?: number[];
  pharosNote?: string;
  verificationStatus?: VerificationStatus;
  verifiedAt?: string;
  xaiCitations?: string[];
};

// Bootstrap

export type BootstrapData = {
  conflictId: string;
  conflictName: string;
  days: string[];
  status: string;
  threatLevel: string;
  escalation: number;
};

// API filter types

export type EventFilters = {
  day?: string;
  severity?: string;
  type?: string;
  verified?: boolean;
};

export type XPostFilters = {
  day?: string;
  significance?: string;
  accountType?: string;
  pharosOnly?: boolean;
  verificationStatus?: VerificationStatus;
};

export type EconFilters = {
  tier?: number;
  category?: string;
};

// Map data types
// Map feature types (StrikeArc, MissileTrack, etc.) use Extract<> from map
// token enums — they stay in src/data/map-data.ts, co-located with their
// token definitions. MapDataResponse re-exports them for the API layer.

// Map stories

export type StoryEvent = {
  time: string;
  label: string;
  type: 'STRIKE' | 'RETALIATION' | 'INTEL' | 'NAVAL' | 'POLITICAL';
};

export type MapStory = {
  id: string;
  primaryEventId?: string | null;
  sourceEventIds?: string[];
  title: string;
  tagline: string;
  iconName: string;
  category: 'STRIKE' | 'RETALIATION' | 'NAVAL' | 'INTEL' | 'DIPLOMATIC';
  narrative: string;
  highlightStrikeIds: string[];
  highlightMissileIds: string[];
  highlightTargetIds: string[];
  highlightAssetIds: string[];
  viewState: { longitude: number; latitude: number; zoom: number };
  keyFacts: string[];
  timestamp: string;
  events: StoryEvent[];
};

// RSS News Feed

export type FeedItem = {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet?: string;
  creator?: string;
  categories?: string[];
  isoDate?: string;
  imageUrl?: string;
};

export type FeedResult = {
  feedId: string;
  feedTitle: string;
  items: FeedItem[];
  error?: string;
  cachedAt?: number;
  fresh?: boolean;
};

// RSS Feed Sources

export type RssFeed = {
  id: string;
  name: string;
  url: string;
  perspective: 'WESTERN' | 'US_GOV' | 'ISRAELI' | 'IRANIAN' | 'ARAB' | 'RUSSIAN' | 'CHINESE' | 'INDEPENDENT' | 'INTL_ORG';
  country: string;
  tags: string[];
  stateFunded?: boolean;
  /**
   * Source importance tier (1–4). Determines proximity to the timeline spine.
   * 1 = Wire services / primary sources (Reuters, AP, official gov)
   * 2 = Major global outlets (BBC, NYT, CNN, Al Jazeera)
   * 3 = Regional / specialist (ToI, JPost, FP, War Zone)
   * 4 = State media / niche (Press TV, RT, TASS, Xinhua)
   */
  tier: 1 | 2 | 3 | 4;
};

export type ConflictCollection = {
  id: string;
  name: string;
  description: string;
  /** Channels for this conflict */
  channels: ConflictChannel[];
};

export type ConflictChannel = {
  label: string;
  description: string;
  perspective: string;
  feedIds: string[];
  color: string;
};

// Economic Indexes

export type EconCategory = 'ENERGY' | 'SAFE_HAVEN' | 'EQUITIES' | 'VOLATILITY' | 'CURRENCY' | 'DEFENSE' | 'SHIPPING';

export type EconomicIndex = {
  id: string;
  ticker: string;          // Yahoo Finance symbol
  name: string;
  shortName: string;       // for compact cards
  category: EconCategory;
  tier: 1 | 2 | 3;        // 1 = critical to conflict, 2 = important, 3 = context
  unit: string;            // "$", "%", "pts", "¢/gal"
  description: string;
  color: string;
};

// Time-series points

export type TimePoint = {
  t: number;  // unix timestamp (seconds)
  p: number;  // probability / price 0–1
};

// Prediction markets

export type SubMarket = {
  id: string;
  question: string;
  groupItemTitle: string;
  outcomes: string[];
  prices: number[];          // mid prices [YES, NO]
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  volume: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  active: boolean;
  closed: boolean;
  endDate: string;
  yesTokenId: string;
  conditionId: string;
};

export type PredictionMarket = {
  id: string;
  title: string;
  description: string;       // up to 800 chars
  category: string;          // empty — assigned manually by LLM pipeline
  // primary market stats (from highest-volume sub-market)
  outcomes: string[];
  prices: number[];
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  // event-level aggregates
  volume: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  liquidity: number;
  openInterest: number;
  competitive: number;
  active: boolean;
  closed: boolean;
  startDate: string;
  endDate: string;
  image: string;
  polyUrl: string;
  conditionId: string;
  yesTokenId: string;
  // all sub-markets in the event (group events have many)
  subMarkets: SubMarket[];
};

// Market data (financial)

export type MarketResult = {
  ticker: string;
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  currency: string;
  chart: { time: number; value: number }[];
  error?: string;
};

export type MarketGroup = {
  id: string;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  titleMatches: string[];
};

// Browse view types (server-rendered /browse pages)

export type BrowseCasualty = {
  faction: string;
  killed: number;
  wounded: number;
  civilians: number;
  injured: number;
};

export type BrowseEconChip = {
  label: string;
  val: string;
  sub: string;
  color: string;
};

export type BrowseScenario = {
  label: string;
  subtitle: string;
  color: string;
  prob: string;
  body: string;
};

export type BrowseStoryEvent = {
  id: string;
  ord: number;
  time: string;
  label: string;
  type: 'STRIKE' | 'RETALIATION' | 'INTEL' | 'NAVAL' | 'POLITICAL';
};

export type BrowseEventFilters = {
  severity?: string[];
  date?: string;
  page?: number;
};
