export const config = {
  port: parseInt(process.env.PORT || '4000', 10),

  db: {
    url: process.env.DATABASE_URL || 'postgresql://pharos:pharos@localhost:5434/pharos',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6382',
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'osint-raw',
  },

  gdelt: {
    lastUpdateUrl: 'http://data.gdeltproject.org/gdeltv2/lastupdate.txt',
    pollInterval: 15 * 60 * 1000, // 15 min
  },

  firms: {
    mapKey: process.env.NASA_FIRMS_MAP_KEY || '',
    pollInterval: 30 * 60 * 1000, // 30 min
  },

  overpass: {
    pollInterval: 24 * 60 * 60 * 1000, // 24h
  },

  nga: {
    pollInterval: 6 * 60 * 60 * 1000, // 6h
  },

  usgs: {
    pollInterval: 60 * 60 * 1000, // 1h
  },

  ucdp: {
    pollInterval: 6 * 60 * 60 * 1000, // 6h
  },

  opensky: {
    pollInterval: 5 * 60 * 1000, // 5 min
  },

  gpsjam: {
    apiKey: process.env.WINGBITS_API_KEY || '',
    pollInterval: 30 * 60 * 1000, // 30 min
  },

  oref: {
    pollInterval: 2 * 60 * 1000, // 2 min (alerts are time-critical)
  },

  aisstream: {
    apiKey: process.env.AISSTREAM_API_KEY || '',
    flushInterval: 60_000, // 60s
  },

  cloudflareRadar: {
    token: process.env.CLOUDFLARE_API_TOKEN || '',
    pollInterval: 30 * 60 * 1000, // 30 min
  },

  nightlights: {
    gibsBaseUrl: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_GapFilled_BRDF_Corrected_DayNightBand_Radiance/default',
    tileMatrixSet: 'GoogleMapsCompatible_Level8',
    zoomLevel: 8,
    pollInterval: 24 * 60 * 60 * 1000, // 24h
    snapshotInterval: 14 * 24 * 60 * 60 * 1000, // 14 days
    tileBucket: process.env.S3_TILE_BUCKET || 'osint-tiles',
    fetchConcurrency: 25,
    processConcurrency: 3,
    backfillStartDate: '2026-02-27',
  },
} as const;
