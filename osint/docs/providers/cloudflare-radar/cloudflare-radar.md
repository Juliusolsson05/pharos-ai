# Cloudflare Radar (Internet Outages)

## Source
- **URL**: `https://api.cloudflare.com/client/v4/radar/annotations/outages`
- **Format**: JSON
- **Auth**: Free Cloudflare API token (from https://dash.cloudflare.com/profile/api-tokens)
- **Rate limit**: Standard Cloudflare API limits
- **Coverage**: Global (filtered to 22 ME countries)

## Poll interval
30 minutes

## Response fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Outage ID |
| `asn` | number | Autonomous System Number |
| `asnName` | string | ISP/network name |
| `locations` | string | Comma-separated country codes |
| `startDate` | string | Outage start |
| `endDate` | string | Outage end (null if ongoing) |
| `scope` | string | country / region / asn |
| `description` | string | Outage description |
| `linkedUrl` | string | Radar dashboard URL |

## Country filter

IR, IQ, SY, LB, IL, PS, JO, SA, AE, QA, BH, KW, OM, YE, EG, TR, CY, DJ, SD, LY, PK, AF

## What we store

- **`osint.map_features`**: THREAT_ZONE features at country centroid coordinates
- Country-wide outages get P1 priority, ASN-level get P2
