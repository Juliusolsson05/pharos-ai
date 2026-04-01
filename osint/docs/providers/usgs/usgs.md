# USGS Earthquake Hazards (Seismic Events)

## Source
- **URL**: `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson`
- **Format**: GeoJSON
- **Auth**: None
- **Rate limit**: None documented (public USGS feed)
- **Update frequency**: ~5 minutes
- **Coverage**: Global (we filter to Middle East region)

## Poll interval
1 hour

## Raw data — GeoJSON feature properties

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string | `us6000abc1` | Unique event ID |
| `properties.place` | string | `45km NE of Tehran, Iran` | Human-readable location |
| `properties.mag` | float | `5.2` | Magnitude |
| `properties.time` | number | `1711234567000` | Origin time (Unix ms) |
| `properties.updated` | number | `1711234600000` | Last update time |
| `properties.url` | string | `https://earthquake.usgs.gov/...` | Event detail URL |
| `properties.detail` | string | `https://...` | Detailed GeoJSON URL |
| `properties.felt` | number | `150` | Number of "felt" reports |
| `properties.cdi` | float | `4.5` | Community Decimal Intensity |
| `properties.mmi` | float | `5.0` | Modified Mercalli Intensity |
| `properties.alert` | string | `green` | PAGER alert level |
| `properties.status` | string | `reviewed` | Review status |
| `properties.tsunami` | number | `0` | Tsunami flag (0/1) |
| `properties.sig` | number | `350` | Event significance (0-1000) |
| `properties.net` | string | `us` | Reporting network |
| `properties.code` | string | `6000abc1` | Event code |
| `properties.types` | string | `,moment-tensor,...` | Available data types |
| `properties.nst` | number | `45` | Number of stations |
| `properties.dmin` | float | `0.5` | Minimum station distance (degrees) |
| `properties.rms` | float | `0.8` | RMS travel time residual |
| `properties.gap` | float | `60` | Azimuthal gap (degrees) |
| `properties.magType` | string | `mww` | Magnitude type |
| `properties.type` | string | `earthquake` | Event type |
| `geometry.coordinates[0]` | float | `51.389` | Longitude |
| `geometry.coordinates[1]` | float | `35.697` | Latitude |
| `geometry.coordinates[2]` | float | `10.0` | Depth (km) |

## Region filter
Middle East bounding box: lat 5-45, lon 20-70

## What we store

- **`osint.events`**: One row per earthquake. `rawPayload` contains full GeoJSON feature.
- **`osint.map_features`**: Derived HEAT_POINT records.

## OSINT relevance

Large seismic events in conflict zones can indicate:
- Underground nuclear tests (signature: shallow depth, no aftershock pattern)
- Large ammunition depot explosions
- Natural earthquakes affecting infrastructure

Cross-reference with FIRMS thermal data and GDELT reports.
