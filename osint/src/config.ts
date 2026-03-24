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
} as const;
