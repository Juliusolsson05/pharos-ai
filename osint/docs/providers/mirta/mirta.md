# MIRTA (Military Installations, Ranges and Training Areas)

## Source
- **URL**: `https://services7.arcgis.com/n1YM8pTrFmm7L4hs/arcgis/rest/services/mirta/FeatureServer/0/query`
- **Format**: ArcGIS REST API (JSON)
- **Auth**: None
- **Rate limit**: Standard ArcGIS fair use
- **Update frequency**: Rarely changes (government dataset)
- **Coverage**: Global US DoD installations (737 sites)

## Poll interval
7 days

## Raw data fields

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `OBJECTID` | int | `1` | Unique record ID |
| `SITENAME` | string | `Camp Arifjan` | Installation name |
| `FEATURENAME` | string | `Camp Arifjan` | Feature name |
| `FEATUREDESCRIPTION` | string | `na` | Description |
| `COUNTRYNAME` | string | `usa` | Country (lowercase) |
| `STATENAMECODE` | string | `nc` | US state code |
| `SITEREPORTINGCOMPONENT` | string | `usa` | Military branch |
| `SITEOPERATIONALSTATUS` | string | `act` | Status (act=active) |
| `ISJOINTBASE` | string | `no` | Joint base flag |
| `geometry.x` | float | `-78.899` | Longitude |
| `geometry.y` | float | `35.994` | Latitude |

## Reporting components

| Code | Branch |
|------|--------|
| `usa` | US Army |
| `usaf` | US Air Force |
| `usn` | US Navy |
| `usmc` | US Marine Corps |
| `usar` | US Army Reserve |
| `armyNationalGuard` | Army National Guard |
| `airNationalGuard` | Air National Guard |

## What we store

- **`osint.mirta_sites`**: All 737 DoD sites with typed columns
- **`osint.map_features`**: Active installations as ASSET features (704 active)
