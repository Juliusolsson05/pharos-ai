# TOOLS.md - Pharos Environment Notes

## Product + conflict
- conflict: iran-2026
- dashboard: https://www.conflicts.app/dashboard
- environment: production
- do not use localhost for normal operations

## Admin endpoints
- instructions: `/api/v1/admin/iran-2026/instructions`
- workspace: `/api/v1/admin/iran-2026/workspace`
- context: `/api/v1/admin/iran-2026/context`
- validate: `/api/v1/admin/iran-2026/validate`

## Fulfillment scripts
All API writes go through Python scripts.

Root:
`workspace/pharos-fulfillment/`

Day folder:
`workspace/pharos-fulfillment/YYYY-MM-DD/`

Run from the fulfillment root:

```bash
cd workspace/pharos-fulfillment
python3 YYYY-MM-DD/01_day_snapshot.py
```

## Shared client

Every script should import:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib.pharos import post, put, enforce, ts, slug
```

## Write rules

- scripts only
- prefer enforce/dry-run before creates
- use stable IDs
- prefer update over create
- verify user-facing state after writes

## Product inspection

When things look wrong, inspect in this order:

1. admin endpoint state
2. consumer endpoint state
3. frontend code/render logic

## Repo areas to inspect

- admin routes: `src/app/api/v1/admin`
- shared server logic: `src/server/lib`
- schema: `prisma/schema.prisma`
- consumer routes and frontend: `src/app/api/v1/conflicts/...`

---

## API schemas (full reference)

### Enums

```
Severity:           CRITICAL | HIGH | STANDARD
EventType:          MILITARY | DIPLOMATIC | INTELLIGENCE | ECONOMIC | HUMANITARIAN | POLITICAL
ActorResponseStance: SUPPORTING | OPPOSING | NEUTRAL | UNKNOWN
SignificanceLevel:  BREAKING | HIGH | STANDARD
AccountType:        military | government | journalist | analyst | official
PostType:           XPOST | NEWS_ARTICLE | OFFICIAL_STATEMENT | PRESS_RELEASE | ANALYSIS
StoryCategory:      STRIKE | RETALIATION | NAVAL | INTEL | DIPLOMATIC
StoryEventType:     STRIKE | RETALIATION | INTEL | NAVAL | POLITICAL
MapFeatureType:     STRIKE_ARC | MISSILE_TRACK | TARGET | ASSET | THREAT_ZONE | HEAT_POINT
ConflictStatus:     ONGOING | PAUSED | CEASEFIRE | RESOLVED
ThreatLevel:        CRITICAL | HIGH | ELEVATED | MONITORING
ActivityLevel:      CRITICAL | HIGH | ELEVATED | MODERATE
Stance:             AGGRESSOR | DEFENDER | RETALIATING | PROXY | NEUTRAL | CONDEMNING
ActionType:         MILITARY | DIPLOMATIC | POLITICAL | ECONOMIC | INTELLIGENCE
ActionSignificance: HIGH | MEDIUM | LOW
MAP_ACTOR_KEYS:     US | ISRAEL | IRAN | IRGC | HOUTHI | NATO | USIL | HEZBOLLAH | PMF
MAP_PRIORITIES:     P1 | P2 | P3
```

### POST /events — Create event

Required: `{id, timestamp, severity, type, title, location, summary, fullContent}`
Optional: `verified (bool), tags (string[])`
Inline sources: `sources: [{name, tier, reliability, url?}]`
Inline responses: `actorResponses: [{actorId, actorName, stance, type, statement}]`
409 = duplicate (safe to skip)

### POST /events/{eventId}/sources — Add sources to event

Required: `{sources: [{name, tier, reliability, url?}]}`

### PUT /events/{eventId} — Update event

Partial update. Only provided fields are changed.

### POST /days — Create day snapshot

Required: `{day (YYYY-MM-DD), dayLabel, summary, escalation (0-100)}`
Optional: `keyFacts[], economicNarrative, casualties[], economicChips[], scenarios[]`

casualties: `[{faction, killed?, wounded?, civilians?, injured?}]`
economicChips: `[{label, val, sub, color}]`
scenarios: `[{label, subtitle, color, prob, body}]`

### PUT /days/YYYY-MM-DD — Update day snapshot

All fields optional (partial update). Nested arrays fully replace when provided.
Same shapes as POST /days.

### POST /actors/{actorId}/snapshots — Create actor snapshot

Required: `{day (YYYY-MM-DD), activityLevel, activityScore (0-100), stance, saying, doing, assessment}`
One snapshot per actor per day (409 on duplicate).

### POST /actors/{actorId}/responses — Create actor response

Required: `{eventId, stance (SUPPORTING|OPPOSING|NEUTRAL|UNKNOWN), type, statement}`
actorName is auto-populated from actor record.

### POST /actors/{actorId}/actions — Create actor action

Required: `{date, type (MILITARY|DIPLOMATIC|POLITICAL|ECONOMIC|INTELLIGENCE), description, significance (HIGH|MEDIUM|LOW)}`
Optional: `verified (bool)`

### POST /x-posts — Create signal

Required: `{id, handle, displayName, content, accountType, significance, timestamp}`
For XPOST type: `tweetId` is required (numeric ID string — never fabricate)
Optional: `postType, avatar, avatarColor, verified, images[], videoThumb, likes, retweets, replies, views, pharosNote, eventId, actorId`

### POST /verify/search — Find real tweet IDs

Use this BEFORE creating XPOST signals to find real tweet IDs.

### Map feature endpoints — use the correct one by feature type

There is NO generic `POST /map/features` endpoint. Use these concrete routes:

| MapFeatureType | Endpoint                  | Use case                            |
|----------------|---------------------------|-------------------------------------|
| STRIKE_ARC     | `POST /map/strike-arcs`   | Air/missile path between two points |
| MISSILE_TRACK  | `POST /map/missile-tracks`| Ballistic/cruise trajectory         |
| TARGET         | `POST /map/targets`       | Fixed location that was struck      |
| ASSET          | `POST /map/assets`        | Military installation or vessel     |
| THREAT_ZONE    | `POST /map/threat-zones`  | Area polygon (closure, NFZ, etc.)   |
| HEAT_POINT     | `POST /map/heat-points`   | Intensity/concentration marker      |

`POST /map/strike-arcs`: `{id, actor (MAP_ACTOR_KEY), priority (P1|P2|P3), category, type (AIRSTRIKE|NAVAL_STRIKE|BALLISTIC|CRUISE|DRONE), geometry: {from: {lat, lng}, to: {lat, lng}}, status?, timestamp?, sourceEventId?, properties?}`
`POST /map/missile-tracks`: same schema as strike-arcs
`POST /map/targets`: `{id, actor, priority, category, type (CARRIER|AIR_BASE|NAVAL_BASE|ARMY_BASE|NUCLEAR_SITE|COMMAND|INFRASTRUCTURE), geometry: {position: {lat, lng}}, status?, timestamp?, sourceEventId?, properties: {name, description?}}`
`POST /map/assets`: same schema as targets
`POST /map/threat-zones`: `{id, actor, priority, category, type (CLOSURE|PATROL|NFZ|THREAT_CORRIDOR), geometry: {coordinates: [[lat, lng], ...]}, timestamp?, sourceEventId?, properties: {name, color?}}`
`POST /map/heat-points`: `{id, actor, priority, category, type, geometry: {position: {lat, lng}}, properties: {weight}}`
`PUT /map/features/{featureId}`: update any existing feature (partial)

### Map story endpoints

`POST /map/stories`: `{id, title, tagline, iconName, category, narrative, viewState: {longitude, latitude, zoom}, timestamp, primaryEventId?, sourceEventIds?[], highlightStrikeIds?[], highlightMissileIds?[], highlightTargetIds?[], highlightAssetIds?[], keyFacts?[], events?: [{time, label, type}]}`
`PUT /map/stories/{storyId}`: update story (partial)
`POST /map/stories/{storyId}/events`: append timeline events
`PUT /map/stories/{storyId}/events`: replace all timeline events

### PUT /conflict — Update conflict state

All optional: `{status, threatLevel, escalation (0-100), name, summary, keyFacts[], timezone}`

---

## What "complete" means for each artifact

### Complete event
- has sources (at least one)
- has actor responses (at least for primary actors, mandatory for HIGH/CRITICAL)
- has map feature if spatially grounded (linked via sourceEventId)
- has linked signals if real X posts or statements exist

### Complete day snapshot
- summary: multi-paragraph analytical brief
- keyFacts: 5+ concrete data points
- casualties: all relevant factions
- economicChips: labeled metric cards
- economicNarrative: analytical paragraph
- scenarios: 2-3 probability-weighted forecasts

### Complete actor snapshot
- all fields filled: activityLevel, activityScore, stance, saying, doing, assessment

### Complete map story
- narrative 150+ characters
- 2+ timeline events
- 3+ key facts
- at least one highlight connection (strike/missile/target/asset IDs)
- primaryEventId or sourceEventIds linked

---

## Operational reminders

- use Europe/Stockholm for day assignment unless the conflict timezone says otherwise
- story titles must be objective
- map features need grounded coordinates
- do not fake tweet IDs
- bare events without enrichment are incomplete product — always bundle map + responses + sources
- empty day snapshot fields are a product failure — fill them
- NOOP is only valid when the dashboard is complete AND nothing new happened
- ALWAYS read the FULL /instructions manual including the API endpoint reference — do not skip sections
