/** Pure quality checkers for ?enforcement=true dry-run. DB-dependent context passed in. */

export type EnforcementSeverity = 'error' | 'warning' | 'suggestion';

export type EnforcementIssue = {
  code: string;
  field?: string;
  severity: EnforcementSeverity;
  message: string;
};

// Helpers

const VAGUE_LOCATIONS = new Set([
  'iran', 'israel', 'middle east', 'region', 'gulf', 'the region',
  'middle east region', 'undisclosed', 'unknown', 'classified',
]);

function dayPattern(title: string): boolean {
  return /\bday\s*\d+\b/i.test(title);
}

function spanDays(earliestIso: string, latestIso: string): number {
  return (new Date(latestIso).getTime() - new Date(earliestIso).getTime()) / (1000 * 60 * 60 * 24);
}

// Map Stories

export type StoryEnforcementCtx = {
  /** Titles of existing stories (for duplicate detection) */
  existingTitles?: string[];
};

export function checkStoryEnforcement(
  body: Record<string, unknown>,
  ctx: StoryEnforcementCtx = {},
): EnforcementIssue[] {
  const issues: EnforcementIssue[] = [];
  const events = Array.isArray(body.events) ? body.events as { time: string; label: string; type: string }[] : [];

  // Duplicate title check
  if (typeof body.title === 'string' && Array.isArray(ctx.existingTitles)) {
    const title = body.title.trim().toLowerCase();
    const hasDuplicate = ctx.existingTitles.some(existing => existing.trim().toLowerCase() === title);
    if (hasDuplicate) {
      issues.push({
        code: 'STORY_TITLE_DUPLICATE',
        field: 'title',
        severity: 'warning',
        message: `A story with this title already exists. Use a more specific, event-focused title to avoid duplicate narrative cards.`,
      });
    }
  }

  // Time span check
  if (events.length >= 2) {
    const times = events.map(e => e.time).filter(Boolean).sort();
    const span = spanDays(times[0], times[times.length - 1]);
    if (span > 2) {
      issues.push({
        code: 'STORY_TIMESPAN_TOO_LARGE',
        field: 'events',
        severity: 'error',
        message: `Story timeline spans ${span.toFixed(1)} days. Stories must cover a specific event within 1–2 days max. Split this into individual day-focused stories — e.g. one per key development.`,
      });
    }
  }

  // Day in title
  if (typeof body.title === 'string' && dayPattern(body.title)) {
    issues.push({
      code: 'STORY_DAY_IN_TITLE',
      field: 'title',
      severity: 'warning',
      message: `Avoid writing the day number in the title ("${body.title}"). Title by the event, not the day — "IDF Enters Lebanon", not "Day 4: IDF Enters Lebanon". The day is already shown by the sidebar grouping.`,
    });
  }

  // No map connections
  const strikeIds = (body.highlightStrikeIds as string[] | undefined) ?? [];
  const missileIds = (body.highlightMissileIds as string[] | undefined) ?? [];
  const targetIds = (body.highlightTargetIds as string[] | undefined) ?? [];
  const assetIds = (body.highlightAssetIds as string[] | undefined) ?? [];
  const totalHighlights = strikeIds.length + missileIds.length + targetIds.length + assetIds.length;

  if (totalHighlights === 0) {
    issues.push({
      code: 'STORY_NO_MAP_CONNECTIONS',
      field: 'highlightStrikeIds',
      severity: 'error',
      message: 'Story has no map feature connections. Populate at least one of: highlightStrikeIds, highlightMissileIds, highlightTargetIds, highlightAssetIds — otherwise the story has no geographic context on the map.',
    });
  }

  // Too few timeline events
  if (events.length < 2) {
    issues.push({
      code: 'STORY_TOO_FEW_EVENTS',
      field: 'events',
      severity: 'warning',
      message: `Story has ${events.length} timeline event(s). Add at least 2–3 events to tell a coherent timeline. Each event should mark a discrete moment: what triggered it, what happened, what the response was.`,
    });
  }

  // Narrative too short
  const narrative = typeof body.narrative === 'string' ? body.narrative : '';
  if (narrative.length < 150) {
    issues.push({
      code: 'STORY_NARRATIVE_TOO_SHORT',
      field: 'narrative',
      severity: 'error',
      message: `Narrative is ${narrative.length} characters — too short. Write at least 2–3 paragraphs explaining what happened, the strategic context, and the significance. This is the story's primary text.`,
    });
  }

  // Too few key facts
  const keyFacts = Array.isArray(body.keyFacts) ? body.keyFacts : [];
  if (keyFacts.length < 3) {
    issues.push({
      code: 'STORY_TOO_FEW_KEY_FACTS',
      field: 'keyFacts',
      severity: 'warning',
      message: `Only ${keyFacts.length} key fact(s). Add at least 3 — these appear in the story sidebar as quick-read bullets. Each should be a specific, concrete data point (numbers, names, outcomes).`,
    });
  }

  // Tagline duplicates title
  if (
    typeof body.title === 'string' &&
    typeof body.tagline === 'string' &&
    body.title.trim().toLowerCase() === body.tagline.trim().toLowerCase()
  ) {
    issues.push({
      code: 'STORY_TAGLINE_DUPLICATES_TITLE',
      field: 'tagline',
      severity: 'warning',
      message: 'Tagline is identical to the title. The tagline should add a second layer of context — e.g. title: "IDF Enters Lebanon", tagline: "Israeli tanks cross from Metula — Hezbollah commander killed".',
    });
  }

  // Timestamp day doesn't match event days
  if (typeof body.timestamp === 'string' && events.length > 0) {
    const storyDay = body.timestamp.slice(0, 10);
    const eventDays = new Set(events.map(e => (e.time ?? '').slice(0, 10)).filter(Boolean));
    const allEventsOnDifferentDay = [...eventDays].every(d => d !== storyDay);
    if (eventDays.size > 0 && allEventsOnDifferentDay) {
      issues.push({
        code: 'STORY_WRONG_DAY',
        field: 'timestamp',
        severity: 'warning',
        message: `Story timestamp is ${storyDay} but all timeline events are on ${[...eventDays].join(', ')}. The story's timestamp determines which day group it appears under in the sidebar — it should match when the key events happened.`,
      });
    }
  }

  return issues;
}

