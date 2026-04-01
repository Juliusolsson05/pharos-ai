# OGIM — Oil and Gas Infrastructure Mapping Database (EDF)

Global database of ~6.7M oil and gas infrastructure features maintained by the Environmental Defense Fund. We ingest a filtered subset (~85-110K features).

## Source

| Field | Value |
|-------|-------|
| Provider | Environmental Defense Fund (EDF) |
| Dataset | OGIM v2.7 |
| DOI | 10.5281/zenodo.7466757 |
| Format | GeoPackage (SQLite, 3.1 GB) |
| Auth | None |
| Update frequency | ~Quarterly (latest: March 2025) |
| Coverage | Global (152 countries, 188 source datasets) |

## Download

```
https://zenodo.org/api/records/15103476/files/OGIM_v2.7.gpkg/content
```

## Layers Ingested

### Point facilities (all records kept)

| Layer | Count | Key fields |
|-------|-------|------------|
| Crude Oil Refineries | 692 | `LIQ_CAPACITY_BPD`, `OPERATOR` |
| LNG Facilities | 547 | `GAS_CAPACITY_MMCFD`, `OPERATOR`, `OGIM_STATUS` |
| Petroleum Terminals | 3,661 | `LIQ_CAPACITY_BPD`, `GAS_CAPACITY_MMCFD`, `NUM_STORAGE_TANKS` |
| Compressor Stations | 12,156 | `GAS_CAPACITY_MMCFD`, `SITE_HP`, `NUM_COMPR_UNITS` |
| Offshore Platforms | 3,903 | `OPERATOR`, `OGIM_STATUS`, `COMMODITY` |
| Gathering/Processing | 10,396 | `GAS_CAPACITY_MMCFD`, `LIQ_CAPACITY_BPD`, `SITE_HP` |
| Flaring Detections | 10,233 | `AVERAGE_FLARE_TEMP_K`, `GAS_FLARED_MMCF`, `FLARE_YEAR` |
| Stations Other | 8,468 | `COMMODITY`, `OPERATOR` |
| Injection/Disposal | ~5-8K | Filtered to `OGIM_STATUS IN (OPERATIONAL, PRODUCING, INJECTING)` |

### Pipelines (filtered)

| Layer | Raw count | Filter | Est. kept |
|-------|-----------|--------|-----------|
| Oil & Gas Pipelines | 1,858,109 | `PIPE_LENGTH_KM > 10` OR has capacity data | ~10-30K |

Key fields: `PIPE_DIAMETER_MM`, `PIPE_LENGTH_KM`, `PIPE_MATERIAL`, `GAS_CAPACITY_MMCFD`, `LIQ_CAPACITY_BPD`, `COMMODITY`

### Polygon boundaries (all records kept)

| Layer | Count | Key fields |
|-------|-------|------------|
| Basins | 709 | `NAME`, `RESERVOIR_TYPE`, `AREA_KM2` |
| Fields | 17,742 | `NAME`, `RESERVOIR_TYPE`, `AREA_KM2` |
| License Blocks | 2,833 | `NAME`, `RESERVOIR_TYPE`, `AREA_KM2` |

### Layers skipped

| Layer | Count | Reason |
|-------|-------|--------|
| Wells | 4,537,369 | Too granular (individual drill holes) |
| Equipment/Components | 98,047 | Individual valves/separators |
| Tank Batteries | 132,220 | Well-site level, too granular |

## Data Conventions

- **Null values**: `-999` for numbers, `'N/A'` for strings, `'1900-01-01'` for dates
- **String casing**: ALL CAPS for categorical values
- **CRS**: WGS 84 (EPSG:4326)
- **OGIM_STATUS values**: PERMITTING, UNDER CONSTRUCTION, OPERATIONAL, PROPOSED, DRILLING, COMPLETED, PRODUCING, INACTIVE, ABANDONED, INJECTING, STORAGE/MAINTENANCE/OBSERVATION, OTHER

## Map Feature Mapping

| Data | Feature type | Category | Type examples |
|------|-------------|----------|--------------|
| Facilities | `ASSET` | `INFRASTRUCTURE` | REFINERY, LNG_TERMINAL, COMPRESSOR_STATION, etc. |
| Pipelines | `THREAT_ZONE` | `INFRASTRUCTURE` | PIPELINE |
| Basins/Fields | `THREAT_ZONE` | `INFRASTRUCTURE` | OIL_GAS_BASIN, OIL_GAS_FIELD, LICENSE_BLOCK |

## Ingestion

- Job name: `ogim`
- Schedule: Every 90 days
- DB tables: `osint.ogim_facilities`, `osint.ogim_pipelines`, `osint.ogim_basins`
- Unique key: `ogimId` (globally unique across all layers)
- Dependency: `ogr2ogr` (GDAL) must be installed on the host

## Processing Pipeline

1. Stream-download 3.1 GB GeoPackage to temp directory
2. Use `ogr2ogr` to extract each layer as GeoJSON (with SQL filters for pipelines)
3. Parse GeoJSON, clean sentinel values (`-999` → null, `'N/A'` → null)
4. Upsert into typed Prisma tables
5. Derive map features for API
