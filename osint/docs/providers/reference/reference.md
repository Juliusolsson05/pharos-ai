# Reference Data (Curated Military Installations & Vessels)

## Source
- **URL**: Local JSON files in `osint/data/reference/`
- **Format**: JSON arrays
- **Auth**: None (local files)
- **Update frequency**: Manual — edit JSON files, re-run seed job

## Poll interval
24 hours (re-reads JSON files on each run, idempotent via upsert)

## Data files

```
osint/data/reference/
├── installations/
│   ├── coalition-bases.json    # US, UK, French, NATO bases
│   ├── iranian-sites.json      # IRGC, nuclear, air/naval bases
│   ├── israeli-sites.json      # IDF, IAF, nuclear
│   └── regional-bases.json     # Saudi, UAE, Turkish, Egyptian, Jordanian
└── vessels/
    ├── us-navy.json            # Carriers, destroyers, cruisers
    └── allied-navy.json        # French, UK vessels
```

## Installation fields

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `name` | string | `Al Udeid Air Base` | Official name |
| `nameLocal` | string? | `قاعدة العديد الجوية` | Local/Arabic name |
| `lat` | float | `25.1186` | Latitude |
| `lon` | float | `51.3186` | Longitude |
| `country` | string | `QA` | ISO 2-letter country code |
| `affiliation` | string | `FRIENDLY` | FRIENDLY, HOSTILE, NEUTRAL |
| `type` | string | `AIR_BASE` | AIR_BASE, NAVAL_BASE, ARMY_BASE, NUCLEAR_SITE, LAUNCH_ZONE, COMMAND |
| `operators` | string[] | `["USAF", "Qatar Air Force"]` | All military branches using the base |
| `units` | string[] | `["379th AEW"]` | Named units stationed there |
| `equipment` | string[] | `["F-15E", "KC-135"]` | Aircraft/weapon systems present |
| `personnel` | int? | `10000` | Approximate troop count |
| `runwayLengthM` | int? | `3750` | Longest runway in meters |
| `role` | string[] | `["Strike", "ISR"]` | Base roles/missions |
| `status` | string | `ACTIVE` | ACTIVE, REDUCED, CLOSED, UNDER_CONSTRUCTION |
| `hardening` | string? | `MOUNTAIN` | UNDERGROUND, MOUNTAIN, DISPERSED, or null |
| `description` | string | `2-3 sentences...` | Strategic importance and context |
| `sourceUrl` | string? | `https://en.wikipedia.org/...` | Primary source for verification |

## Vessel fields

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `name` | string | `USS Harry S. Truman` | Ship name |
| `hullNumber` | string? | `CVN-75` | Hull designation |
| `class` | string? | `Nimitz` | Ship class |
| `type` | string | `CARRIER` | CARRIER, DESTROYER, CRUISER, AMPHIBIOUS, FRIGATE, SUBMARINE |
| `country` | string | `US` | Flag state |
| `affiliation` | string | `FRIENDLY` | FRIENDLY, HOSTILE, NEUTRAL |
| `operator` | string | `US Navy 5th Fleet` | Operating command |
| `strikeGroup` | string? | `CSG-8` | Strike group assignment |
| `airWing` | string? | `CVW-1` | Embarked air wing |
| `displacement` | int? | `101600` | Displacement in tons |
| `personnel` | int? | `5500` | Crew + embarked |
| `homePort` | string? | `Norfolk, VA` | Home port |
| `typicalPatrolLat` | float? | `25.5` | Typical ME patrol latitude |
| `typicalPatrolLon` | float? | `56.0` | Typical ME patrol longitude |
| `role` | string[] | `["Strike", "Air superiority"]` | Vessel roles |
| `status` | string | `DEPLOYED` | DEPLOYED, IN_PORT, MAINTENANCE |
| `description` | string | `...` | Context and capabilities |
| `sourceUrl` | string? | `https://en.wikipedia.org/...` | Source URL |

## How to add a new installation

1. Open the relevant JSON file (or create a new one in `installations/`)
2. Copy-paste an existing entry
3. Fill in all fields from Wikipedia / official sources
4. Commit
5. The seed job runs every 24h and picks up changes automatically

## What we store

- **`osint.reference_installations`**: Full typed record per installation
- **`osint.reference_vessels`**: Full typed record per vessel
- **`osint.map_features`**: Derived ASSET features for the map API (source = `reference`)
