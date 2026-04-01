# NASA FIRMS (Fire Information for Resource Management System)

## Source
- **URL**: `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/{bbox}/{days}`
- **Format**: CSV with header row
- **Auth**: Free MAP_KEY (register at https://firms.modaps.eosdis.nasa.gov/api/map_key/)
- **Rate limit**: 5,000 requests per 10 minutes
- **Update frequency**: ~3 hours (near real-time satellite passes)
- **Coverage**: Global (we filter to Middle East bbox `25,10,65,42`)

## Poll interval
30 minutes

## Raw data — all CSV columns

| Column | Type | Example | Description |
|--------|------|---------|-------------|
| `latitude` | float | `33.3406` | Fire detection latitude |
| `longitude` | float | `44.4009` | Fire detection longitude |
| `bright_ti4` | float | `342.5` | Brightness temp from 4μm channel (Kelvin) |
| `scan` | float | `0.39` | Scan pixel size |
| `track` | float | `0.36` | Track pixel size |
| `acq_date` | string | `2026-03-24` | Acquisition date |
| `acq_time` | string | `0130` | Acquisition time (HHMM UTC) |
| `satellite` | string | `Suomi NPP` | Source satellite |
| `confidence` | string | `n` | Detection confidence: `l`=low, `n`=nominal, `h`=high |
| `version` | string | `2.0NRT` | Data processing version |
| `bright_ti5` | float | `295.3` | Brightness temp from 11μm channel (Kelvin) |
| `frp` | float | `12.4` | Fire Radiative Power (MW) — intensity measure |
| `daynight` | string | `N` | `D`=day, `N`=night detection |

## What we store

- **`osint.events`**: One row per hotspot detection. `rawPayload` contains all CSV columns.
- **`osint.map_features`**: Derived HEAT_POINT records (confidence >= nominal).

## Key fields for analysis

- **`frp`** (Fire Radiative Power): Higher = more intense. Explosions/impacts produce high FRP spikes.
- **`bright_ti4`**: Brightness temperature. Very high values (>400K) suggest non-natural heat sources.
- **`confidence`**: Filter `l` (low) to reduce false positives. `h` (high) is most reliable.
- **`daynight`**: Night detections have fewer false positives (no solar reflection).
- **`scan`/`track`**: Pixel dimensions. Smaller = more precise location.

## OSINT relevance

FIRMS thermal anomalies in conflict zones correlate with:
- Airstrikes and missile impacts
- Ammunition depot explosions
- Oil infrastructure fires
- Artillery bombardment

Cross-reference with GDELT strike events for confirmation.
