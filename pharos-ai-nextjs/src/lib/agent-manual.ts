/**
 * agent-manual.ts
 *
 * Single source of truth for the Pharos agent manual.
 * Converted from agent_manual.md — do NOT edit the .md file directly.
 *
 * Key advantages over a static .md:
 *  - Valid enum values are imported from admin-validate.ts (stays in sync automatically)
 *  - Actor mapKeys and current conflict state are injected at request time
 *  - Bearer token is never hardcoded
 *  - All examples use correct, validated values
 */

import {
  MAP_ACTOR_KEYS,
  MAP_PRIORITIES,
  KINETIC_TYPES,
  INSTALLATION_TYPES,
  ZONE_TYPES,
  KINETIC_STATUSES,
  INSTALLATION_STATUSES,
  STORY_ICON_NAMES,
} from './admin-validate';

export type ActorSummary = {
  id: string;
  name: string;
  mapKey: string;
};

export type LiveContext = {
  conflictId: string;
  baseUrl: string;
  adminToken: string;
  actors: ActorSummary[];
  currentState: {
    eventCount: number;
    storyCount: number;
    actorCount: number;
    hasTodaySnapshot: boolean;
    escalation: number | null;
    lastEventAt: string | null;
    today: string;
  };
  generatedAt: string;
};

