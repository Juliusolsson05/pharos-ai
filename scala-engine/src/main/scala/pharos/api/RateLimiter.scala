package pharos.api

import cats.data.Kleisli
import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import io.circe.syntax.*
import org.http4s.*
import org.http4s.circe.*
import java.time.Instant

/** Token-bucket rate limiter for API protection.
  *
  * Each client (identified by IP or X-Forwarded-For) gets a bucket of tokens.
  * Tokens are consumed per request and refill at a steady rate. When empty,
  * requests receive 429 Too Many Requests with Retry-After header.
  *
  * Global rate limiting is also enforced to protect overall system capacity.
  */
object RateLimiter:

  final case class Config(
    maxTokens:     Int    = 100,     // max burst
    refillPerSec:  Double = 10.0,    // tokens restored per second
    globalMaxRps:  Int    = 500,     // global requests per second cap
  )

  def apply[F[_]: Async](
    config: Config,
    app:    HttpApp[F],
  ): F[HttpApp[F]] =
    for
      buckets     <- AtomicCell[F].of(Map.empty[String, Bucket])
      globalCount <- Ref[F].of(GlobalWindow(Instant.EPOCH, 0))
    yield Kleisli { req =>
      val clientId = extractClientId(req)
      for
        now       <- Temporal[F].realTimeInstant
        globalOk  <- checkGlobal(globalCount, config.globalMaxRps, now)
        result    <- if !globalOk then tooManyRequests[F]("Global rate limit exceeded", 5)
                     else checkAndConsume(buckets, clientId, config, now).flatMap {
                       case Some(remaining) =>
                         app.run(req).map(_.putHeaders(
                           Header.Raw(org.typelevel.ci.CIString("X-RateLimit-Remaining"), remaining.toString),
                           Header.Raw(org.typelevel.ci.CIString("X-RateLimit-Limit"), config.maxTokens.toString),
                         ))
                       case None =>
                         tooManyRequests[F]("Rate limit exceeded", 1)
                     }
      yield result
    }

  private def extractClientId[F[_]](req: Request[F]): String =
    req.headers.get(org.typelevel.ci.CIString("X-Forwarded-For"))
      .map(_.head.value.split(",").head.trim)
      .orElse(req.remoteAddr.map(_.toString))
      .getOrElse("unknown")

  private def checkGlobal[F[_]: Temporal](
    ref:    Ref[F, GlobalWindow],
    maxRps: Int,
    now:    Instant,
  ): F[Boolean] =
    ref.modify { gw =>
      val currentSec = now.getEpochSecond
      if currentSec != gw.second.getEpochSecond then
        (GlobalWindow(now, 1), true)
      else if gw.count >= maxRps then
        (gw, false)
      else
        (gw.copy(count = gw.count + 1), true)
    }

  private def checkAndConsume[F[_]: Sync](
    buckets:  AtomicCell[F, Map[String, Bucket]],
    clientId: String,
    config:   Config,
    now:      Instant,
  ): F[Option[Int]] =
    buckets.evalModify { map =>
      Sync[F].delay {
        val bucket = map.getOrElse(clientId, Bucket(config.maxTokens.toDouble, now))
        val refilled = bucket.refill(config.maxTokens, config.refillPerSec, now)
        if refilled.tokens >= 1.0 then
          val consumed = refilled.copy(tokens = refilled.tokens - 1.0)
          (map.updated(clientId, consumed), Some(consumed.tokens.toInt))
        else
          (map.updated(clientId, refilled), None)
      }
    }

  private def tooManyRequests[F[_]: Temporal](message: String, retryAfter: Int): F[Response[F]] =
    Temporal[F].pure(
      Response[F](Status.TooManyRequests)
        .withEntity(io.circe.Json.obj(
          "ok"    -> false.asJson,
          "error" -> io.circe.Json.obj(
            "code"    -> "RATE_LIMITED".asJson,
            "message" -> message.asJson,
          ),
        ))
        .putHeaders(
          Header.Raw(org.typelevel.ci.CIString("Retry-After"), retryAfter.toString),
        )
    )

  // ── Internal state ─────────────────────────────────────────────

  private case class Bucket(tokens: Double, lastRefill: Instant):
    def refill(max: Int, perSec: Double, now: Instant): Bucket =
      val elapsed = java.time.Duration.between(lastRefill, now).toMillis / 1000.0
      val added   = elapsed * perSec
      val capped  = math.min(max.toDouble, tokens + added)
      Bucket(capped, now)

  private case class GlobalWindow(second: Instant, count: Int)

end RateLimiter
