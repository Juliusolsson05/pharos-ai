# World Port Index (NGA Pub 150)

Global database of 3,800+ ports and terminals maintained by the US National Geospatial-Intelligence Agency.

## Source

| Field | Value |
|-------|-------|
| Provider | NGA (National Geospatial-Intelligence Agency) |
| Dataset | World Port Index, Publication 150 |
| URL | https://msi.nga.mil/Publications/WPI |
| Format | CSV (109 columns, ~3,804 rows) |
| Auth | None |
| Update frequency | Monthly |
| Coverage | Global |

## Download

```
https://msi.nga.mil/api/publications/download?type=view&key=16920959/SFH00000/UpdatedPub150.csv
```

## Key Fields

| Field | Description |
|-------|-------------|
| World Port Index Number | Unique identifier |
| Main Port Name | Primary port name |
| Country Code | Country |
| Latitude / Longitude | Coordinates |
| Harbor Size | Very Small / Small / Medium / Large |
| Harbor Type | Coastal, River, Lake, etc. |
| Channel/Anchorage/Cargo Pier Depth | Depths in meters |
| Max Vessel Length/Draft | Size limits |
| Oil/LNG/Container Terminal | Boolean facility flags |
| Repairs, Dry Dock, Railway | Capability flags |
| Cranes (Fixed/Mobile/Floating/Container) | Equipment flags |

Full field documentation: https://msi.nga.mil/api/publications/download?key=16920959/SFH00000/WPI_Explanation_of_Data_Fields.pdf&type=view

## Map Feature Mapping

| Field | Value |
|-------|-------|
| Feature type | `ASSET` |
| Category | `INSTALLATION` |
| Type | `COMMERCIAL_PORT`, `NAVAL_PORT`, `OIL_TERMINAL`, `LNG_TERMINAL`, `CONTAINER_PORT` |
| Priority | P1 (Large), P2 (Medium), P3 (Small/Very Small) |

## Ingestion

- Job name: `ports`
- Schedule: Every 30 days
- DB table: `osint.ports`
- Unique key: `wpiNumber`
