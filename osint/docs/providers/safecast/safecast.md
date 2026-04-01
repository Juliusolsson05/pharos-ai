# Safecast (Radiation Monitoring)

## Source
- **URL**: `https://api.safecast.org/measurements.json`
- **Format**: JSON
- **Auth**: None
- **Rate limit**: None documented
- **Coverage**: Global crowd-sourced network (sparse in ME)

## Poll interval
2 hours

## Response fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Measurement ID |
| `latitude` | float | Sensor latitude |
| `longitude` | float | Sensor longitude |
| `value` | float | Radiation value |
| `unit` | string | Unit (cpm = counts per minute) |
| `captured_at` | string | Measurement timestamp |
| `device_id` | int | Sensor device ID |
| `location_name` | string | Location description |

## Filtering

- Region: Middle East bounding box (lat 5-45, lon 20-70)
- Only elevated readings (>= 100 CPM) shown on map
- Normal background: 10-60 CPM, concerning: > 300 CPM

## What we store

- **`osint.map_features`**: HEAT_POINT features for elevated readings only
- Radiation spikes near nuclear sites (Dimona, Natanz, Fordow) would be conflict indicators
