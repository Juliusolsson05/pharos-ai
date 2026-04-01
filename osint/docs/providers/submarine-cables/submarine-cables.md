# Submarine Cables (TeleGeography)

## Source
- **URL**: `https://www.submarinecablemap.com/api/v3/cable/cable-geo.json`
- **Landing points**: `https://www.submarinecablemap.com/api/v3/landing-point/landing-point-geo.json`
- **Format**: GeoJSON
- **Auth**: None
- **Rate limit**: None documented
- **Coverage**: Global (709 cables total, ~81 through ME region)

## Poll interval
7 days

## Cable fields

| Field | Type | Description |
|-------|------|-------------|
| `properties.id` | string | Cable ID |
| `properties.name` | string | Cable name |
| `properties.color` | string | Display color (hex) |
| `geometry.type` | string | MultiLineString |
| `geometry.coordinates` | number[][][] | Route coordinates |

## Landing point fields

| Field | Type | Description |
|-------|------|-------------|
| `properties.id` | string | Landing point ID |
| `properties.name` | string | Location name |
| `geometry.coordinates` | [lon, lat] | Position |

## Region filter
Middle East bounding box: lat 5-45, lon 20-70

## What we store

- **`osint.map_features`**: THREAT_ZONE (cable routes as MultiLineString) + ASSET (landing points)
- ~81 cables + ~129 landing points in the ME region
