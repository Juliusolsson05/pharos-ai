# OREF (Israel Home Front Command) Alerts

## Source
- **Active alerts**: `https://www.oref.org.il/WarningMessages/alert/alerts.json`
- **Alert history**: `https://www.oref.org.il/WarningMessages/alert/History/AlertsHistory.json`
- **Format**: JSON
- **Auth**: None (public endpoint)
- **Rate limit**: None documented
- **Update frequency**: Real-time (alerts broadcast immediately)
- **Coverage**: Israel only

## Poll interval
2 minutes (alerts are time-critical)

## Raw data — alert fields

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string | `133225678` | Alert ID |
| `cat` | string | `1` | Category: 1=missiles, 2=UAV, 3=earthquake, etc. |
| `title` | string | `ירי רקטות וטילים` | Alert title (Hebrew) |
| `data` | string[] | `["תל אביב - מרכז העיר"]` | Affected area names |
| `desc` | string | `היכנסו למרחב המוגן...` | Instructions (Hebrew) |
| `alertDate` | string | `2026-03-24T15:30:00` | Alert timestamp |

## Alert categories

| Cat | Meaning |
|-----|---------|
| `1` | Missiles and rockets |
| `2` | UAV/drone intrusion |
| `3` | Earthquake |
| `4` | Tsunami warning |
| `5` | Hazardous materials |
| `6` | Unconventional attack |
| `7` | Flooding |

## Geolocation

OREF alerts reference **area names** (Hebrew), not coordinates. We maintain a lookup table mapping ~25 major areas to approximate coordinates. Areas not in the table are skipped.

Coverage: Major cities and regions (Tel Aviv, Jerusalem, Haifa, Beer Sheva, Ashkelon, Sderot, Kiryat Shmona, etc.)

## What we store

- **`osint.events`**: One row per alert. `rawPayload` contains the full alert JSON.
- **`osint.map_features`**: Derived HEAT_POINT records for alerts with resolvable coordinates.

## Limitations

- Locally accessible (no geo-blocking). In production, needs Israel-exit proxy.
- Area names are Hebrew — our lookup table covers major areas only.
- Empty response = no active alerts (not an error).
- History endpoint returns last 24h only.
