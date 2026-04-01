# OpenSky Network (Military Flight Tracking)

## Source
- **URL**: `https://opensky-network.org/api/states/all?lamin=...&lomin=...&lamax=...&lomax=...`
- **Format**: JSON
- **Auth**: None (anonymous access, rate limited)
- **Rate limit**: ~10 requests/min anonymous, ~100/min with free account
- **Update frequency**: Real-time (ADS-B broadcast)
- **Coverage**: Global (we query Western Europe/ME + Eastern ME regions)

## Poll interval
5 minutes

## Raw data — state vector fields

OpenSky returns an array of state vectors. Each vector is a positional array:

| Index | Field | Type | Example | Description |
|-------|-------|------|---------|-------------|
| 0 | `icao24` | string | `adf7c8` | ICAO 24-bit transponder address (hex) |
| 1 | `callsign` | string | `RCH4521` | Callsign (8 chars max, may be null) |
| 2 | `origin_country` | string | `United States` | Country of registration |
| 3 | `time_position` | number | `1711234567` | Unix timestamp of last position update |
| 4 | `last_contact` | number | `1711234570` | Unix timestamp of last contact |
| 5 | `longitude` | float | `47.123` | WGS-84 longitude |
| 6 | `latitude` | float | `29.456` | WGS-84 latitude |
| 7 | `baro_altitude` | float | `10668` | Barometric altitude in meters |
| 8 | `on_ground` | bool | `false` | Whether aircraft is on ground |
| 9 | `velocity` | float | `250.5` | Ground speed in m/s |
| 10 | `true_track` | float | `45.2` | Track angle in degrees (clockwise from north) |
| 11 | `vertical_rate` | float | `-1.2` | Vertical rate in m/s |
| 12 | `sensors` | array | `[1,2]` | Sensor IDs (can be null) |
| 13 | `geo_altitude` | float | `10700` | Geometric altitude in meters |
| 14 | `squawk` | string | `1234` | Transponder squawk code |
| 15 | `spi` | bool | `false` | Special Position Indicator |
| 16 | `position_source` | number | `0` | 0=ADS-B, 1=ASTERIX, 2=MLAT, 3=FLARM |
| 17 | `category` | number | `0` | Aircraft category (0-17, see ADS-B spec) |

## Military identification

Aircraft are identified as military by matching their ICAO24 hex address against known military ranges:

| Hex range | Operator | Country |
|-----------|----------|---------|
| `ADF7C8-AFFFFF` | USAF | USA |
| `400000-40003F` | RAF | UK |
| `43C000-43CFFF` | RAF | UK |
| `3AA000-3AFFFF` | French AF | France |
| `738A00-738BFF` | Israeli AF | Israel |
| `4D0000-4D03FF` | NATO | NATO |
| `710258-71028F` | RSAF | Saudi Arabia |
| `896800-896BFF` | UAEAF | UAE |
| `4B8200-4B82FF` | TuAF | Turkey |
| ... | (22 total ranges) | |

Additionally, callsign prefixes are checked: `RCH`, `REACH`, `DUKE`, `IRON`, `NATO`, `ASCOT`, etc.

## What we store

- **`osint.events`**: One row per military aircraft sighting. `rawPayload` contains all 18 state vector fields + military classification.
- **`osint.map_features`**: Derived ASSET records for airborne military flights.

## Limitations

- Military aircraft sometimes turn off ADS-B transponders (OPSEC)
- OpenSky blocks datacenter IPs in production (needs residential proxy)
- Anonymous rate limit is low (~10 req/min)
- Position accuracy varies by source (ADS-B vs MLAT)
