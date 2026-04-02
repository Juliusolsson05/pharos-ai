# GPSJam / Wingbits (GPS Interference Detection)

## Source
- **URL**: `https://customer-api.wingbits.com/v1/gps/jam`
- **Format**: JSON
- **Auth**: Free API key from Wingbits
- **Rate limit**: Not documented
- **Update frequency**: Near real-time (based on ADS-B GPS quality data)
- **Coverage**: Global (we filter to Middle East region)

## Poll interval
30 minutes

## Raw data — interference hex fields

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `h3` | string | `891ea4d6c17ffff` | H3 hexagonal cell index |
| `lat` | float | `33.45` | Cell center latitude |
| `lon` | float | `44.12` | Cell center longitude |
| `level` | string | `high` | Interference level: `low`, `medium`, `high` |
| `region` | string | `iran-iraq` | Named region classification |
| `npAvg` | float | `12.5` | Average navigation performance |
| `pct` | float | `0.45` | Percentage of affected aircraft |
| `bad` | number | `15` | Count of aircraft with bad GPS |
| `total` | number | `33` | Total aircraft in cell |
| `sampleCount` | number | `100` | Number of samples |
| `aircraftCount` | number | `33` | Distinct aircraft count |

## Region filter
Middle East bounding box: lat 5-45, lon 20-70. Only `medium` and `high` interference kept.

## What we store

- **`osint.events`**: One row per interference hex. `rawPayload` contains all fields.
- **`osint.map_features`**: Derived THREAT_ZONE records.

## OSINT relevance

GPS interference/jamming/spoofing in conflict zones indicates:
- Electronic warfare operations
- Military jamming systems (Russia/Iran known operators)
- Navigation denial zones near active operations
- Correlation with military flight patterns (planes avoiding jammed areas)

Cross-reference with OpenSky flight paths and GDELT conflict events.
