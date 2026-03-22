-- Snapshot reader setup for Supabase / production publishing.
--
-- Run this as a privileged role (for example `postgres`) against the
-- production database used by the public snapshot workflow.
--
-- The snapshot publish job expects a read-only role named `snapshot_reader`.
-- Update this file whenever `scripts/db/manifest.ts` changes its allowlist.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'snapshot_reader') THEN
    CREATE ROLE snapshot_reader LOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO snapshot_reader;

GRANT SELECT ON TABLE
  public."Actor",
  public."ActorAction",
  public."ActorDaySnapshot",
  public."CasualtySummary",
  public."ChannelFeed",
  public."Conflict",
  public."ConflictChannel",
  public."ConflictCollection",
  public."ConflictDaySnapshot",
  public."EconomicImpactChip",
  public."EconomicIndex",
  public."EventActorResponse",
  public."EventSource",
  public."IntelEvent",
  public."LeadershipControlState",
  public."LeadershipEventLink",
  public."LeadershipPerson",
  public."LeadershipRole",
  public."LeadershipRoleRelation",
  public."LeadershipTenure",
  public."MapFeature",
  public."MapStory",
  public."MapStoryEvent",
  public."PredictionGroup",
  public."RssFeed",
  public."Scenario",
  public."XPost"
TO snapshot_reader;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT SELECT ON TABLES TO snapshot_reader;