// Events

export type EventEnforcementCtx = {
  /** Titles + timestamps of existing recent events (for duplicate detection) */
  recentEvents?: { title: string; timestamp: string }[];
};

export function checkEventEnforcement(
  body: Record<string, unknown>,
  ctx: EventEnforcementCtx = {},
): EnforcementIssue[] {
  const issues: EnforcementIssue[] = [];

  // fullContent depth
  const fullContent = typeof body.fullContent === 'string' ? body.fullContent : '';
  if (fullContent.length < 200) {
    issues.push({
      code: 'EVENT_CONTENT_TOO_THIN',
      field: 'fullContent',
      severity: 'error',
      message: `fullContent is ${fullContent.length} characters — too thin. Write a real intelligence report: context, what happened, who did what, confirmed/unconfirmed, strategic significance. Aim for 400+ characters minimum.`,
    });
  }

  // Summary depth
  const summary = typeof body.summary === 'string' ? body.summary : '';
  if (summary.length < 50) {
    issues.push({
      code: 'EVENT_SUMMARY_TOO_SHORT',
      field: 'summary',
      severity: 'warning',
      message: `Summary is ${summary.length} characters. Write 1–3 real sentences covering who, what, where. Avoid repeating the title verbatim.`,
    });
  }

  // Title length
  const title = typeof body.title === 'string' ? body.title : '';
  if (title.length > 120) {
    issues.push({
      code: 'EVENT_TITLE_TOO_LONG',
      field: 'title',
      severity: 'warning',
      message: `Title is ${title.length} characters — keep it under 120. Make it punchy: what happened, where.`,
    });
  }

  // Location too vague
  const location = typeof body.location === 'string' ? body.location.trim().toLowerCase() : '';
  if (VAGUE_LOCATIONS.has(location)) {
    issues.push({
      code: 'EVENT_LOCATION_TOO_VAGUE',
      field: 'location',
      severity: 'warning',
      message: `Location "${body.location}" is too vague. Be specific: "Tehran, Iran", "Strait of Hormuz", "Natanz nuclear facility, Isfahan Province". Vague locations break the map feature connection.`,
    });
  }

  // No sources — stronger for HIGH/CRITICAL
  const sources = Array.isArray(body.sources) ? body.sources : [];
  if (sources.length === 0) {
    const isHighValue = body.severity === 'CRITICAL' || body.severity === 'HIGH';
    issues.push({
      code: 'EVENT_NO_SOURCES',
      field: 'sources',
      severity: isHighValue ? 'error' : 'warning',
      message: isHighValue
        ? `No sources on a ${body.severity} event. Sources are required — add at least one inline (name, tier, reliability, url) on create. A ${body.severity} event without sources is incomplete product.`
        : 'No sources provided. Add at least one source inline (name, tier 1–5, reliability 0–100) or via POST /events/{id}/sources afterward.',
    });
  }

  // No actor responses on HIGH/CRITICAL
  const actorResponses = Array.isArray(body.actorResponses) ? body.actorResponses : [];
  if (actorResponses.length === 0 && (body.severity === 'CRITICAL' || body.severity === 'HIGH')) {
    issues.push({
      code: 'EVENT_NO_RESPONSES_HIGH_VALUE',
      field: 'actorResponses',
      severity: 'warning',
      message: `No actor responses on a ${body.severity} event. For HIGH and CRITICAL events, actor responses are expected — who reacted, what did they say or do? Add inline actorResponses or create via POST /actors/{actorId}/responses.`,
    });
  }

  // Possible duplicate
  if (ctx.recentEvents && title) {
    const titleLower = title.toLowerCase();
    const similar = ctx.recentEvents.find(e => {
      const existing = e.title.toLowerCase();
      // Simple substring overlap check — 60%+ word overlap
      const aWords = new Set(titleLower.split(/\s+/).filter(w => w.length > 3));
      const bWords = existing.split(/\s+/).filter(w => w.length > 3);
      if (aWords.size === 0) return false;
      const overlap = bWords.filter(w => aWords.has(w)).length;
      return overlap / aWords.size > 0.6;
    });
    if (similar) {
      issues.push({
        code: 'EVENT_POSSIBLE_DUPLICATE',
        field: 'title',
        severity: 'error',
        message: `Possible duplicate: an event with a very similar title already exists — "${similar.title}" at ${similar.timestamp}. Check if this is the same event before creating.`,
      });
    }
  }

  // Severity vs type mismatch
  if (
    body.severity === 'CRITICAL' &&
    (body.type === 'HUMANITARIAN' || body.type === 'ECONOMIC')
  ) {
    issues.push({
      code: 'EVENT_SEVERITY_MISMATCH',
      field: 'severity',
      severity: 'suggestion',
      message: `Severity CRITICAL on a ${body.type} event is unusual. CRITICAL is typically reserved for direct military actions (strikes, casualties, imminent threats). Consider HIGH unless this is truly critical.`,
    });
  }

  return issues;
}

