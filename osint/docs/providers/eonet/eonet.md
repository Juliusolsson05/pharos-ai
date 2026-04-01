# EONET + GDACS (Natural Disaster Events)

## Sources
- **NASA EONET**: `https://eonet.gsfc.nasa.gov/api/v3/events`
- **GDACS**: `https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP`
- **Format**: JSON (EONET) / GeoJSON (GDACS)
- **Auth**: None
- **Rate limit**: None documented
- **Coverage**: Global (both sources)

## Poll interval
2 hours

## EONET fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Event ID |
| `title` | string | Event description |
| `categories[].title` | string | Earthquakes, Volcanoes, Wildfires, etc. |
| `geometry[].coordinates` | [lon, lat] | Event location |
| `geometry[].date` | string | Observation date |
| `sources[].url` | string | Source URL |

## GDACS fields

| Field | Type | Description |
|-------|------|-------------|
| `properties.eventid` | string | Event ID |
| `properties.name` | string | Event name |
| `properties.eventtype` | string | EQ, TC, VO, FL, WF |
| `geometry.coordinates` | [lon, lat] | Event location |
| `properties.fromdate` | string | Start date |

## What we store

- **`osint.map_features`**: HEAT_POINT features for each natural event
- ~342 EONET + ~59 GDACS events per fetch
