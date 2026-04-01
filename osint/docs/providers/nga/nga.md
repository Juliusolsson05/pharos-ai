# NGA Navigational Warnings

## Source
- **URL**: `https://msi.nga.mil/api/publications/broadcast-warn?status=A&output=json`
- **Format**: JSON
- **Auth**: None (fully public)
- **Rate limit**: None documented
- **Update frequency**: Near real-time (warnings issued continuously)
- **Coverage**: Global (we filter to NAVAREA A + P)

## Poll interval
6 hours

## Raw data — warning fields

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `msgYear` | number | `2024` | Warning year |
| `msgNumber` | number | `517` | Warning sequence number |
| `navArea` | string | `P` | Navigation area (P=Pacific/Indian, A=Atlantic) |
| `subregion` | string | `12` | Sub-region code |
| `text` | string | `PERSIAN GULF...` | Full warning text with embedded coordinates |
| `status` | string | `A` | Status (A=active) |
| `issueDate` | string | `081653Z MAY 2024` | Issue date in military format |
| `authority` | string | `SFH 0/24...` | Issuing authority |
| `cancelDate` | string/null | | Cancellation date |
| `cancelNavArea` | string/null | | Cancellation reference area |
| `cancelMsgYear` | number/null | | Cancellation reference year |
| `cancelMsgNumber` | number/null | | Cancellation reference number |

## Coordinate extraction

Coordinates are embedded in the `text` field as free-form maritime text:

**Pattern**: `(\d{1,2})-(\d{2}\.\d+)(N|S)\s+(\d{1,3})-(\d{2}\.\d+)(E|W)`

**Example**: `24-54.89N 052-21.66E` → lat 24.9148, lon 52.3610

Many warnings contain multiple coordinate pairs defining an area boundary.

## NAVAREA coverage

| Area | Region |
|------|--------|
| `P` | Pacific/Indian Ocean — Persian Gulf, Arabian Sea, Gulf of Oman |
| `A` | Atlantic — Red Sea, Eastern Mediterranean, Suez |

## What we store

- **`osint.events`**: One row per warning. `rawPayload` contains the full JSON record.
- **`osint.map_features`**: Derived THREAT_ZONE records with extracted coordinates.

## Warning categories found in text

- Drilling operations, survey vessels
- Dangerous wrecks, submerged objects
- Inoperative navigation aids
- Military exercises (firing areas)
- Cable laying operations
- Piracy warnings
