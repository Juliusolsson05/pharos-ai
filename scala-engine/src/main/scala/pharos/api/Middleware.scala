package pharos.api

import cats.data.Kleisli
import cats.effect.*
import cats.syntax.all.*
import io.circe.syntax.*
import org.http4s.*
import org.http4s.circe.*
import org.typelevel.log4cats.Logger
import pharos.metrics.EngineMetrics
import java.util.UUID

/** Production middleware stack: request logging, error recovery, request timing,
  * and correlation ID propagation.
  *
  * Wraps the full HttpApp to provide:
  *   - Correlation ID (X-Request-Id) for distributed tracing
  *   - Structured request/response logging with duration and request ID
  *   - Uncaught exception recovery → 500 JSON responses
  *   - Per-request timing metrics (histogram)
  */
object Middleware:

  private val RequestIdHeader = org.typelevel.ci.CIString("X-Request-Id")

  /** Build the full middleware stack for production use. */
  def apply[F[_]: Async: Logger](
    metrics: EngineMetrics[F],
    app:     HttpApp[F],
  ): HttpApp[F] =
    errorRecovery(correlationId(requestTiming(metrics, requestLogging(app))))

  /** Inject or propagate X-Request-Id for distributed tracing. */
  private def correlationId[F[_]: Sync](app: HttpApp[F]): HttpApp[F] =
    Kleisli { req =>
      val existingId = req.headers.get(RequestIdHeader).map(_.head.value)
      for
        reqId <- existingId.fold(Sync[F].delay(UUID.randomUUID().toString.take(12)))(Sync[F].pure)
        resp  <- app.run(req)
      yield resp.putHeaders(Header.Raw(RequestIdHeader, reqId))
    }

  /** Log each request with method, path, status, request ID, and duration. */
  private def requestLogging[F[_]: Async: Logger](app: HttpApp[F]): HttpApp[F] =
    Kleisli { req =>
      val reqId = req.headers.get(RequestIdHeader).map(_.head.value).getOrElse("-")
      for
        start <- Async[F].monotonic
        resp  <- app.run(req)
        end   <- Async[F].monotonic
        dur    = (end - start).toMillis
        _     <- (if dur > 1000 then
                   Logger[F].warn(s"[$reqId] SLOW ${req.method} ${req.uri.path} → ${resp.status.code} (${dur}ms)")
                 else
                   Logger[F].debug(s"[$reqId] ${req.method} ${req.uri.path} → ${resp.status.code} (${dur}ms)"))
      yield resp
    }

  /** Record request duration histogram per route prefix. */
  private def requestTiming[F[_]: Async](metrics: EngineMetrics[F], app: HttpApp[F]): HttpApp[F] =
    Kleisli { req =>
      for
        start <- Async[F].monotonic
        resp  <- app.run(req)
        end   <- Async[F].monotonic
        dur    = (end - start).toMillis.toDouble
        route  = routeLabel(req)
        _     <- metrics.recordHistogram("http_request_duration_ms", dur,
                   Map("method" -> req.method.name, "route" -> route, "status" -> resp.status.code.toString))
        _     <- metrics.incCounter("http_requests_total",
                   Map("method" -> req.method.name, "route" -> route, "status" -> resp.status.code.toString))
      yield resp
    }

  /** Catch any unhandled exceptions and return structured 500 JSON. */
  private def errorRecovery[F[_]: Async: Logger](app: HttpApp[F]): HttpApp[F] =
    Kleisli { req =>
      app.run(req).handleErrorWith { err =>
        Logger[F].error(s"Unhandled error on ${req.method} ${req.uri.path}: ${err.getMessage}") *>
        Async[F].pure(
          Response[F](Status.InternalServerError)
            .withEntity(io.circe.Json.obj(
              "ok"    -> false.asJson,
              "error" -> io.circe.Json.obj(
                "code"    -> "INTERNAL_ERROR".asJson,
                "message" -> "An unexpected error occurred".asJson,
              ),
            ))
        )
      }
    }

  /** Normalize URI path to a stable route label for metrics (avoid cardinality explosion). */
  private def routeLabel[F[_]](req: Request[F]): String =
    val segments = req.uri.path.segments.map(_.decoded())
    val normalized = segments.take(5).map { seg =>
      // Replace UUIDs and numeric IDs with placeholders
      if seg.matches("[0-9a-f]{8,}") || seg.matches("\\d+") then ":id"
      else seg
    }
    "/" + normalized.mkString("/")

end Middleware