// X Posts

export function checkXPostEnforcement(body: Record<string, unknown>): EnforcementIssue[] {
  const issues: EnforcementIssue[] = [];

  // Content too short
  const content = typeof body.content === 'string' ? body.content : '';
  if (content.length < 20) {
    issues.push({
      code: 'XPOST_CONTENT_TOO_SHORT',
      field: 'content',
      severity: 'error',
      message: `Post content is ${content.length} characters — include the full post text, not just a fragment.`,
    });
  }

  // BREAKING without eventId
  if (body.significance === 'BREAKING' && !body.eventId) {
    issues.push({
      code: 'XPOST_BREAKING_UNLINKED',
      field: 'eventId',
      severity: 'warning',
      message: 'BREAKING post has no eventId. Link it to the relevant event via eventId — this is what connects the social signal to the intelligence record.',
    });
  }

  // BREAKING without pharosNote
  if (body.significance === 'BREAKING' && !body.pharosNote) {
    issues.push({
      code: 'XPOST_BREAKING_NO_NOTE',
      field: 'pharosNote',
      severity: 'warning',
      message: 'BREAKING post has no pharosNote. Add a note explaining why this post matters — what does it confirm, contradict, or reveal that wasn\'t known before?',
    });
  }

  // Account type mismatch
  const handle = (typeof body.handle === 'string' ? body.handle : '').toLowerCase();
  const MILITARY_HANDLES = ['centcom', 'pentagon', 'idf', 'modmilrus', 'irgc', 'navcent', 'afcent'];
  const isMilitaryHandle = MILITARY_HANDLES.some(h => handle.includes(h));
  if (isMilitaryHandle && body.accountType !== 'military') {
    issues.push({
      code: 'XPOST_ACCOUNTTYPE_MISMATCH',
      field: 'accountType',
      severity: 'suggestion',
      message: `Handle "${body.handle}" looks like a military account but accountType is "${body.accountType}". Consider setting accountType to "military".`,
    });
  }

  // XPOST without tweetId (verification prerequisite)
  if (body.postType === 'XPOST' && !body.tweetId) {
    issues.push({
      code: 'XPOST_MISSING_TWEET_ID',
      field: 'tweetId',
      severity: 'error',
      message: 'postType is XPOST but no tweetId provided. tweetId is required for tweet verification via the X AI API. Provide the real tweet numeric ID.',
    });
  }

  // Verification reminder
  if (body.postType === 'XPOST' && body.tweetId) {
    issues.push({
      code: 'XPOST_WILL_BE_VERIFIED',
      field: 'tweetId',
      severity: 'suggestion',
      message: 'This XPOST will be automatically verified against the X AI API on creation. If the tweetId does not correspond to a real tweet, creation will be rejected with 422 VERIFICATION_FAILED. Use POST /verify/search to find real tweet IDs first.',
    });
  }

  return issues;
}

