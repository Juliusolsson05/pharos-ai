export const SNAPSHOT_TAG = 'db-snapshot-latest';
export const SNAPSHOT_DUMP = 'pharos-db-snapshot.dump';
export const SNAPSHOT_META = 'pharos-db-snapshot.json';
export const SNAPSHOT_DIR = 'temp/db-snapshots';
export const SNAPSHOT_DB_URL_ENV = 'PUBLIC_SNAPSHOT_DATABASE_URL';
export const SNAPSHOT_OWNER = process.env.PUBLIC_SNAPSHOT_OWNER ?? 'Juliusolsson05';
export const SNAPSHOT_REPO = process.env.PUBLIC_SNAPSHOT_REPO ?? 'pharos-ai';

export const INCLUDED_TABLES = [
  'Actor',
  'ActorAction',
  'ActorDaySnapshot',
  'CasualtySummary',
  'ChannelFeed',
  'Conflict',
  'ConflictChannel',
  'ConflictCollection',
  'ConflictDaySnapshot',
  'EconomicImpactChip',
  'EconomicIndex',
  'EventActorResponse',
  'EventSource',
  'IntelEvent',
  'LeadershipControlState',
  'LeadershipEventLink',
  'LeadershipPerson',
  'LeadershipRole',
  'LeadershipRoleRelation',
  'LeadershipTenure',
  'MapFeature',
  'MapStory',
  'MapStoryEvent',
  'PredictionGroup',
  'RssFeed',
  'Scenario',
  'XPost',
] as const;

export const EXCLUDED_TABLES = [
  'AnonymousVisitor',
  'ChatSession',
  'ChatSessionMessage',
  'DocumentEmbedding',
  '_prisma_migrations',
] as const;

export const REQUIRED_TABLES = [
  'Actor',
  'Conflict',
  'IntelEvent',
  'LeadershipPerson',
  'LeadershipRole',
  'XPost',
] as const;

export const INCLUDED_SQL = INCLUDED_TABLES.map(table => `public."${table}"`).join(', ');
