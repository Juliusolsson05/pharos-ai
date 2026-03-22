-- Verifies that snapshot_reader can read every allowlisted snapshot table.
--
-- Run this after grant-snapshot-reader.sql or after adding new snapshot tables.

WITH required_tables AS (
  SELECT unnest(ARRAY[
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
    'XPost'
  ]) AS table_name
), current_grants AS (
  SELECT table_name
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee = 'snapshot_reader'
    AND privilege_type = 'SELECT'
)
SELECT required_tables.table_name AS missing_select_grant
FROM required_tables
LEFT JOIN current_grants USING (table_name)
WHERE current_grants.table_name IS NULL
ORDER BY required_tables.table_name;
