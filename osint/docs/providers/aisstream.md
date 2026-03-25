# AISStream (Vessel Tracking)

## Source
- **URL**: `wss://stream.aisstream.io/v0/stream`
- **Protocol**: WebSocket (persistent connection)
- **Format**: JSON messages
- **Auth**: Free API key from https://aisstream.io
- **Rate limit**: None documented
- **Coverage**: Global AIS network (~1.3 msg/sec for ME region)

## Ingestion pattern
**Stream** (not a BullMQ job). Persistent WebSocket connection that runs alongside the server. Accumulates vessel positions in memory, flushes to DB every 60 seconds.

## Subscription

```json
{
  "Apikey": "...",
  "BoundingBoxes": [
    [[10, 25], [45, 70]],
    [[12, 30], [35, 45]],
    [[30, 25], [42, 37]]
  ],
  "FilterMessageTypes": ["PositionReport"]
}
```

## Message fields

| Field | Path | Type | Description |
|-------|------|------|-------------|
| MMSI | `MetaData.MMSI` | int | Maritime Mobile Service Identity (unique per vessel) |
| Ship name | `MetaData.ShipName` | string | Vessel name |
| Ship type | `MetaData.ShipType` | int | AIS ship type code |
| Destination | `MetaData.Destination` | string | Reported destination |
| Latitude | `Message.PositionReport.Latitude` | float | Current latitude |
| Longitude | `Message.PositionReport.Longitude` | float | Current longitude |
| Speed | `Message.PositionReport.Sog` | float | Speed over ground (knots) |
| Heading | `Message.PositionReport.TrueHeading` | int | True heading (degrees) |
| Course | `Message.PositionReport.Cog` | float | Course over ground |

## Ship type classification

| Code range | Type |
|-----------|------|
| 30-39 | Fishing |
| 35 | Military |
| 40-49 | High speed craft |
| 60-69 | Passenger |
| 70-79 | Cargo |
| 80-89 | Tanker |

## What we store

- **`osint.ais_positions`**: One row per vessel (upserted by MMSI). Latest known position.
- **`osint.map_features`**: ASSET features with ship type and movement status.
- ~100+ unique vessels per flush in the ME region.