// Day Snapshots

export function checkDaySnapshotEnforcement(body: Record<string, unknown>): EnforcementIssue[] {
  const issues: EnforcementIssue[] = [];

  // Summary too short
  const summary = typeof body.summary === 'string' ? body.summary : '';
  if (summary.length < 200) {
    issues.push({
      code: 'DAY_SUMMARY_TOO_SHORT',
      field: 'summary',
      severity: 'error',
      message: `Day summary is ${summary.length} characters. A conflict day summary needs substance — write 3+ paragraphs covering major developments, key turning points, and the overall arc of the day.`,
    });
  }

  // No scenarios
  const scenarios = Array.isArray(body.scenarios) ? body.scenarios : [];
  if (scenarios.length === 0) {
    issues.push({
      code: 'DAY_NO_SCENARIOS',
      field: 'scenarios',
      severity: 'error',
      message: 'No scenario forecasts provided. Add 2–3 scenarios (Full Escalation, Contained Response, Diplomatic Off-ramp) with probability estimates — these are key for the intelligence dashboard. A day snapshot without scenarios is incomplete product.',
    });
  }

  // Too few key facts
  const keyFacts = Array.isArray(body.keyFacts) ? body.keyFacts : [];
  if (keyFacts.length < 3) {
    issues.push({
      code: 'DAY_TOO_FEW_KEY_FACTS',
      field: 'keyFacts',
      severity: keyFacts.length === 0 ? 'error' : 'warning',
      message: keyFacts.length === 0
        ? 'No key facts provided. A day snapshot must have concrete data points — casualty numbers, specific strikes, diplomatic moves, economic figures. Aim for 5+.'
        : `Only ${keyFacts.length} key fact(s). Add at least 3–5 concrete data points.`,
    });
  }

  // No casualties
  const casualties = Array.isArray(body.casualties) ? body.casualties : [];
  if (casualties.length === 0) {
    issues.push({
      code: 'DAY_NO_CASUALTIES',
      field: 'casualties',
      severity: 'error',
      message: 'No casualty summary provided. Include casualties for all relevant factions — even if count is 0, state it explicitly. A day snapshot without casualties is incomplete product.',
    });
  }

  // No economic chips
  const economicChips = Array.isArray(body.economicChips) ? body.economicChips : [];
  if (economicChips.length === 0) {
    issues.push({
      code: 'DAY_NO_ECONOMIC_CHIPS',
      field: 'economicChips',
      severity: 'warning',
      message: 'No economic impact chips provided. Add labeled metric cards (oil price, shipping costs, market impact, sanctions status) — these appear as the economic dashboard section.',
    });
  }

  // No economic narrative
  const economicNarrative = typeof body.economicNarrative === 'string' ? body.economicNarrative : '';
  if (economicNarrative.length < 20) {
    issues.push({
      code: 'DAY_NO_ECONOMIC_NARRATIVE',
      field: 'economicNarrative',
      severity: 'warning',
      message: 'Economic narrative is empty or too short. Write an analytical paragraph covering economic consequences of the day\'s events (energy, shipping, markets, sanctions).',
    });
  }

  // High escalation with no key facts
  if (typeof body.escalation === 'number' && body.escalation > 80 && keyFacts.length === 0) {
    issues.push({
      code: 'DAY_HIGH_ESCALATION_NO_FACTS',
      field: 'keyFacts',
      severity: 'error',
      message: `Escalation is ${body.escalation}/100 but no key facts are provided. High escalation scores need supporting evidence — what specific events drove it this high?`,
    });
  }

  return issues;
}

