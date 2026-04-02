# Global Power Plant Database (WRI)

Database of ~34,936 geolocated power plants worldwide from the World Resources Institute.

## Source

| Field | Value |
|-------|-------|
| Provider | World Resources Institute (WRI) |
| Dataset | Global Power Plant Database v1.3.0 |
| URL | https://datasets.wri.org/dataset/globalpowerplantdatabase |
| Format | CSV (24 columns, ~34,936 rows, 11.4 MB) |
| Auth | None |
| Update frequency | Static (final release, early 2022) |
| Coverage | Global (167 countries) |

## Download

```
https://raw.githubusercontent.com/wri/global-power-plant-database/master/output_database/global_power_plant_database.csv
```

## Key Fields

| Field | Description |
|-------|-------------|
| gppd_idnr | Unique plant identifier (10-12 chars) |
| name | Plant name (Romanized) |
| country / country_long | ISO 3166-1 alpha-3 + full name |
| latitude / longitude | Coordinates |
| capacity_mw | Electrical generating capacity (MW) |
| primary_fuel | Energy source (Nuclear, Gas, Oil, Coal, Hydro, Solar, Wind, etc.) |
| other_fuel1/2/3 | Secondary/tertiary fuels |
| commissioning_year | Year plant became operational |
| owner | Majority owner/operator |
| estimated_generation_gwh | Estimated annual output |

## Fuel Types

Nuclear, Gas, Oil, Coal, Hydro, Solar, Wind, Biomass, Waste, Geothermal, Wave, Tidal, Petcoke, Cogeneration, Storage

## Map Feature Mapping

| Field | Value |
|-------|-------|
| Feature type | `ASSET` |
| Category | `INFRASTRUCTURE` |
| Type | `NUCLEAR`, `GAS`, `OIL`, `COAL`, `HYDRO`, `SOLAR`, `WIND`, `OTHER` |
| Priority | P1 (Nuclear), P2 (>=500MW), P3 (rest) |

## Ingestion

- Job name: `power-plants`
- Schedule: Every 30 days (static dataset, re-check for updates)
- DB table: `osint.power_plants`
- Unique key: `gppdIdnr`

## Note

This project is no longer maintained by WRI as of early 2022. The data is a snapshot, not a live feed. Still valuable as the most comprehensive open power plant dataset available.
