package pharos.api

import cats.effect.*
import cats.effect.implicits.parallelForGenSpawn
import cats.syntax.all.*
import io.circe.syntax.*
import io.circe.generic.semiauto.*
import org.http4s.*
import org.http4s.circe.*
import org.http4s.dsl.Http4sDsl
import pharos.correlation.{AnomalyDetector, AnomalyType, AnomalyResult, BaselineStats, CorrelationEngine}
import pharos.credibility.{CredibilityScore, SourceCredibility}
import pharos.domain.*
import pharos.domain.Codecs.given
import pharos.feeds.{CircuitBreaker, CircuitState, FeedIngester}
import pharos.geo.*
import pharos.db.Repository
import pharos.metrics.{EngineMetrics, MetricsCodecs}
import pharos.metrics.MetricsCodecs.given
import pharos.prediction.*

/** HTTP API routes for the Pharos correlation engine.
  *
  * Designed to be called by the Next.js frontend via internal API calls.
  * Endpoints mirror the existing /api/v1/ pattern for consistency.
  */
object Routes:

  // ── JSON codecs ────────────────────────────────────────────────
  given io.circe.Encoder[AnomalyType]       = io.circe.Encoder.encodeString.contramap(_.toString)
  given io.circe.Encoder[BaselineStats]     = deriveEncoder
  given io.circe.Encoder[AnomalyResult]     = deriveEncoder
  given io.circe.Encoder[CircuitState]      = io.circe.Encoder.encodeString.contramap(_.toString)
  given io.circe.Encoder[CredibilityScore]  = deriveEncoder
  given io.circe.Encoder[BoundingBox]       = deriveEncoder
  given io.circe.Encoder[Hotspot]           = deriveEncoder
  given io.circe.Encoder[Corridor]          = deriveEncoder
  given io.circe.Encoder[EscalationTrend]   = io.circe.Encoder.encodeString.contramap(_.toString)
  given io.circe.Encoder[ForecastPoint]     = deriveEncoder
  given io.circe.Encoder[EscalationPattern] = deriveEncoder
  given io.circe.Encoder[EscalationForecast] = deriveEncoder
  given io.circe.Encoder[TheaterOverview] = io.circe.Encoder.instance { t =>
    io.circe.Json.obj(
      "totalEvents"        -> t.totalEvents.asJson,
      "last24Hours"        -> t.last24Hours.asJson,
      "boundingBox"        -> t.boundingBox.asJson,
      "severityBreakdown"  -> t.severityBreakdown.map { case (k, v) => k.toString -> v }.asJson,
      "typeBreakdown"      -> t.typeBreakdown.map { case (k, v) => k.toString -> v }.asJson,
      "activePerspectives" -> t.activePerspectives.map(_.toString).asJson,
      "centroid"           -> io.circe.Json.obj("lon" -> t.centroid._1.asJson, "lat" -> t.centroid._2.asJson),
    )
  }

  def make[F[_]: Async](
    engine:      CorrelationEngine[F],
    ingester:    FeedIngester[F],
    repo:        Repository[F],
    anomaly:     AnomalyDetector[F],
    breaker:     CircuitBreaker[F],
    metrics:     EngineMetrics[F],
    geo:         GeoSpatialEngine[F],
    credibility: SourceCredibility[F],
    predictor:   EscalationPredictor[F],
  ): HttpRoutes[F] =
    val dsl = Http4sDsl[F]
    import dsl.*

    HttpRoutes.of[F] {

      // ── Health check ───────────────────────────────────────────
      case GET -> Root / "health" =>
        for
          dbOk      <- repo.checkConnectivity
          clusters  <- engine.activeClusters
          threat    <- engine.assessThreat
          anomalies <- anomaly.activeAnomalies
          forecast  <- predictor.forecast
          status     = if dbOk then "ok" else "degraded"
          resp <- Ok(io.circe.Json.obj(
            "status"          -> status.asJson,
            "service"         -> "pharos-engine".asJson,
            "version"         -> "0.8.0".asJson,
            "database"        -> dbOk.asJson,
            "activeClusters"  -> clusters.size.asJson,
            "threatLevel"     -> threat.overallLevel.toString.asJson,
            "activeAnomalies" -> anomalies.size.asJson,
            "escalationTrend" -> forecast.trend.toString.asJson,
          ))
        yield resp

      // ── Active event clusters (paginated) ──────────────────────
      case req @ GET -> Root / "api" / "v1" / "engine" / "clusters" =>
        engine.activeClusters.flatMap { clusters =>
          val page = Pagination.fromRequest(req)
          val items = page(clusters)
          Ok(page.envelope("clusters", items, clusters.size))
        }

      // ── Threat assessment ──────────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "threat" =>
        engine.assessThreat.flatMap(assessment =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> assessment.asJson))
        )

      // ── Anomaly detection status ───────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "anomalies" =>
        for
          active   <- anomaly.activeAnomalies
          baseline <- anomaly.baseline
          resp <- Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj(
              "anomalies" -> active.asJson,
              "count"     -> active.size.asJson,
              "baseline"  -> baseline.asJson,
            ),
          ))
        yield resp

      // ── Circuit breaker states ─────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "circuits" =>
        breaker.states.flatMap { states =>
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj(
              "circuits" -> states.map { case (feedId, state) =>
                io.circe.Json.obj("feedId" -> feedId.asJson, "state" -> state.asJson)
              }.toList.asJson,
            ),
          ))
        }

      // ── Metrics (JSON) ────────────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "metrics" =>
        metrics.snapshot.flatMap(snap =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> snap.asJson))
        )

      // ── Metrics (Prometheus text format) ───────────────────────
      case GET -> Root / "metrics" =>
        metrics.prometheusText.flatMap(text =>
          Ok(text).map(_.withContentType(
            org.http4s.headers.`Content-Type`(MediaType.text.plain)
          ))
        )

      // ── Geospatial: hotspots ───────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "geo" / "hotspots" =>
        geo.detectHotspots(minEvents = 3, radiusKm = 50.0).flatMap { hotspots =>
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj(
              "hotspots" -> hotspots.asJson,
              "count"    -> hotspots.size.asJson,
            ),
          ))
        }

      // ── Geospatial: corridors ──────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "geo" / "corridors" =>
        geo.analyzeCorridors(windowHours = 48).flatMap { corridors =>
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj(
              "corridors" -> corridors.asJson,
              "count"     -> corridors.size.asJson,
            ),
          ))
        }

      // ── Geospatial: theater overview ───────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "geo" / "theater" =>
        geo.theaterOverview.flatMap(overview =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> overview.asJson))
        )

      // ── Geospatial: proximity search ───────────────────────────
      case req @ GET -> Root / "api" / "v1" / "engine" / "geo" / "near" =>
        val params = req.uri.query.params
        val lon    = params.get("lon").flatMap(_.toDoubleOption)
        val lat    = params.get("lat").flatMap(_.toDoubleOption)
        val radius = params.get("radius").flatMap(_.toDoubleOption).getOrElse(50.0)

        (lon, lat) match
          case (Some(lo), Some(la)) =>
            geo.eventsNear(lo, la, radius).flatMap { events =>
              Ok(io.circe.Json.obj(
                "ok"   -> true.asJson,
                "data" -> io.circe.Json.obj(
                  "events" -> events.map(e => io.circe.Json.obj(
                    "id"        -> e.id.asJson,
                    "lon"       -> e.lon.asJson,
                    "lat"       -> e.lat.asJson,
                    "title"     -> e.title.asJson,
                    "severity"  -> e.severity.toString.asJson,
                    "eventType" -> e.eventType.toString.asJson,
                    "timestamp" -> e.timestamp.toString.asJson,
                    "distance"  -> GeoSpatialEngine.haversine(lo, la, e.lon, e.lat).asJson,
                  )).asJson,
                  "count" -> events.size.asJson,
                ),
              ))
            }
          case _ =>
            BadRequest(io.circe.Json.obj(
              "ok" -> false.asJson,
              "error" -> io.circe.Json.obj(
                "code"    -> "VALIDATION".asJson,
                "message" -> "Required query params: lon, lat (optional: radius in km)".asJson,
              ),
            ))

      // ── Source credibility scores ──────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "credibility" =>
        credibility.allScores.flatMap { scores =>
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj(
              "scores" -> scores.asJson,
              "count"  -> scores.size.asJson,
            ),
          ))
        }

      // ── Source credibility for a specific feed ─────────────────
      case GET -> Root / "api" / "v1" / "engine" / "credibility" / feedId =>
        credibility.scoreFor(feedId).flatMap(score =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> score.asJson))
        )

      // ── Escalation forecast ────────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "escalation" / "forecast" =>
        predictor.forecast.flatMap(f =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> f.asJson))
        )

      // ── Escalation time series (paginated) ─────────────────────
      case req @ GET -> Root / "api" / "v1" / "engine" / "escalation" / "series" =>
        predictor.timeSeries.flatMap { series =>
          val page = Pagination.fromRequest(req)
          val encoded = series.map(p => io.circe.Json.obj(
            "timestamp"    -> p.timestamp.toString.asJson,
            "intensity"    -> p.intensity.asJson,
            "dominantType" -> p.dominantType.toString.asJson,
            "maxSeverity"  -> p.maxSeverity.toString.asJson,
            "clusterCount" -> p.clusterCount.asJson,
          ))
          val items = page(encoded)
          Ok(page.envelope("points", items, encoded.size))
        }

      // ── Trigger one-shot feed ingestion ────────────────────────
      case POST -> Root / "api" / "v1" / "engine" / "ingest" =>
        for
          sources <- repo.loadFeedSources
          _       <- metrics.setGauge("configured_feeds", sources.size.toDouble)
          results <- sources.parTraverse(ingester.fetchAndCorrelate)
          flat     = results.flatten
          clusters <- engine.activeClusters
          _        <- repo.saveClusters(clusters)
          _        <- metrics.setGauge("active_clusters", clusters.size.toDouble)
          resp    <- Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj(
              "ingested"    -> flat.size.asJson,
              "newClusters" -> flat.count(_.isNew).asJson,
              "merged"      -> flat.count(!_.isNew).asJson,
            ),
          ))
        yield resp

      // ── Expire stale clusters ──────────────────────────────────
      case POST -> Root / "api" / "v1" / "engine" / "expire" =>
        engine.expireStale.flatMap { count =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> io.circe.Json.obj("expired" -> count.asJson)))
        }

      // ── Feed sources from DB ───────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "feeds" =>
        repo.loadFeedSources.flatMap { feeds =>
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj("feeds" -> feeds.asJson, "count" -> feeds.size.asJson),
          ))
        }

      // ── Cluster detail ─────────────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "clusters" / clusterId =>
        engine.activeClusters.flatMap { clusters =>
          clusters.find(_.id == clusterId) match
            case Some(cluster) =>
              Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> cluster.asJson))
            case None =>
              NotFound(io.circe.Json.obj(
                "ok"    -> false.asJson,
                "error" -> io.circe.Json.obj(
                  "code" -> "NOT_FOUND".asJson, "message" -> s"Cluster $clusterId not found".asJson,
                ),
              ))
        }

      // ── Phase transition history ────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "phases" =>
        repo.phaseHistory(50).flatMap { phases =>
          val encoded = phases.map { p =>
            io.circe.Json.obj(
              "fromRung"    -> p.fromRung.asJson,
              "toRung"      -> p.toRung.asJson,
              "score"       -> p.compositeScore.asJson,
              "trigger"     -> p.triggerDescription.asJson,
              "timestamp"   -> p.timestamp.toString.asJson,
              "direction"   -> (if p.toRung > p.fromRung then "ESCALATED" else "DE-ESCALATED").asJson,
            )
          }
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj("phases" -> encoded.asJson, "count" -> encoded.size.asJson),
          ))
        }.handleErrorWith { _ =>
          // Table may not exist if DB not initialized
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj("phases" -> List.empty[String].asJson, "count" -> 0.asJson),
          ))
        }
    }

end Routes