// Map Features (strike arcs, missile tracks, targets, assets)

export function checkMapFeatureEnforcement(
  body: Record<string, unknown>,
  featureType: 'STRIKE_ARC' | 'MISSILE_TRACK' | 'TARGET' | 'ASSET' | 'THREAT_ZONE' | 'HEAT_POINT',
): EnforcementIssue[] {
  const issues: EnforcementIssue[] = [];
  const props = (body.properties ?? {}) as Record<string, unknown>;
  const isKinetic = featureType === 'STRIKE_ARC' || featureType === 'MISSILE_TRACK';
  const isInstallation = featureType === 'TARGET' || featureType === 'ASSET';

  // No timestamp
  if (!body.timestamp) {
    issues.push({
      code: 'FEATURE_NO_TIMESTAMP',
      field: 'timestamp',
      severity: 'warning',
      message: 'Map feature has no timestamp. Without a timestamp the feature always passes the time filter but will not appear on the timeline slider — it won\'t animate into the map as events unfold.',
    });
  }

  // Kinetic: missing label
  if (isKinetic && !props.label) {
    issues.push({
      code: 'FEATURE_NO_LABEL',
      field: 'properties.label',
      severity: 'warning',
      message: 'Strike arcs and missile tracks should have properties.label — shown on map hover/tooltip. e.g. "Tomahawk strike — Tehran AD site".',
    });
  }

  // Kinetic: missing severity
  if (isKinetic && !props.severity) {
    issues.push({
      code: 'FEATURE_NO_SEVERITY',
      field: 'properties.severity',
      severity: 'suggestion',
      message: 'Consider adding properties.severity (CRITICAL, HIGH, STANDARD) — used for rendering weight/thickness of the arc.',
    });
  }

  // Installation: missing name
  if (isInstallation && !props.name) {
    issues.push({
      code: 'FEATURE_NO_NAME',
      field: 'properties.name',
      severity: 'warning',
      message: 'Targets and assets must have properties.name — shown in the map tooltip. e.g. "USS Gerald R. Ford (CVN-78)".',
    });
  }

  // Installation: missing description
  if (isInstallation && !props.description) {
    issues.push({
      code: 'FEATURE_NO_DESCRIPTION',
      field: 'properties.description',
      severity: 'suggestion',
      message: 'Consider adding properties.description — provides context on hover. e.g. "CSG-12 — Gulf of Oman, arrived March 1".',
    });
  }

  return issues;
}
