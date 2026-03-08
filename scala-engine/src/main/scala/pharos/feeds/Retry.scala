package pharos.feeds

import cats.effect.*
import cats.syntax.all.*
import org.typelevel.log4cats.Logger
import scala.concurrent.duration.*

/** Retry with exponential backoff and jitter.
  *
  * Provides a composable retry combinator for IO effects.
  * Uses decorrelated jitter (AWS-style) to spread retries and avoid
  * thundering herds when multiple feeds fail simultaneously.
  *
  * Reference: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
  */
object Retry:

  final case class Policy(
    maxRetries: Int           = 3,
    baseDelay:  FiniteDuration = 500.millis,
    maxDelay:   FiniteDuration = 30.seconds,
    jitter:     Boolean        = true,
  )

  val default: Policy = Policy()

  /** Retry an effect according to the given policy. */
  def withPolicy[F[_]: Async: Logger, A](
    policy:  Policy,
    label:   String,
  )(fa: F[A]): F[A] =
    retryLoop(fa, policy, label, attempt = 0, lastDelay = policy.baseDelay)

  /** Convenience: retry with default policy. */
  def apply[F[_]: Async: Logger, A](label: String)(fa: F[A]): F[A] =
    withPolicy(default, label)(fa)

  private def retryLoop[F[_]: Async: Logger, A](
    fa:        F[A],
    policy:    Policy,
    label:     String,
    attempt:   Int,
    lastDelay: FiniteDuration,
  ): F[A] =
    fa.handleErrorWith { err =>
      if attempt >= policy.maxRetries then
        Logger[F].error(
          s"$label: all ${policy.maxRetries} retries exhausted. Last error: ${err.getMessage}"
        ) *> Temporal[F].raiseError(err)
      else
        computeDelay(policy, attempt, lastDelay).flatMap { delay =>
          Logger[F].warn(
            s"$label: attempt ${attempt + 1}/${policy.maxRetries} failed (${err.getMessage}), " +
            s"retrying in ${delay.toMillis}ms"
          ) *>
          Temporal[F].sleep(delay) *>
          retryLoop(fa, policy, label, attempt + 1, delay)
        }
    }

  /** Decorrelated jitter: sleep = min(maxDelay, random_between(baseDelay, lastDelay * 3)). */
  private def computeDelay[F[_]: Async](
    policy:    Policy,
    attempt:   Int,
    lastDelay: FiniteDuration,
  ): F[FiniteDuration] =
    if policy.jitter then
      Sync[F].delay {
        val ceiling = math.min(policy.maxDelay.toMillis, lastDelay.toMillis * 3)
        val floor   = policy.baseDelay.toMillis
        val jittered = floor + (math.random() * (ceiling - floor)).toLong
        FiniteDuration(math.max(floor, jittered), MILLISECONDS)
      }
    else
      Sync[F].pure {
        val exponential = policy.baseDelay * math.pow(2, attempt).toLong
        FiniteDuration(
          math.min(policy.maxDelay.toMillis, exponential.toMillis),
          MILLISECONDS,
        )
      }

end Retry
