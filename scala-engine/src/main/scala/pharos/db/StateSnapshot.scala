package pharos.db

import cats.effect.*
import cats.syntax.all.*
import doobie.*
import doobie.implicits.*
import doobie.postgres.implicits.*
import io.circe.*
import io.circe.syntax.*
import io.circe.parser.*
import org.typelevel.log4cats.Logger
import java.time.Instant

/** Persistent state snapshot system for engine restart resilience.
  *
  * Periodically serializes component state to PostgreSQL so the engine
  * can recover analysis context (escalation history, anomaly baselines,
  * contradiction tracking, etc.) after a restart.
  *
  * Uses a simple key-value store with JSON payloads and timestamps.
  * Components register snapshot providers and restore handlers.
  */
trait StateSnapshot[F[_]]:
  /** Save a named state blob. */
  def save(key: String, data: Json): F[Unit]

  /** Load a named state blob. Returns None if not found. */
  def load(key: String): F[Option[Json]]

  /** Save all registered component states. */
  def saveAll(components: List[(String, F[Json])]): F[Int]

  /** Initialize the snapshot table. */
  def initSchema: F[Unit]

object StateSnapshot:

  def make[F[_]: Async: Logger](xa: Transactor[F]): StateSnapshot[F] =
    new StateSnapshotImpl[F](xa)

  private class StateSnapshotImpl[F[_]: Async: Logger](
    xa: Transactor[F],
  ) extends StateSnapshot[F]:

    override def save(key: String, data: Json): F[Unit] =
      val jsonStr = data.noSpaces
      sql"""
        INSERT INTO engine_state_snapshots (key, data, updated_at)
        VALUES ($key, $jsonStr::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = NOW()
      """.update.run.void.transact(xa).handleErrorWith { err =>
        Logger[F].warn(s"Failed to save snapshot '$key': ${err.getMessage}")
      }

    override def load(key: String): F[Option[Json]] =
      sql"""
        SELECT data::text FROM engine_state_snapshots WHERE key = $key
      """.query[String]
        .option
        .transact(xa)
        .flatMap {
          case Some(jsonStr) =>
            parse(jsonStr) match
              case Right(json) =>
                Logger[F].info(s"Restored snapshot '$key'") *> Async[F].pure(Some(json))
              case Left(err) =>
                Logger[F].warn(s"Corrupt snapshot '$key': ${err.getMessage}") *> Async[F].pure(None)
          case None =>
            Async[F].pure(None)
        }
        .handleErrorWith { err =>
          Logger[F].warn(s"Failed to load snapshot '$key': ${err.getMessage}") *>
          Async[F].pure(None)
        }

    override def saveAll(components: List[(String, F[Json])]): F[Int] =
      components.traverse { case (key, getData) =>
        getData.flatMap(json => save(key, json)).as(1)
          .handleErrorWith { err =>
            Logger[F].warn(s"Snapshot failed for '$key': ${err.getMessage}").as(0)
          }
      }.map(_.sum)

    override def initSchema: F[Unit] =
      sql"""
        CREATE TABLE IF NOT EXISTS engine_state_snapshots (
          key        TEXT PRIMARY KEY,
          data       JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_snapshots_updated ON engine_state_snapshots(updated_at DESC);
      """.update.run.void.transact(xa)

  end StateSnapshotImpl

end StateSnapshot
