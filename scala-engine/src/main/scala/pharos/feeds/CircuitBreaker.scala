package pharos.feeds

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import java.time.{Duration, Instant}

/** Three-state circuit breaker for external service calls.
  *
  * Protects feed fetching from cascading failures. When a feed source
  * fails repeatedly, the circuit opens and fast-fails subsequent calls
  * until a cooldown period elapses, then enters half-open for a probe.
  *
  * States:
  *   CLOSED   → normal operation, tracking failures
  *   OPEN     → all calls fast-fail, waiting for cooldown
  *   HALF_OPEN → single probe call allowed to test recovery
  */
trait CircuitBreaker[F[_]]:
  /** Execute an effect through the circuit breaker. */
  def protect[A](feedId: String)(fa: F[A]): F[A]

  /** Get current state of all tracked circuits. */
  def states: F[Map[String, CircuitState]]

object CircuitBreaker:

  def make[F[_]: Async](
    maxFailures:    Int = 5,
    cooldownMillis: Long = 60000,      // 1 minute
    halfOpenMax:    Int = 1,
  ): F[CircuitBreaker[F]] =
    AtomicCell[F].of(Map.empty[String, BreakerState]).map { cell =>
      new CircuitBreakerImpl[F](cell, maxFailures, cooldownMillis, halfOpenMax)
    }

  private class CircuitBreakerImpl[F[_]: Async](
    stateCell:      AtomicCell[F, Map[String, BreakerState]],
    maxFailures:    Int,
    cooldownMillis: Long,
    halfOpenMax:    Int,
  ) extends CircuitBreaker[F]:

    override def protect[A](feedId: String)(fa: F[A]): F[A] =
      for
        now       <- Temporal[F].realTimeInstant
        permitted <- checkPermission(feedId, now)
        result    <- (if permitted then
                       fa.attempt.flatMap {
                         case Right(a) => recordSuccess(feedId) *> Temporal[F].pure(a)
                         case Left(e)  => recordFailure(feedId, now) *> Temporal[F].raiseError(e)
                       }
                     else
                       Temporal[F].raiseError(CircuitOpenException(feedId)))
      yield result

    override def states: F[Map[String, CircuitState]] =
      for
        now    <- Temporal[F].realTimeInstant
        states <- stateCell.get
      yield states.view.mapValues(s => resolveState(s, now)).toMap

    private def checkPermission(feedId: String, now: Instant): F[Boolean] =
      stateCell.evalModify { states =>
        Temporal[F].pure {
          val breaker = states.getOrElse(feedId, BreakerState.closed)
          resolveState(breaker, now) match
            case CircuitState.Closed   => (states, true)
            case CircuitState.Open     => (states, false)
            case CircuitState.HalfOpen =>
              // Allow one probe, mark as probing
              val updated = breaker.copy(halfOpenProbes = breaker.halfOpenProbes + 1)
              if breaker.halfOpenProbes < halfOpenMax then
                (states.updated(feedId, updated), true)
              else
                (states, false)
        }
      }

    private def recordSuccess(feedId: String): F[Unit] =
      stateCell.update(states =>
        states.updated(feedId, BreakerState.closed)
      )

    private def recordFailure(feedId: String, now: Instant): F[Unit] =
      stateCell.update { states =>
        val breaker  = states.getOrElse(feedId, BreakerState.closed)
        val failures = breaker.consecutiveFailures + 1
        val updated  = if failures >= maxFailures then
          breaker.copy(
            consecutiveFailures = failures,
            lastFailure         = Some(now),
            openedAt            = Some(now),
            halfOpenProbes      = 0,
          )
        else
          breaker.copy(
            consecutiveFailures = failures,
            lastFailure         = Some(now),
          )
        states.updated(feedId, updated)
      }

    private def resolveState(breaker: BreakerState, now: Instant): CircuitState =
      breaker.openedAt match
        case None => CircuitState.Closed
        case Some(opened) =>
          val elapsed = Duration.between(opened, now).toMillis
          if elapsed < cooldownMillis then CircuitState.Open
          else CircuitState.HalfOpen

  end CircuitBreakerImpl

  // ── Internal state ─────────────────────────────────────────────

  private case class BreakerState(
    consecutiveFailures: Int,
    lastFailure:         Option[Instant],
    openedAt:            Option[Instant],
    halfOpenProbes:      Int,
  )

  private object BreakerState:
    val closed: BreakerState = BreakerState(0, None, None, 0)

end CircuitBreaker

enum CircuitState:
  case Closed, Open, HalfOpen

case class CircuitOpenException(feedId: String)
  extends RuntimeException(s"Circuit breaker OPEN for feed: $feedId")
