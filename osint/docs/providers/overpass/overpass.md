# OpenStreetMap Overpass API (Military Installations)

## Source
- **URL**: `https://overpass-api.de/api/interpreter` (POST with Overpass QL query)
- **Format**: JSON
- **Auth**: None
- **Rate limit**: Fair use (~1 req/sec, no hard cap)
- **Update frequency**: Community-edited (changes are rare for military sites)
- **Coverage**: Global (we query Middle East bbox `12,25,42,65`)

## Poll interval
24 hours

## Overpass QL query

```
[out:json][timeout:45];
(
  nwr(12,25,42,65)[military~"^(base|airfield|naval_base|barracks|range|checkpoint)$"];
  nwr(12,25,42,65)[aeroway=aerodrome][military];
  nwr(12,25,42,65)[landuse=military]["name"];
);
out center tags;
```

## Raw data — OSM element fields

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `type` | string | `node`/`way`/`relation` | OSM element type |
| `id` | number | `123456789` | OSM element ID |
| `lat` | float | `29.2314` | Latitude (nodes) or center lat (ways with `out center`) |
| `lon` | float | `47.9797` | Longitude |
| `center.lat` | float | `29.2314` | Center latitude (ways/relations) |
| `center.lon` | float | `47.9797` | Center longitude |
| `tags.name` | string | `Ali Al Salem Air Base` | Facility name |
| `tags.name:en` | string | `Ali Al Salem Air Base` | English name |
| `tags.name:ar` | string | `قاعدة علي السالم الجوية` | Arabic name |
| `tags.military` | string | `airfield` | Military classification |
| `tags.military_service` | string | `air_force` | Branch of service |
| `tags.aeroway` | string | `aerodrome` | Aviation facility type |
| `tags.operator` | string | `US Air Force` | Operating entity |
| `tags.landuse` | string | `military` | Land use classification |
| `tags.addr:country` | string | `KW` | Country code |
| `tags.is_in:country` | string | `Kuwait` | Country name |
| `tags.wikidata` | string | `Q1234567` | Wikidata entity ID |
| `tags.wikipedia` | string | `en:Ali Al Salem Air Base` | Wikipedia article |

## Type classification

| OSM tags | → Our type |
|----------|-----------|
| `military=airfield` | `AIR_BASE` |
| `aeroway=aerodrome` + `military=*` | `AIR_BASE` |
| `military=naval_base` | `NAVAL_BASE` |
| `military=base` + `military_service=navy` | `NAVAL_BASE` |
| `military=base` + `military_service=air_force` | `AIR_BASE` |
| `military=base` (default) | `ARMY_BASE` |
| `military=barracks` | `ARMY_BASE` |

## What we store

- **`osint.events`**: One row per installation. `rawPayload` contains full OSM tags + element metadata.
- **`osint.map_features`**: Derived ASSET records.

## Data volume
~8,700 raw elements → ~4,500 named installations in the Middle East region.
