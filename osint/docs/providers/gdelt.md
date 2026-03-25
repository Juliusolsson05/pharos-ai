# GDELT 2.0 Event Export

## Source
- **URL**: `http://data.gdeltproject.org/gdeltv2/lastupdate.txt` → links to `.export.CSV.zip`
- **Format**: Tab-separated CSV inside a ZIP archive (no header row)
- **Auth**: None
- **Rate limit**: 1 request per 5 seconds
- **Update frequency**: Every 15 minutes
- **Coverage**: Global

## Poll interval
15 minutes

## Raw data — all 61 columns

| Col | Field | Example | Stored |
|-----|-------|---------|--------|
| 0 | GlobalEventID | `1295850361` | Yes |
| 1 | Day | `20260324` | Yes |
| 2 | MonthYear | `202603` | Raw |
| 3 | Year | `2026` | Raw |
| 4 | FractionDate | `2026.2329` | Raw |
| 5 | Actor1Code | `USAGOV` | Yes (as actor1Name) |
| 6 | Actor1Name | `UNITED STATES` | Raw |
| 7 | Actor1CountryCode | `USA` | Raw |
| 8 | Actor1KnownGroupCode | `GOV` | Raw |
| 9 | Actor1EthnicCode | | Raw |
| 10 | Actor1Religion1Code | | Raw |
| 11 | Actor1Religion2Code | | Raw |
| 12 | Actor1Type1Code | `GOV` | Raw |
| 13 | Actor1Type2Code | | Raw |
| 14 | Actor1Type3Code | | Raw |
| 15 | Actor2Code | `IRN` | Yes (as actor2Name) |
| 16 | Actor2Name | `IRAN` | Raw |
| 17 | Actor2CountryCode | `IRN` | Raw |
| 18 | Actor2KnownGroupCode | | Raw |
| 19 | Actor2EthnicCode | | Raw |
| 20 | Actor2Religion1Code | | Raw |
| 21 | Actor2Religion2Code | | Raw |
| 22 | Actor2Type1Code | | Raw |
| 23 | Actor2Type2Code | | Raw |
| 24 | Actor2Type3Code | | Raw |
| 25 | IsRootEvent | `1` | Raw |
| 26 | EventCode | `193` | Yes |
| 27 | EventBaseCode | `193` | Raw |
| 28 | EventRootCode | `19` | Raw |
| 29 | QuadClass | `4` | Raw |
| 30 | GoldsteinScale | `-10.0` | Raw |
| 31 | NumMentions | `4` | Yes |
| 32 | NumSources | `1` | Raw |
| 33 | NumArticles | `4` | Raw |
| 34 | AvgTone | `-5.23` | Yes |
| 35 | Actor1Geo_Type | `3` | Raw |
| 36 | Actor1Geo_FullName | `Baghdad, Iraq` | Raw |
| 37 | Actor1Geo_CountryCode | `IZ` | Raw |
| 38 | Actor1Geo_ADM1Code | `IZ05` | Raw |
| 39 | Actor1Geo_ADM2Code | | Raw |
| 40 | Actor1Geo_Lat | `33.3406` | Raw |
| 41 | Actor1Geo_Long | `44.4009` | Raw |
| 42 | Actor1Geo_FeatureID | | Raw |
| 43 | Actor2Geo_Type | | Raw |
| 44 | Actor2Geo_FullName | | Raw |
| 45 | Actor2Geo_CountryCode | | Raw |
| 46 | Actor2Geo_ADM1Code | | Raw |
| 47 | Actor2Geo_ADM2Code | | Raw |
| 48 | Actor2Geo_Lat | | Raw |
| 49 | Actor2Geo_Long | | Raw |
| 50 | Actor2Geo_FeatureID | | Raw |
| 51 | ActionGeo_Type | `3` | Raw |
| 52 | ActionGeo_FullName | `Baghdad, Iraq` | Raw |
| 53 | ActionGeo_CountryCode | `IZ` | Yes |
| 54 | ActionGeo_ADM1Code | `IZ05` | Raw |
| 55 | ActionGeo_ADM2Code | | Raw |
| 56 | ActionGeo_Lat | `33.3406` | Yes |
| 57 | ActionGeo_Long | `44.4009` | Yes |
| 58 | ActionGeo_FeatureID | | Raw |
| 59 | DATEADDED | `20260324` | Raw |
| 60 | SOURCEURL | `https://...` | Yes |

## CAMEO event codes we filter for

| Root | Meaning |
|------|---------|
| `18` | Use conventional military force |
| `19` | Fight / armed clash |
| `20` | Unconventional mass violence |

Sub-codes `193` (Bombing) and `194` (Air/Drone Strike) → STRIKE_ARC features.

## What we store

- **`osint.events`**: One row per conflict event. `rawPayload` contains all 61 columns as JSON.
- **`osint.map_features`**: Derived STRIKE_ARC and HEAT_POINT records.
- **`osint.raw_ingests`**: One row per ZIP file ingested, with S3 key to archived raw file.

## Data we previously discarded (now stored in rawPayload)

- Actor full names, country codes, group codes, type codes
- Actor1/Actor2 geographic location (separate from action location)
- GoldsteinScale (cooperation/conflict scale -10 to +10)
- QuadClass (1=cooperation, 2=verbal cooperation, 3=verbal conflict, 4=material conflict)
- NumSources, NumArticles (beyond NumMentions)
- IsRootEvent flag
- ADM1/ADM2 codes and full location names
- GeoNames FeatureID
