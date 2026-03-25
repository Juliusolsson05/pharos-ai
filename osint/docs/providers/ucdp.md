# UCDP GED (Uppsala Conflict Data Programme)

## Source
- **URL**: `https://ucdpapi.pcr.uu.se/api/gedevents/{version}`
- **Format**: JSON (paginated)
- **Auth**: Access token required (header `x-ucdp-access-token`)
- **Rate limit**: Not documented
- **Coverage**: Global organized violence events

## Status
**Blocked** — UCDP now requires an access token. Sign up at https://ucdp.uu.se

## Poll interval
6 hours (when enabled)

## Version discovery
API version changes yearly (e.g. `24.1`, `25.1`). The provider probes multiple versions to find the latest available.

## Response fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Event ID |
| `type_of_violence` | int | 1=state-based, 2=non-state, 3=one-sided |
| `latitude` | float | Event latitude |
| `longitude` | float | Event longitude |
| `country` | string | Country name |
| `date_start` | string | Event start date |
| `date_end` | string | Event end date |
| `best` | int | Best estimate of deaths |
| `side_a` | string | Actor A |
| `side_b` | string | Actor B |
| `source_article` | string | Source reference |

## What we would store (when enabled)

- **`osint.map_features`**: STRIKE_ARC (state-based violence with fatalities) + HEAT_POINT (all events)
- Filtered to Middle East region