export function buildAgentManual(ctx: LiveContext): string {
  const { conflictId, baseUrl, adminToken, actors, currentState } = ctx;
  const base = `${baseUrl}/api/v1/admin`;
  const scope = `${base}/${conflictId}`;

  // Build live enum tables
  const actorRows = actors
    .map(a => `| \`${a.id}\` | ${a.name} | \`${a.mapKey}\` |`)
    .join('\n');

  return `# Pharos AI — Agent Manual

> Complete reference for the autonomous agent ingesting intelligence data into the Pharos dashboard.
> **Auto-generated at ${ctx.generatedAt} — enum values and actor list are live from the database.**

---

## Table of Contents

1. [What is Pharos AI](#1-what-is-pharos-ai)
2. [Authentication](#2-authentication)
3. [API Conventions](#3-api-conventions)
4. [Data Model Overview](#4-data-model-overview)
5. [Recommended Workflow](#5-recommended-workflow)
6. [Endpoint Reference](#6-endpoint-reference)
   - [Health](#61-health)
   - [Workspace](#62-workspace)
   - [Context & Discovery](#63-context--discovery)
   - [Events](#64-events)
   - [X Posts](#65-x-posts)
   - [Actors](#66-actors)
   - [Day Snapshots](#67-day-snapshots)
   - [Conflict Meta](#68-conflict-meta)
   - [Map Features](#69-map-features)
   - [Map Stories](#610-map-stories)
   - [Search](#611-search)
   - [Validate](#612-validate)
   - [Bulk Operations](#613-bulk-operations)
7. [Enum Reference](#7-enum-reference)
8. [Error Handling](#8-error-handling)
9. [ID Generation](#9-id-generation)
10. [Tips & Gotchas](#10-tips--gotchas)

---

## 1. What is Pharos AI

Pharos AI is a real-time geopolitical intelligence dashboard. The dashboard visualizes:

- **Events** — timestamped intelligence reports (military strikes, diplomatic moves, economic actions)
- **X Posts** — social media signals from military officials, journalists, analysts, government accounts
- **Actors** — state and non-state actors, each with daily snapshots of activity level, stance, and assessment
- **Day Snapshots** — daily summaries including escalation score (0–100), casualties, economic chips, and scenarios
- **Map Features** — geographic data: strike arcs, missile tracks, targets, military assets, threat zones, heat points
- **Map Stories** — narrative overlays tying map features to a timeline of events

All data is scoped to a **conflict** (current: \`${conflictId}\`).

---

## 2. Authentication

Every request must include:

\`\`\`
Authorization: Bearer ${adminToken}
\`\`\`

| Status | Code | Meaning |
|--------|------|---------|
| 401 | \`UNAUTHORIZED\` | Missing or malformed \`Authorization\` header |
| 403 | \`FORBIDDEN\` | Invalid API key |
| 500 | \`SERVER_ERROR\` | \`PHAROS_ADMIN_API_KEY\` env var not set on server |

---

## 3. API Conventions

**Base URL:** \`${base}\`

**Conflict scope:** Almost all endpoints are under \`/admin/{conflictId}/...\`. Current conflict ID: \`${conflictId}\`

### Response envelope

\`\`\`json
// Success
{ "ok": true, "data": { ... } }

// Error
{ "ok": false, "error": { "code": "VALIDATION", "message": "Invalid actor: must be one of US, ISRAEL, ..." } }
\`\`\`

### Common status codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Validation error (bad input) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource not found |
| 409 | Duplicate ID — resource already exists, safe to skip |
| 503 | Database unavailable |

### Agent-generated IDs

You generate IDs for events, X posts, map features, and map stories. This enables **idempotent retries** — if a request fails mid-flight, retry with the same ID and you'll get a \`409\` rather than a duplicate.

**Format:** Use descriptive slugs — \`evt-2026-03-03-tehran-strike-001\`, \`xp-@IranMilitary-2026-03-03-01\`

### Timestamps

- **Events / X Posts:** Full ISO 8601 — \`2026-03-03T14:30:00.000Z\`
- **Day fields:** Date string — \`2026-03-03\`

---

## 4. Data Model Overview

\`\`\`
Conflict
├── ConflictDaySnapshot (one per day)
│   ├── CasualtySummary[]
│   ├── EconomicImpactChip[]
│   └── Scenario[]
├── Actor[]
│   ├── ActorDaySnapshot[] (one per actor per day)
│   ├── ActorAction[]
│   └── EventActorResponse[]
├── IntelEvent[]
│   ├── EventSource[]
│   └── EventActorResponse[]
├── XPost[] (optionally linked to event and/or actor)
├── MapFeature[] (discriminated by featureType)
└── MapStory[]
    └── MapStoryEvent[] (ordered timeline)
\`\`\`

### Key relationships

- An **XPost** can be linked to one **IntelEvent** (\`eventId\`) and/or one **Actor** (\`actorId\`). Both optional.
- An **EventActorResponse** links an **Actor** to an **IntelEvent** with a stance and statement.
- **MapFeatures** are generic rows discriminated by \`featureType\`. Geometry and properties are JSON columns.
- **MapStories** reference map feature IDs via \`highlightStrikeIds\`, \`highlightMissileIds\`, etc.

---

## 5. Recommended Workflow

On each agent cycle (~5 minutes):

### Step 0: Read instructions (this endpoint)
\`\`\`
GET ${scope}/instructions
\`\`\`

### Step 1: Get today's workspace (prioritized todo list)
\`\`\`
GET ${scope}/workspace
\`\`\`

Returns a prioritized P1/P2/P3 todo list derived from the current DB state — missing day snapshots, actors without today's snapshot, events without sources, broken story refs, etc. Follow this list rather than guessing what needs to be done.

### Step 2: Get context
\`\`\`
GET ${scope}/context?hours=48
\`\`\`

Returns existing events, actors with last snapshot day, hints (missing snapshots, unlinked posts, etc.)

### Step 3: Draft and enforce before creating

**Before creating anything substantial (stories, events, day snapshots), run enforcement mode first:**

\`\`\`
POST ${scope}/map/stories?enforcement=true    { ...your draft... }
POST ${scope}/events?enforcement=true         { ...your draft... }
POST ${scope}/days?enforcement=true           { ...your draft... }
POST ${scope}/x-posts?enforcement=true        { ...your draft... }
POST ${scope}/map/strike-arcs?enforcement=true  { ...your draft... }
\`\`\`

Enforcement mode validates structure + runs quality/style checks, then returns a report **without writing anything to the DB**. Fix all \`errors\` before proceeding. \`warnings\` are advisory.

\`\`\`json
{
  "dryRun": true,
  "passed": false,
  "errors": [{ "code": "STORY_TIMESPAN_TOO_LARGE", "message": "Story spans 4 days..." }],
  "warnings": [{ "code": "STORY_DAY_IN_TITLE", "message": "Avoid writing Day N in the title..." }],
  "summary": "1 error must be fixed before creating."
}
\`\`\`

### Step 4: Create (after enforcement passes)
\`\`\`
POST ${scope}/days
POST ${scope}/events
POST ${scope}/bulk/events   (up to 50 at once)
\`\`\`

⚠️ Do NOT include \`actorResponses\` inline — they are silently ignored. Use the dedicated endpoint instead (see §6.5).

### Step 5: Add actor responses
\`\`\`
POST ${scope}/actors/{actorId}/responses
\`\`\`

### Step 6: Ingest X posts
\`\`\`
POST ${scope}/x-posts
POST ${scope}/bulk/x-posts
\`\`\`

### Step 7: Update actors
\`\`\`
PUT  ${scope}/actors/{actorId}
POST ${scope}/actors/{actorId}/snapshots
\`\`\`

### Step 8: Add map features (if geographically relevant)
\`\`\`
POST ${scope}/map/strike-arcs?enforcement=true   (draft check first)
POST ${scope}/map/strike-arcs
POST ${scope}/map/missile-tracks
POST ${scope}/map/targets
POST ${scope}/map/assets
POST ${scope}/map/threat-zones
POST ${scope}/map/heat-points
\`\`\`

### Step 9: Create map stories (if a narrative thread connects multiple features)
\`\`\`
POST ${scope}/map/stories?enforcement=true   (always run this first)
POST ${scope}/map/stories
\`\`\`

Stories must be **day-scoped** — cover a specific event within a 2–6 hour window. Do NOT create stories spanning multiple days.

### Step 10: Validate (every ~30 minutes)
\`\`\`
GET ${scope}/validate
\`\`\`

---

## 6. Endpoint Reference

### 6.1 Health

#### \`GET ${base}/health\`

\`\`\`json
{ "ok": true, "data": { "status": "healthy", "db": "connected", "timestamp": "..." } }
\`\`\`

---

### 6.2 Workspace

#### \`GET ${scope}/workspace\`

**Call this second, after /instructions.** Returns a prioritized P1/P2/P3 todo list for today based on current DB state. Use it to understand what needs to be done rather than guessing.

**Response shape:**
\`\`\`json
{
  "today": "2026-03-04",
  "overview": {
    "hasTodaySnapshot": false,
    "escalation": 91,
    "recentEventCount": 33,
    "recentXPostCount": 60,
    "totalStories": 19,
    "todayStoriesCount": 0
  },
  "todos": [
    {
      "priority": "P1",
      "category": "Day Snapshot",
      "title": "Create today's day snapshot (2026-03-04)",
      "description": "No day snapshot exists for today...",
      "action": "POST /api/v1/admin/iran-2026/days"
    },
    {
      "priority": "P2",
      "category": "Actor Snapshots",
      "title": "Create daily snapshots for 10 actor(s)",
      "action": "POST /api/v1/admin/iran-2026/actors/{actorId}/snapshots",
      "count": 10,
      "items": [{ "id": "hezbollah", "name": "Hezbollah" }, ...]
    }
  ],
  "summary": {
    "total": 3,
    "p1": 1,
    "p2": 1,
    "p3": 1,
    "allClear": false,
    "message": "1 critical, 1 standard, 1 low-priority items need attention."
  }
}
\`\`\`

**Todo priority guide:**

| Priority | Meaning | Examples |
|----------|---------|---------|
| P1 | Must fix — dashboard broken or misleading | Missing day snapshot, broken story highlight refs, invalid actor on map features |
| P2 | Should fix — data quality gaps | Actors without today's snapshot, events without sources, BREAKING posts unlinked |
| P3 | Nice to fix — minor gaps | Non-breaking unlinked X posts, no stories for today |

---

### 6.3 Context & Discovery

#### \`GET ${scope}/context\`

**Call this first every cycle.** Returns existing data + actionable hints.

**Query params:** \`hours\` (int, default 48, max 168)

**Hints:**

| Hint | Action |
|------|--------|
| \`missingDaySnapshot: true\` | \`POST ${scope}/days\` |
| \`actorsWithoutTodaySnapshot: [...]\` | \`POST ${scope}/actors/{id}/snapshots\` |
| \`unlinkedXPosts > 0\` | \`PUT ${scope}/x-posts/{id}\` with \`{ "eventId": "..." }\` |
| \`eventsWithoutSources: [...]\` | \`POST ${scope}/events/{id}/sources\` |

---

### 6.4 Events

#### \`POST ${scope}/events\` — Create event

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| \`id\` | string | Agent-generated unique ID |
| \`timestamp\` | string | ISO 8601 — when the event occurred |
| \`severity\` | enum | \`CRITICAL\` \| \`HIGH\` \| \`STANDARD\` |
| \`type\` | enum | \`MILITARY\` \| \`DIPLOMATIC\` \| \`INTELLIGENCE\` \| \`ECONOMIC\` \| \`HUMANITARIAN\` \| \`POLITICAL\` |
| \`title\` | string | Short headline (≤120 chars) |
| \`location\` | string | e.g. \`"Tehran, Iran"\` |
| \`summary\` | string | 1–3 sentence summary |
| \`fullContent\` | string | Full analytical report |

**Optional fields:** \`verified\` (bool), \`tags\` (string[]), \`sources\` (object[])

⚠️ **\`actorResponses\` inline is silently ignored.** Always use \`POST ${scope}/actors/{actorId}/responses\` after creating the event.

**Source object:** \`{ name, tier (1–5), reliability (0–100), url? }\`

**Example:**
\`\`\`json
{
  "id": "evt-2026-03-03-hormuz-naval-001",
  "timestamp": "2026-03-03T14:30:00.000Z",
  "severity": "HIGH",
  "type": "MILITARY",
  "title": "IRGC Navy deploys fast-attack craft in Strait of Hormuz",
  "location": "Strait of Hormuz",
  "summary": "IRGC Navy deployed ~20 fast-attack craft near Hormuz following overnight airstrikes.",
  "fullContent": "Satellite imagery and shipping reports confirm...",
  "verified": true,
  "tags": ["naval", "hormuz", "irgc"],
  "sources": [
    { "name": "Reuters", "tier": 1, "reliability": 95, "url": "https://reuters.com/..." }
  ]
}
\`\`\`

#### \`PUT ${scope}/events/{eventId}\` — Update event
Send only changed fields.

#### \`DELETE ${scope}/events/{eventId}\` — Delete event
Cascades to sources and actor responses.

#### \`POST ${scope}/events/{eventId}/sources\` — Add sources
\`\`\`json
{ "sources": [{ "name": "AP News", "tier": 1, "reliability": 90, "url": "..." }] }
\`\`\`

---

### 6.5 X Posts

#### \`POST ${scope}/x-posts\` — Create X post

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| \`id\` | string | Agent-generated unique ID |
| \`postType\` | enum | \`XPOST\` \| \`NEWS_ARTICLE\` \| \`OFFICIAL_STATEMENT\` \| \`PRESS_RELEASE\` \| \`ANALYSIS\` |
| \`handle\` | string | e.g. \`"@PentagonPress"\` |
| \`displayName\` | string | e.g. \`"Pentagon Press Secretary"\` |
| \`content\` | string | Full post text |
| \`accountType\` | enum | **lowercase**: \`military\` \| \`government\` \| \`journalist\` \| \`analyst\` \| \`official\` |
| \`significance\` | enum | \`BREAKING\` \| \`HIGH\` \| \`STANDARD\` |
| \`timestamp\` | string | ISO 8601 |

**Optional:** \`verified\`, \`likes\`, \`retweets\`, \`replies\`, \`views\`, \`pharosNote\`, \`eventId\`, \`actorId\`

**\`postType\` rules:**
- \`XPOST\` — an actual tweet posted on X/Twitter. **\`tweetId\` is required** — provide a realistic 19-digit numeric string (e.g. \`"1894731234567890123"\`).
- \`NEWS_ARTICLE\` — news wire/media headline (Reuters, AP, BBC, CNN, etc.)
- \`OFFICIAL_STATEMENT\` — formal statement from a government, military, or official body
- \`PRESS_RELEASE\` — formal press release
- \`ANALYSIS\` — analyst commentary, thread, or assessment (@ISWResearch, @ArmsControlWonk, etc.)

⚠️ \`accountType\` is **lowercase** — the only enum in the system that is. All others are UPPERCASE.

**Example (X post):**
\`\`\`json
{
  "id": "xp-@PentagonPress-2026-03-03-02",
  "postType": "XPOST",
  "tweetId": "1894731200567890111",
  "handle": "@PentagonPress",
  "displayName": "Pentagon Press Secretary",
  "content": "CENTCOM: monitoring increased IRGC Navy activity in the Strait of Hormuz.",
  "accountType": "military",
  "significance": "HIGH",
  "timestamp": "2026-03-03T15:00:00.000Z",
  "verified": true,
  "likes": 12400,
  "views": 890000,
  "eventId": "evt-2026-03-03-hormuz-naval-001",
  "actorId": "us"
}
\`\`\`

**Example (news article):**
\`\`\`json
{
  "id": "xp-@Reuters-2026-03-03-05",
  "postType": "NEWS_ARTICLE",
  "handle": "@Reuters",
  "displayName": "Reuters",
  "content": "BREAKING: Israeli aircraft strike Fordow nuclear facility. IAEA inspectors denied access.",
  "accountType": "journalist",
  "significance": "BREAKING",
  "timestamp": "2026-03-03T08:30:00.000Z",
  "verified": true,
  "likes": 45000,
  "views": 3200000
}
\`\`\`

#### \`PUT ${scope}/x-posts/{postId}\` — Update (link to event, update metrics)
#### \`DELETE ${scope}/x-posts/{postId}\` — Delete

---

### 6.6 Actors

Actors are **pre-seeded** — update only, do not create new ones.

**Current actors for \`${conflictId}\`:**

| Actor ID | Name | mapKey (use this for map features) |
|----------|------|-------------------------------------|
${actorRows}

#### \`PUT ${scope}/actors/{actorId}\` — Update actor state

| Field | Type | Description |
|-------|------|-------------|
| \`activityLevel\` | enum | \`CRITICAL\` \| \`HIGH\` \| \`ELEVATED\` \| \`MODERATE\` |
| \`activityScore\` | int | 0–100 |
| \`stance\` | enum | \`AGGRESSOR\` \| \`DEFENDER\` \| \`RETALIATING\` \| \`PROXY\` \| \`NEUTRAL\` \| \`CONDEMNING\` |
| \`saying\` | string | Current public messaging |
| \`doing\` | string[] | Current actions list |
| \`assessment\` | string | Analyst assessment |

#### \`POST ${scope}/actors/{actorId}/snapshots\` — Create daily snapshot

**Required:** \`day\` (YYYY-MM-DD), \`activityLevel\`, \`activityScore\`, \`stance\`, \`saying\`, \`doing\`, \`assessment\`

One snapshot per actor per day. Returns 409 if already exists.

#### \`PUT ${scope}/actors/{actorId}/snapshots/{day}\` — Update snapshot

#### \`POST ${scope}/actors/{actorId}/actions\` — Add action

\`\`\`json
{
  "date": "2026-03-03",
  "type": "MILITARY",
  "description": "IRGC Navy deployed 20+ fast-attack craft to Strait of Hormuz",
  "significance": "HIGH",
  "verified": true
}
\`\`\`

#### \`POST ${scope}/actors/{actorId}/responses\` — Record event response

⚠️ This is the **only** way to link actor responses to events. Inline \`actorResponses\` on event creation are silently ignored.

**Required:** \`eventId\`, \`stance\`, \`type\`, \`statement\`

\`\`\`json
{
  "eventId": "evt-2026-03-03-hormuz-naval-001",
  "stance": "SUPPORTING",
  "type": "military_action",
  "statement": "IRGC Navy Commander: 'We will defend our waters against any aggression.'"
}
\`\`\`

---

### 6.7 Day Snapshots

#### \`POST ${scope}/days\` — Create day snapshot

**Required:** \`day\` (YYYY-MM-DD), \`dayLabel\`, \`summary\`, \`escalation\` (0–100)

**Optional:** \`keyFacts\` (string[]), \`economicNarrative\`, \`casualties\`, \`economicChips\`, \`scenarios\`

**Casualty object:** \`{ faction, killed, wounded, civilians, injured }\`
**Economic chip:** \`{ label, val, sub, color }\` (color: \`"red"\` | \`"green"\` | \`"amber"\`)
**Scenario:** \`{ label, subtitle, color, prob, body }\`

**Example:**
\`\`\`json
{
  "day": "2026-03-03",
  "dayLabel": "Day 4 — Strait of Hormuz Standoff",
  "summary": "Tensions escalated as IRGC naval forces deployed to Hormuz...",
  "escalation": 91,
  "keyFacts": ["IRGC Navy deploys 20+ fast-attack craft", "Oil prices +8.2%"],
  "casualties": [
    { "faction": "iran", "killed": 787, "injured": 1240 },
    { "faction": "us", "killed": 6, "wounded": 18 }
  ],
  "economicChips": [
    { "label": "Brent Crude", "val": "$147", "sub": "+27%", "color": "red" }
  ],
  "scenarios": [
    {
      "label": "Full Escalation", "subtitle": "Regional war",
      "color": "red", "prob": "25%",
      "body": "Iran retaliates with direct missile strikes on U.S. bases..."
    }
  ]
}
\`\`\`

409 on duplicate. PUT to update (sending \`casualties\`, \`economicChips\`, or \`scenarios\` fully replaces those arrays).

---

### 6.8 Conflict Meta

#### \`PUT ${scope}/conflict\` — Update conflict

Updatable: \`name\`, \`status\`, \`threatLevel\`, \`escalation\`, \`summary\`, \`keyFacts\`

---

### 6.9 Map Features

Map features represent geographic elements. Each type has specific geometry and valid enum constraints.

#### ⚠️ Critical: valid values

| Field | Valid values |
|-------|-------------|
| \`actor\` | **mapKey** (UPPERCASE): ${MAP_ACTOR_KEYS.join(', ')} |
| \`priority\` | ${MAP_PRIORITIES.join(', ')} |
| \`type\` (kinetic — strike arcs + missile tracks) | ${KINETIC_TYPES.join(', ')} |
| \`type\` (installation — targets + assets) | ${INSTALLATION_TYPES.join(', ')} |
| \`type\` (zone — threat zones) | ${ZONE_TYPES.join(', ')} |
| \`status\` (kinetic) | ${KINETIC_STATUSES.join(', ')} |
| \`status\` (installation) | ${INSTALLATION_STATUSES.join(', ')} |

**Coordinates are \`[longitude, latitude]\` — NOT \`[lat, lng]\`.**

#### Geometry by feature type

| Feature type | Geometry required |
|---|---|
| STRIKE_ARC | \`geometry.from: [lng, lat]\`, \`geometry.to: [lng, lat]\` |
| MISSILE_TRACK | \`geometry.from: [lng, lat]\`, \`geometry.to: [lng, lat]\` |
| TARGET | \`geometry.position: [lng, lat]\` |
| ASSET | \`geometry.position: [lng, lat]\` |
| THREAT_ZONE | \`geometry.coordinates: [[lng, lat], ...]\` |
| HEAT_POINT | \`geometry.position: [lng, lat]\` |

#### \`POST ${scope}/map/strike-arcs\`

category must be \`KINETIC\`. type must be one of: ${KINETIC_TYPES.join(', ')}

\`\`\`json
{
  "id": "s-us-tehran-tomahawk-d4",
  "actor": "US",
  "priority": "P1",
  "category": "KINETIC",
  "type": "CRUISE",
  "status": "COMPLETE",
  "timestamp": "2026-03-03T02:00:00.000Z",
  "geometry": { "from": [47.5, 29.0], "to": [51.4, 35.7] },
  "properties": { "label": "Tomahawk — Tehran AD site", "severity": "CRITICAL" }
}
\`\`\`

#### \`POST ${scope}/map/missile-tracks\`

category must be \`KINETIC\`. type must be one of: ${KINETIC_TYPES.join(', ')}

\`\`\`json
{
  "id": "m-irgc-al-udeid-001",
  "actor": "IRGC",
  "priority": "P1",
  "category": "KINETIC",
  "type": "BALLISTIC",
  "status": "IMPACTED",
  "timestamp": "2026-03-03T06:30:00.000Z",
  "geometry": { "from": [52.0, 33.5], "to": [51.3, 25.3] },
  "properties": { "label": "Fateh-110 — Al Udeid", "severity": "HIGH" }
}
\`\`\`

#### \`POST ${scope}/map/targets\`

category must be \`INSTALLATION\`. type must be one of: ${INSTALLATION_TYPES.join(', ')}

\`\`\`json
{
  "id": "t-tehran-irgc-command-001",
  "actor": "IRAN",
  "priority": "P1",
  "category": "INSTALLATION",
  "type": "COMMAND",
  "status": "STRUCK",
  "timestamp": "2026-03-03T02:15:00.000Z",
  "geometry": { "position": [51.35, 35.72] },
  "properties": { "name": "IRGC Command HQ", "description": "Confirmed struck by CENTCOM" }
}
\`\`\`

#### \`POST ${scope}/map/assets\`

category must be \`INSTALLATION\`. type must be one of: ${INSTALLATION_TYPES.join(', ')}

\`\`\`json
{
  "id": "a-uss-ford-gulf",
  "actor": "US",
  "priority": "P1",
  "category": "INSTALLATION",
  "type": "CARRIER",
  "status": "ACTIVE",
  "geometry": { "position": [56.5, 24.8] },
  "properties": { "name": "USS Gerald R. Ford (CVN-78)", "description": "CSG-12 — Gulf of Oman" }
}
\`\`\`

#### \`POST ${scope}/map/threat-zones\`

category must be \`ZONE\`. type must be one of: ${ZONE_TYPES.join(', ')}. \`properties.color\` must be \`[r, g, b, a]\` RGBA array.

\`\`\`json
{
  "id": "z-hormuz-irgc-nfz",
  "actor": "IRGC",
  "priority": "P1",
  "category": "ZONE",
  "type": "NFZ",
  "geometry": {
    "coordinates": [[55.5, 26.5], [56.5, 26.0], [57.0, 26.8], [56.0, 27.2], [55.5, 26.5]]
  },
  "properties": { "name": "IRGC Naval Exclusion Zone", "color": [255, 50, 50, 120] }
}
\`\`\`

#### \`POST ${scope}/map/heat-points\`

\`\`\`json
{
  "id": "hp-tehran-strike-density",
  "actor": "US",
  "priority": "P2",
  "category": "KINETIC",
  "type": "AIRSTRIKE",
  "geometry": { "position": [51.4, 35.7] },
  "properties": { "weight": 0.9 }
}
\`\`\`

#### \`PUT ${scope}/map/features/{featureId}\` — Update any feature

All enum validations apply on update too.

#### \`DELETE ${scope}/map/features/{featureId}\` — Delete any feature

---

### 6.10 Map Stories

Narrative threads tying map features to a timeline.

#### ⚠️ Story rules
- Stories must be **day-scoped** — cover a specific event within a 2–6 hour window, not the full conflict timeline.
- \`timestamp\` should reflect when the story's key moment occurred — this determines which day group it appears under in the UI.
- \`iconName\` must be one of: ${STORY_ICON_NAMES.join(', ')} (PascalCase, exact match)
- Story event \`time\` fields must be **ISO 8601**: \`"2026-03-03T02:00:00Z"\` — NOT \`"02:00 UTC"\` or \`"Day 4"\`

#### \`POST ${scope}/map/stories\` — Create story

**Required:** \`id\`, \`title\`, \`tagline\`, \`iconName\`, \`category\`, \`narrative\`, \`viewState\`, \`timestamp\`

**Optional:** \`highlightStrikeIds\`, \`highlightMissileIds\`, \`highlightTargetIds\`, \`highlightAssetIds\`, \`keyFacts\`, \`events\`

**Timeline event object:** \`{ time (ISO 8601), label, type }\`
**type values:** \`STRIKE\` | \`RETALIATION\` | \`INTEL\` | \`NAVAL\` | \`POLITICAL\`

\`\`\`json
{
  "id": "story-hormuz-standoff-d4",
  "title": "Hormuz: The Naval Standoff",
  "tagline": "IRGC closes the strait — Trump orders Navy escort",
  "iconName": "Anchor",
  "category": "NAVAL",
  "narrative": "Following overnight strikes, the IRGC Navy deployed 20+ fast-attack craft...",
  "viewState": { "longitude": 56.0, "latitude": 26.5, "zoom": 7 },
  "timestamp": "2026-03-03T14:00:00.000Z",
  "highlightAssetIds": ["a-uss-ford-gulf"],
  "highlightStrikeIds": ["s-us-tehran-tomahawk-d4"],
  "keyFacts": [
    "20+ IRGC fast-attack craft deployed",
    "Oil prices +27%",
    "U.S. 5th Fleet on high alert"
  ],
  "events": [
    { "time": "2026-03-03T02:00:00Z", "label": "U.S. cruise missile strikes on Tehran AD sites", "type": "STRIKE" },
    { "time": "2026-03-03T10:00:00Z", "label": "IRGC Navy fast-attack craft deploy to Hormuz", "type": "NAVAL" },
    { "time": "2026-03-03T14:00:00Z", "label": "UN Security Council emergency session begins", "type": "POLITICAL" }
  ]
}
\`\`\`

#### \`PUT ${scope}/map/stories/{storyId}\` — Update story

Does NOT update events. To replace events use the PUT events endpoint below.

#### \`PUT ${scope}/map/stories/{storyId}/events\` — Replace all timeline events

Deletes existing events and creates the new set in a single transaction.

\`\`\`json
{
  "events": [
    { "time": "2026-03-03T02:00:00Z", "label": "Opening strikes", "type": "STRIKE" },
    { "time": "2026-03-03T10:00:00Z", "label": "IRGC naval deployment", "type": "NAVAL" }
  ]
}
\`\`\`

#### \`POST ${scope}/map/stories/{storyId}/events\` — Append timeline events (append-only)

#### \`DELETE ${scope}/map/stories/{storyId}\` — Delete story (cascades to events)

---

### 6.11 Search

#### \`GET ${scope}/search?q={query}&type={type}&limit={n}\`

Types: \`events\`, \`xposts\`, \`actors\`, \`map\`, \`stories\`

---

### 6.12 Validate

#### \`GET ${scope}/validate\`

Run every ~30 minutes. Returns all data quality issues:

| Issue | Description |
|-------|-------------|
| \`eventsWithoutSources\` | Events missing source citations |
| \`eventsWithoutResponses\` | Events with no actor responses |
| \`unlinkedXPosts\` | X posts not linked to any event |
| \`actorsWithoutTodaySnapshot\` | Actors missing today's snapshot |
| \`orphanedXPostEventRefs\` | X posts referencing deleted events |
| \`invalidActorOnMapFeatures\` | Features whose \`actor\` is not a valid mapKey — they are silently filtered out on the map |
| \`invalidPriorityOnMapFeatures\` | Features with priority not in P1/P2/P3 |
| \`brokenStoryHighlightRefs\` | Stories referencing feature IDs that don't exist — highlights won't render |

---

### 6.13 Bulk Operations

Max 50 items per request. All-or-nothing transaction.

#### \`POST ${scope}/bulk/events\` — \`{ "events": [...] }\`
#### \`POST ${scope}/bulk/x-posts\` — \`{ "posts": [...] }\`

---

## 7. Enum Reference

> These values are pulled live from the API validation layer and are always correct.

### Map Feature Enums (CRITICAL — wrong values are rejected with 400)

| Field | Valid values |
|-------|-------------|
| **actor** (map features) | ${MAP_ACTOR_KEYS.join(' \\| ')} |
| **priority** | ${MAP_PRIORITIES.join(' \\| ')} |
| **type** — strike arcs + missile tracks (KINETIC) | ${KINETIC_TYPES.join(' \\| ')} |
| **type** — targets + assets (INSTALLATION) | ${INSTALLATION_TYPES.join(' \\| ')} |
| **type** — threat zones (ZONE) | ${ZONE_TYPES.join(' \\| ')} |
| **status** — kinetic features | ${KINETIC_STATUSES.join(' \\| ')} |
| **status** — installation features | ${INSTALLATION_STATUSES.join(' \\| ')} |
| **iconName** (map stories) | ${STORY_ICON_NAMES.join(' \\| ')} |

### Other Enums

| Enum | Values |
|------|--------|
| Severity (events) | \`CRITICAL\` \| \`HIGH\` \| \`STANDARD\` |
| EventType | \`MILITARY\` \| \`DIPLOMATIC\` \| \`INTELLIGENCE\` \| \`ECONOMIC\` \| \`HUMANITARIAN\` \| \`POLITICAL\` |
| SignificanceLevel (X posts) | \`BREAKING\` \| \`HIGH\` \| \`STANDARD\` |
| **AccountType (X posts)** | **lowercase**: \`military\` \| \`government\` \| \`journalist\` \| \`analyst\` \| \`official\` |
| ActivityLevel | \`CRITICAL\` \| \`HIGH\` \| \`ELEVATED\` \| \`MODERATE\` |
| Stance (actors) | \`AGGRESSOR\` \| \`DEFENDER\` \| \`RETALIATING\` \| \`PROXY\` \| \`NEUTRAL\` \| \`CONDEMNING\` |
| ActorResponseStance | \`SUPPORTING\` \| \`OPPOSING\` \| \`NEUTRAL\` \| \`UNKNOWN\` |
| ActionType | \`MILITARY\` \| \`DIPLOMATIC\` \| \`POLITICAL\` \| \`ECONOMIC\` \| \`INTELLIGENCE\` |
| ActionSignificance | \`HIGH\` \| \`MEDIUM\` \| \`LOW\` |
| ConflictStatus | \`ONGOING\` \| \`PAUSED\` \| \`CEASEFIRE\` \| \`RESOLVED\` |
| ThreatLevel | \`CRITICAL\` \| \`HIGH\` \| \`ELEVATED\` \| \`MONITORING\` |
| StoryCategory | \`STRIKE\` \| \`RETALIATION\` \| \`NAVAL\` \| \`INTEL\` \| \`DIPLOMATIC\` |
| StoryEventType | \`STRIKE\` \| \`RETALIATION\` \| \`INTEL\` \| \`NAVAL\` \| \`POLITICAL\` |

---

## 8. Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| \`UNAUTHORIZED\` | Missing auth header | Add header |
| \`FORBIDDEN\` | Wrong API key | Check key |
| \`NOT_FOUND\` | Resource doesn't exist | Check ID |
| \`VALIDATION\` | Bad input | Read the message — it lists valid values |
| \`DUPLICATE\` | ID already exists | **Safe to skip — resource already created** |
| \`DB_ERROR\` | Database unavailable | Retry with backoff |

**Retry strategy:**
- **409 DUPLICATE** — Do not retry. Move on.
- **400 VALIDATION** — Do not retry with same data. Fix the input. Error message tells you exactly what's wrong.
- **500/503** — Retry with exponential backoff (1s, 2s, 4s, max 3 attempts).

---

## 9. ID Generation

| Entity | Format | Example |
|--------|--------|---------|
| Event | \`evt-{YYYY-MM-DD}-{slug}-{seq}\` | \`evt-2026-03-03-tehran-strike-001\` |
| X Post | \`xp-{handle}-{YYYY-MM-DD}-{seq}\` | \`xp-@PentagonPress-2026-03-03-01\` |
| Strike Arc | \`s-{actor}-{slug}-{seq}\` | \`s-us-tehran-tomahawk-d4\` |
| Missile Track | \`m-{actor}-{slug}-{seq}\` | \`m-irgc-al-udeid-001\` |
| Target | \`t-{slug}-{seq}\` | \`t-tehran-irgc-command-001\` |
| Asset | \`a-{slug}\` | \`a-uss-ford-gulf\` |
| Map Story | \`story-{slug}-{day}\` | \`story-hormuz-standoff-d4\` |

---

## 10. Tips & Gotchas

1. **Always call \`/context\` first.** It tells you what exists and what's missing. Never blindly create.

2. **\`actorResponses\` inline on event creation are silently ignored.** Always use \`POST /actors/{id}/responses\` as a separate call after the event is created.

3. **\`accountType\` is lowercase.** The only enum in the system that is. \`"military"\` ✅  \`"MILITARY"\` ❌

4. **actor on map features = mapKey (UPPERCASE).** Use \`"US"\` not \`"us"\`, \`"ISRAEL"\` not \`"idf"\`. See the actor table in §6.5 for exact values.

5. **Coordinates are \`[longitude, latitude]\`** (GeoJSON order). NOT \`[lat, lng]\`.

6. **Story event \`time\` must be ISO 8601.** \`"2026-03-03T02:00:00Z"\` ✅  \`"02:00 UTC"\` ❌

7. **Stories are day-scoped.** Cover a specific 2–6 hour event window. Do not create stories that span multiple days — they are hard to consume and pollute the day-group sidebar.

8. **409 is your friend.** Resource already exists. Log and move on. Never treat as an error.

9. **Story highlight IDs are now validated.** \`GET /validate\` catches broken highlight refs. Ensure all IDs in \`highlightStrikeIds\` / \`highlightMissileIds\` / etc. exist as map features before referencing.

10. **To replace story events:** Use \`PUT /map/stories/{id}/events\` — deletes all existing events and creates the new set in one transaction. \`POST\` is append-only.

11. **Day snapshot must exist before casualties upsert.** Create it via \`POST /days\` first.

12. **Bulk is all-or-nothing.** Any validation error or duplicate ID in a bulk batch fails the entire batch.

13. **Validation runs these checks now:** events without sources, events without responses, unlinked X posts, actors without today's snapshot, orphaned X post event refs, invalid actor on map features, invalid priority on map features, broken story highlight refs.

---

*End of manual. Generated at ${ctx.generatedAt}.*
`;
}
