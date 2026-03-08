package pharos.db

import cats.effect.*
import cats.syntax.all.*
import doobie.*
import doobie.implicits.*
import doobie.postgres.implicits.*
import doobie.WeakAsync.doobieWeakAsyncForAsync
import pharos.domain.*

/** Database repository for feed sources and correlation results.
  * Reads feed configuration from the existing Prisma-managed PostgreSQL schema
  * and writes correlation results to new engine-specific tables.
  */
trait Repository[F[_]]:
  def loadFeedSources: F[List[FeedSource]]
  def saveCluster(cluster: EventCluster): F[Unit]
  def saveClusters(clusters: List[EventCluster]): F[Int]
  def loadActiveClusters: F[List[EventCluster]]
  def initSchema: F[Unit]
  def checkConnectivity: F[Boolean]
  def logThreatLevel(level: String, escalation: Double, clusterCount: Int, recommendation: String): F[Unit]
  def logPhaseTransition(fromRung: Int, toRung: Int, compositeScore: Double, trigger: String): F[Unit]
  def phaseHistory(limit: Int = 50): F[List[PhaseTransition]]

object Repository:

  def make[F[_]: Async](xa: Transactor[F]): Repository[F] = new Repository[F]:

    override def loadFeedSources: F[List[FeedSource]] =
      sql"""
        SELECT id, name, url, perspective::text, country, tags, "stateFunded", tier
        FROM "RssFeed"
      """.query[(String, String, String, String, String, List[String], Boolean, Int)]
        .map { case (id, name, url, perspStr, country, tags, sf, tier) =>
          FeedSource(
            id          = id,
            name        = name,
            url         = url,
            perspective = Perspective.values.find(_.toString == perspStr).getOrElse(Perspective.WESTERN),
            country     = country,
            tags        = tags,
            stateFunded = sf,
            tier        = tier,
          )
        }
        .to[List]
        .transact(xa)

    override def saveCluster(cluster: EventCluster): F[Unit] =
      sql"""
        INSERT INTO engine_event_clusters (
          id, canonical_title, severity, event_type, location,
          first_seen, last_updated, source_count, confidence_score,
          threat_delta, summary
        ) VALUES (
          ${cluster.id}, ${cluster.canonicalTitle}, ${cluster.severity.toString},
          ${cluster.eventType.toString}, ${cluster.location},
          ${cluster.firstSeen}, ${cluster.lastUpdated}, ${cluster.sourceCount},
          ${cluster.confidenceScore}, ${cluster.threatDelta}, ${cluster.summary}
        )
        ON CONFLICT (id) DO UPDATE SET
          canonical_title  = EXCLUDED.canonical_title,
          last_updated     = EXCLUDED.last_updated,
          source_count     = EXCLUDED.source_count,
          confidence_score = EXCLUDED.confidence_score,
          threat_delta     = EXCLUDED.threat_delta,
          summary          = EXCLUDED.summary
      """.update.run.map(_ => ()).transact(xa)

    override def loadActiveClusters: F[List[EventCluster]] =
      sql"""
        SELECT id, canonical_title, severity, event_type, location,
               first_seen, last_updated, source_count, confidence_score,
               threat_delta, summary
        FROM engine_event_clusters
        WHERE last_updated > NOW() - INTERVAL '24 hours'
        ORDER BY last_updated DESC
      """.query[(String, String, String, String, Option[String], java.time.Instant, java.time.Instant, Int, Double, Double, Option[String])]
        .map { case (id, title, sev, et, loc, first, last, count, conf, delta, summ) =>
          EventCluster(
            id              = id,
            canonicalTitle  = title,
            severity        = Severity.values.find(_.toString == sev).getOrElse(Severity.STANDARD),
            eventType       = EventType.values.find(_.toString == et).getOrElse(EventType.POLITICAL),
            location        = loc,
            firstSeen       = first,
            lastUpdated     = last,
            sourceCount     = count,
            perspectives    = Set.empty, // not persisted — rebuilt at runtime
            feedItemLinks   = List.empty,
            confidenceScore = conf,
            threatDelta     = delta,
            keywords        = Set.empty,
            summary         = summ,
          )
        }
        .to[List]
        .transact(xa)

    override def saveClusters(clusters: List[EventCluster]): F[Int] =
      if clusters.isEmpty then Async[F].pure(0)
      else
        val insertSql = """
          INSERT INTO engine_event_clusters (
            id, canonical_title, severity, event_type, location,
            first_seen, last_updated, source_count, confidence_score,
            threat_delta, summary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            canonical_title  = EXCLUDED.canonical_title,
            last_updated     = EXCLUDED.last_updated,
            source_count     = EXCLUDED.source_count,
            confidence_score = EXCLUDED.confidence_score,
            threat_delta     = EXCLUDED.threat_delta,
            summary          = EXCLUDED.summary
        """
        Update[( String, String, String, String, Option[String],
                 java.time.Instant, java.time.Instant, Int, Double, Double, Option[String])](insertSql)
          .updateMany(clusters.map(c => (
            c.id, c.canonicalTitle, c.severity.toString, c.eventType.toString,
            c.location, c.firstSeen, c.lastUpdated, c.sourceCount,
            c.confidenceScore, c.threatDelta, c.summary,
          )))
          .transact(xa)

    override def logThreatLevel(level: String, escalation: Double, clusterCount: Int, recommendation: String): F[Unit] =
      sql"""
        INSERT INTO engine_threat_log (threat_level, escalation_score, cluster_count, recommendation)
        VALUES ($level, $escalation, $clusterCount, $recommendation)
      """.update.run.map(_ => ()).transact(xa)

    override def logPhaseTransition(fromRung: Int, toRung: Int, compositeScore: Double, trigger: String): F[Unit] =
      sql"""
        INSERT INTO engine_phase_history (from_rung, to_rung, composite_score, trigger_description)
        VALUES ($fromRung, $toRung, $compositeScore, $trigger)
      """.update.run.map(_ => ()).transact(xa)

    override def phaseHistory(limit: Int): F[List[PhaseTransition]] =
      sql"""
        SELECT from_rung, to_rung, composite_score, trigger_description, timestamp
        FROM engine_phase_history
        ORDER BY timestamp DESC
        LIMIT $limit
      """.query[(Int, Int, Double, String, java.time.Instant)]
        .map { case (from, to, score, trigger, ts) =>
          PhaseTransition(from, to, score, trigger, ts)
        }
        .to[List]
        .transact(xa)

    override def checkConnectivity: F[Boolean] =
      sql"SELECT 1".query[Int].unique.transact(xa)
        .map(_ => true)
        .handleError(_ => false)

    override def initSchema: F[Unit] =
      sql"""
        CREATE TABLE IF NOT EXISTS engine_event_clusters (
          id               TEXT PRIMARY KEY,
          canonical_title  TEXT NOT NULL,
          severity         TEXT NOT NULL,
          event_type       TEXT NOT NULL,
          location         TEXT,
          first_seen       TIMESTAMPTZ NOT NULL,
          last_updated     TIMESTAMPTZ NOT NULL,
          source_count     INT NOT NULL DEFAULT 1,
          confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0.5,
          threat_delta     DOUBLE PRECISION NOT NULL DEFAULT 0.0,
          summary          TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_clusters_updated ON engine_event_clusters(last_updated DESC);
        CREATE INDEX IF NOT EXISTS idx_clusters_severity ON engine_event_clusters(severity);

        CREATE TABLE IF NOT EXISTS engine_threat_log (
          id               SERIAL PRIMARY KEY,
          timestamp        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          threat_level     TEXT NOT NULL,
          escalation_score DOUBLE PRECISION NOT NULL,
          cluster_count    INT NOT NULL,
          recommendation   TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_threat_log_ts ON engine_threat_log(timestamp DESC);

        CREATE TABLE IF NOT EXISTS engine_phase_history (
          id                    SERIAL PRIMARY KEY,
          timestamp             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          from_rung             INT NOT NULL,
          to_rung               INT NOT NULL,
          composite_score       DOUBLE PRECISION NOT NULL,
          trigger_description   TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_phase_history_ts ON engine_phase_history(timestamp DESC);
      """.update.run.map(_ => ()).transact(xa)

end Repository

/** Record of an escalation phase transition. */
final case class PhaseTransition(
  fromRung:           Int,
  toRung:             Int,
  compositeScore:     Double,
  triggerDescription: String,
  timestamp:          java.time.Instant,
)
