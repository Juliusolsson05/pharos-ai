package pharos

import cats.effect.*
import cats.effect.Deferred
import cats.syntax.all.*
import io.circe.syntax.*
import com.comcast.ip4s.*
import doobie.*
import doobie.hikari.HikariTransactor
import fs2.Stream
import org.http4s.ember.client.EmberClientBuilder
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.server.middleware.*
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.slf4j.Slf4jLogger
import pharos.alerting.{AlertEngine, AlertSnapshot}
import pharos.api.{AnalysisRoutes, ApiDocs, Middleware, RateLimiter, Routes}
import pharos.db.StateSnapshot
import pharos.chain.{ChainEvent, EventChainAnalyzer}
import pharos.contradiction.ContradictionDetector
import pharos.correlation.{AnomalyDetector, CorrelationEngine}
import pharos.credibility.SourceCredibility
import pharos.db.Repository
import pharos.domain.*
import pharos.feeds.{CircuitBreaker, FeedIngester}
import pharos.geo.{GeoEvent, GeoSpatialEngine}
import pharos.metrics.EngineMetrics
import pharos.narrative.NarrativeSynthesizer
import pharos.network.SourceNetworkAnalyzer
import pharos.prediction.{EscalationPoint, EscalationPredictor}
import pharos.scoring.ThreatScorer
import pharos.sse.{EngineEvent, EngineEventType, EventBus}
import pharos.strategy.StrategicGameModel
import pharos.temporal.{TemporalAnalyzer, TemporalEvent}
import pureconfig.ConfigSource
import java.time.Instant
import scala.concurrent.ExecutionContext

/** Pharos Engine v0.8 — full-spectrum conflict analysis microservice.
  *
  * Components (20):
  *   - CorrelationEngine:      clusters feed items into events
  *   - AnomalyDetector:        statistical deviation detection
  *   - GeoSpatialEngine:       hotspot detection, corridor analysis
  *   - SourceCredibility:      dynamic source reliability scoring
  *   - EscalationPredictor:    EWMA-based escalation forecasting
  *   - NarrativeSynthesizer:   automated SITREP generation
  *   - ContradictionDetector:  cross-source conflict detection
  *   - EventChainAnalyzer:     causal chain reconstruction
  *   - EventBus:               SSE real-time event streaming
  *   - ThreatScorer:           composite multi-factor threat scoring with confidence intervals
  *   - SourceNetworkAnalyzer:  source relationship mapping, echo chamber detection
  *   - TemporalAnalyzer:       time-pattern mining (surges, night ops, rapid response)
  *   - StrategicGameModel:     multi-actor scenario analysis with escalation ladder
  *   - CircuitBreaker:         three-state feed resilience
  *   - EngineMetrics:          observability (JSON + Prometheus)
  *   - FeedIngester:           FS2 streaming RSS pipeline
  *   - Repository:             Doobie PostgreSQL persistence
  *   - AlertEngine:            configurable alert rules engine
  *   - RateLimiter:            token bucket API rate limiting
  *   - StateSnapshot:          engine state persistence for restart resilience
  */
object Main extends IOApp:

  given Logger[IO] = Slf4jLogger.getLoggerFromName[IO]("pharos-engine")

  override def run(args: List[String]): IO[ExitCode] =
    loadConfig.flatMap { config =>
      resources(config).use { case (httpClient, xa) =>
        for
          _        <- Logger[IO].info("Pharos Engine v0.8.0 starting...")
          shutdown <- Deferred[IO, Unit]  // graceful shutdown signal

          // ── Validate configuration ───────────────────────────
          _        <- IO.delay(EngineConfig.validated(config.engine))
          _        <- Logger[IO].info(
            s"Config: window=${config.engine.correlationWindowMinutes}m " +
            s"threshold=${config.engine.similarityThreshold} " +
            s"poll=${config.engine.feedPollIntervalSeconds}s " +
            s"concurrent=${config.engine.maxConcurrentFeeds} " +
            s"decay=${config.engine.threatDecayHours}h"
          )

          // ── Initialize all components ──────────────────────────
          repo           = Repository.make[IO](xa)
          dbOk          <- repo.checkConnectivity
          _             <- if dbOk then Logger[IO].info("Database connectivity verified")
                           else Logger[IO].error("DATABASE UNREACHABLE — engine will start but persistence disabled")
          _             <- repo.initSchema
          snapshots      = StateSnapshot.make[IO](xa)
          _             <- snapshots.initSchema

          metrics        <- EngineMetrics.make[IO]
          breaker        <- CircuitBreaker.make[IO](maxFailures = 5, cooldownMillis = 60000)
          engine         <- CorrelationEngine.make[IO](config.engine)
          anomaly        <- AnomalyDetector.make[IO](windowSize = 200)
          geo            <- GeoSpatialEngine.make[IO]
          credibility    <- SourceCredibility.make[IO]
          predictor      <- EscalationPredictor.make[IO](maxHistory = 500)
          narrative      <- NarrativeSynthesizer.make[IO]
          contradiction  <- ContradictionDetector.make[IO]
          chainAnalyzer  <- EventChainAnalyzer.make[IO](maxEvents = 1000)
          eventBus       <- EventBus.make[IO](bufferSize = 256)
          alertEngine    <- AlertEngine.make[IO](eventBus, cooldownMinutes = 15)
          temporal       <- TemporalAnalyzer.make[IO](maxEvents = 2000)
          sourceNetwork  <- SourceNetworkAnalyzer.make[IO](maxRecords = 5000)
          threatScorer    = ThreatScorer.make[IO](engine, anomaly, predictor, temporal, sourceNetwork, geo)
          gameModel      <- StrategicGameModel.make[IO](engine, predictor, threatScorer, temporal)

          _              <- Logger[IO].info("All 20 engine components initialized")

          // Track previous threat level and escalation rung for change detection
          prevThreat     <- Ref[IO].of(ThreatLevel.MONITORING)
          prevRung       <- Ref[IO].of(1)

          // Load persisted state
          saved <- repo.loadActiveClusters
          _     <- Logger[IO].info(s"Loaded ${saved.size} persisted clusters")
          _     <- metrics.setGauge("persisted_clusters_loaded", saved.size.toDouble)

          // Create feed ingester
          ingester = FeedIngester.make[IO](httpClient, engine, anomaly, breaker, metrics, config.engine)

          // Build HTTP routes (core + analysis + docs)
          coreRoutes     = Routes.make[IO](engine, ingester, repo, anomaly, breaker, metrics, geo, credibility, predictor)
          analysisRoutes = AnalysisRoutes.make[IO](engine, anomaly, geo, credibility, predictor, narrative, contradiction, chainAnalyzer, eventBus, metrics, alertEngine, temporal, sourceNetwork, threatScorer, gameModel)
          docsRoutes     = ApiDocs.make[IO]
          allRoutes      = coreRoutes <+> analysisRoutes <+> docsRoutes

          corsRoutes = CORS.policy
            .withAllowOriginAll
            .withAllowMethodsAll
            .withAllowHeadersAll
            .apply(allRoutes)

          // Apply rate limiter + production middleware stack
          rateLimitedApp <- RateLimiter[IO](
            RateLimiter.Config(maxTokens = 100, refillPerSec = 20.0, globalMaxRps = 500),
            Middleware[IO](metrics, corsRoutes.orNotFound),
          )
          httpApp = rateLimitedApp

          host <- IO.fromOption(Host.fromString(config.server.host))(
                    new RuntimeException(s"Invalid host: ${config.server.host}"))
          port <- IO.fromOption(Port.fromInt(config.server.port))(
                    new RuntimeException(s"Invalid port: ${config.server.port}"))

          _ <- Logger[IO].info(s"HTTP server on ${config.server.host}:${config.server.port}")

          // ── Run all background tasks concurrently ──────────────
          _ <- (
            // 1. HTTP server with graceful shutdown
            EmberServerBuilder.default[IO]
              .withHost(host)
              .withPort(port)
              .withHttpApp(httpApp)
              .withShutdownTimeout(scala.concurrent.duration.FiniteDuration(10, "seconds"))
              .build
              .use { server =>
                Logger[IO].info(s"Server started on ${server.address}") *>
                shutdown.get // blocks until shutdown signal
              },

            // 2. Feed polling + full analysis pipeline
            Stream
              .eval(repo.loadFeedSources)
              .flatMap { sources =>
                Logger[IO].info(s"Feed polling active for ${sources.size} sources").toStream ++
                ingester.pollStream(sources)
                  .evalTap { result =>
                    engine.activeClusters.flatMap { clusters =>
                      clusters.find(_.id == result.clusterId).traverse_ { cluster =>
                        val now = Instant.now()

                        // Publish SSE event
                        val sseOp = eventBus.publish(
                          EngineEvent.cluster(cluster.id, cluster.canonicalTitle, cluster.severity.toString, result.isNew)
                        )

                        // Geo event
                        val geoOp = cluster.location.traverse_ { loc =>
                          locationToCoords(loc).traverse_ { case (lon, lat) =>
                            geo.recordEvent(GeoEvent(
                              cluster.id, lon, lat, cluster.lastUpdated, cluster.severity,
                              cluster.eventType, cluster.canonicalTitle, cluster.location,
                              cluster.perspectives, Some(cluster.id),
                            ))
                          }
                        }

                        // Credibility
                        val credOp = credibility.recordReport(
                          pharos.credibility.SourceReport(
                            s"${cluster.id}-${now.toEpochMilli}",
                            cluster.feedItemLinks.headOption.getOrElse("unknown"),
                            cluster.id, now,
                          )
                        )

                        // Source network coverage
                        val networkOp = cluster.perspectives.toList.traverse_ { persp =>
                          sourceNetwork.recordCoverage(
                            cluster.feedItemLinks.headOption.getOrElse("unknown"),
                            persp, cluster.id, now,
                          )
                        }

                        // Escalation
                        val escOp = predictor.record(EscalationPoint(
                          now,
                          cluster.threatDelta * 33.3 + cluster.severity.ordinal * 20.0,
                          cluster.eventType, cluster.severity, cluster.location,
                          cluster.perspectives.size, clusters.size,
                        ))

                        // Event chain
                        val chainOp = chainAnalyzer.recordEvent(ChainEvent(
                          cluster.id, cluster.canonicalTitle, cluster.eventType,
                          cluster.severity, cluster.lastUpdated, cluster.location,
                          pharos.correlation.TextSimilarity.extractActors(cluster.canonicalTitle),
                          cluster.summary,
                        ))

                        // Temporal pattern recording
                        val temporalOp = temporal.record(TemporalEvent(
                          cluster.lastUpdated, cluster.eventType.toString,
                          cluster.severity, cluster.location, cluster.id,
                        ))

                        // Threat change detection
                        val threatOp = engine.assessThreat.flatMap { threat =>
                          prevThreat.getAndSet(threat.overallLevel).flatMap { prev =>
                            if prev != threat.overallLevel then
                              eventBus.publish(
                                EngineEvent.threatChange(prev.toString, threat.overallLevel.toString, threat.escalationScore)
                              ) *> Logger[IO].warn(s"THREAT LEVEL CHANGED: $prev → ${threat.overallLevel}")
                            else IO.unit
                          }
                        }

                        sseOp *> geoOp *> credOp *> networkOp *> escOp *> chainOp *> temporalOp *> threatOp
                      }
                    }
                  }
              }
              .compile
              .drain,

            // 3. Periodic batch persistence + threat logging
            Stream
              .awakeEvery[IO](scala.concurrent.duration.FiniteDuration(5, "minutes"))
              .evalMap { _ =>
                for
                  clusters <- engine.activeClusters
                  saved    <- repo.saveClusters(clusters)
                  expired  <- engine.expireStale
                  threat   <- engine.assessThreat
                  _        <- repo.logThreatLevel(
                                threat.overallLevel.toString, threat.escalationScore,
                                threat.activeClusterCount, threat.recommendation,
                              ).handleErrorWith(e =>
                                Logger[IO].warn(s"Threat log write failed: ${e.getMessage}")
                              )
                  _        <- metrics.setGauge("active_clusters", clusters.size.toDouble)
                  _        <- Logger[IO].info(s"Batch persisted $saved clusters, expired $expired stale")
                yield ()
              }
              .compile
              .drain,

            // 4. Periodic chain analysis + contradiction detection
            Stream
              .awakeEvery[IO](scala.concurrent.duration.FiniteDuration(2, "minutes"))
              .evalMap { _ =>
                for
                  // Chain analysis
                  chains <- chainAnalyzer.detectChains
                  _      <- metrics.setGauge("causal_chains", chains.size.toDouble)
                  _ <- chains.filter(_.confidence > 0.7).take(5).traverse_ { chain =>
                    eventBus.publish(
                      EngineEvent.chainLink(chain.causeEvent.title, chain.effectEvent.title, chain.linkType, chain.confidence)
                    )
                  }

                  // Contradiction detection with credibility weighting
                  clusters <- engine.activeClusters
                  credScores <- credibility.allScores
                  credMap = credScores.map(s => s.feedId -> s.overallScore).toMap
                  multiSrc  = clusters.filter(_.perspectives.size >= 2)
                  contras  <- multiSrc.take(20).traverse { cluster =>
                    // Build cluster items from feed links for contradiction analysis
                    val items = cluster.perspectives.toList.zipWithIndex.map { case (persp, i) =>
                      pharos.contradiction.ClusterItem(
                        id          = s"${cluster.id}-$i",
                        feedId      = cluster.feedItemLinks.lift(i).getOrElse("unknown"),
                        perspective = persp.toString,
                        title       = cluster.canonicalTitle,
                        text        = s"${cluster.canonicalTitle} ${cluster.summary.getOrElse("")}",
                        timestamp   = cluster.lastUpdated,
                      )
                    }
                    contradiction.analyzeWeighted(cluster, items, credMap)
                  }
                  contraCount = contras.flatten.size
                  _ <- (contras.flatten.take(3).traverse_ { c =>
                           eventBus.publish(EngineEvent.contradiction(c.description, c.perspectiveA, c.perspectiveB))
                         } *>
                         metrics.setGauge("contradictions_detected", contraCount.toDouble)
                       ).whenA(contraCount > 0)
                  _      <- Logger[IO].debug(s"Analysis: ${chains.size} chains, $contraCount contradictions")
                yield ()
              }
              .compile
              .drain,

            // 5. Periodic status reporting + alert evaluation
            Stream
              .awakeEvery[IO](scala.concurrent.duration.FiniteDuration(1, "minutes"))
              .evalMap { _ =>
                for
                  clusters  <- engine.activeClusters
                  threat    <- engine.assessThreat
                  anomalies <- anomaly.activeAnomalies
                  forecast  <- predictor.forecast
                  theater   <- geo.theaterOverview
                  contras   <- contradiction.activeContradictions
                  circuits  <- breaker.states
                  tempPats  <- temporal.detectPatterns
                  coverage  <- sourceNetwork.coverageAnalysis
                  echoChambers <- sourceNetwork.detectEchoChambers
                  composite  <- threatScorer.compositeThreat
                  openCount  = circuits.count { case (_, s) => s != pharos.feeds.CircuitState.Closed }

                  // Evaluate alert rules with enriched snapshot
                  snapshot = AlertSnapshot(
                    clusters               = clusters,
                    threatLevel            = composite.threatLevel,
                    escalationScore        = composite.compositeScore,
                    escalationRateOfChange = forecast.rateOfChange,
                    activeAnomalies        = anomalies.size,
                    openCircuits           = openCount,
                    totalFeeds             = circuits.size,
                    temporalPatterns       = tempPats.size,
                    echoChambers           = echoChambers.size,
                    independenceScore      = coverage.independenceScore,
                  )
                  alerts <- alertEngine.evaluate(snapshot)

                  // Phase transition detection + persistence
                  ladder     <- gameModel.escalationLadder
                  _          <- prevRung.getAndSet(ladder.currentRung).flatMap { prev =>
                    if prev != ladder.currentRung then
                      val direction = if ladder.currentRung > prev then "ESCALATED" else "DE-ESCALATED"
                      Logger[IO].warn(s"PHASE TRANSITION: Rung $prev → ${ladder.currentRung} ($direction)") *>
                      repo.logPhaseTransition(prev, ladder.currentRung, composite.compositeScore,
                        s"$direction from ${composite.dominantFactor}, trend=${forecast.trend}"
                      ).handleErrorWith(e =>
                        Logger[IO].warn(s"Phase log write failed: ${e.getMessage}")
                      ) *>
                      eventBus.publish(EngineEvent(
                        s"phase-${java.time.Instant.now().toEpochMilli}", java.time.Instant.now(),
                        EngineEventType.Escalation, composite.threatLevel.toString,
                        s"Phase transition: Rung $prev → ${ladder.currentRung}",
                        io.circe.Json.obj(
                          "fromRung" -> prev.asJson,
                          "toRung" -> ladder.currentRung.asJson,
                          "direction" -> direction.asJson,
                        ),
                      ))
                    else IO.unit
                  }

                  _         <- metrics.setGauge("escalation_rung", ladder.currentRung.toDouble)
                  _         <- metrics.setGauge("threat_level_ordinal", composite.threatLevel.ordinal.toDouble)
                  _         <- metrics.setGauge("composite_score", composite.compositeScore)
                  _         <- metrics.setGauge("composite_confidence", composite.confidence)
                  _         <- metrics.setGauge("escalation_score", threat.escalationScore)
                  _         <- metrics.setGauge("active_anomalies", anomalies.size.toDouble)
                  _         <- metrics.setGauge("escalation_current", forecast.currentLevel)
                  _         <- metrics.setGauge("geo_total_events", theater.totalEvents.toDouble)
                  _         <- metrics.setGauge("contradictions", contras.size.toDouble)
                  _         <- metrics.setGauge("alerts_triggered", alerts.size.toDouble)
                  _         <- metrics.setGauge("temporal_patterns", tempPats.size.toDouble)
                  _         <- metrics.setGauge("independence_score", coverage.independenceScore)
                  _         <- metrics.setGauge("echo_chambers", echoChambers.size.toDouble)
                  _         <- metrics.setGauge("single_source_ratio", coverage.singleSourceRatio)
                  _         <- Logger[IO].info(
                    s"Status: composite=${f"${composite.compositeScore}%.2f"} (${composite.threatLevel}) " +
                    s"driver=${composite.dominantFactor} trend=${forecast.trend} " +
                    s"clusters=${threat.activeClusterCount} anomalies=${anomalies.size} " +
                    s"geo=${theater.totalEvents} contradictions=${contras.size} " +
                    s"alerts=${alerts.size} temporal=${tempPats.size} " +
                    s"independence=${f"${coverage.independenceScore}%.2f"} echoChambers=${echoChambers.size}"
                  )
                yield ()
              }
              .compile
              .drain,

            // 6. Periodic state snapshots for restart resilience
            Stream
              .awakeEvery[IO](scala.concurrent.duration.FiniteDuration(10, "minutes"))
              .evalMap { _ =>
                val components: List[(String, IO[io.circe.Json])] = List(
                  "metrics" -> metrics.snapshot.map(s => io.circe.Json.obj(
                    "counters" -> s.counters.size.asJson,
                    "gauges"   -> s.gauges.size.asJson,
                  )),
                  "threat" -> engine.assessThreat.map(t => io.circe.Json.obj(
                    "level"      -> t.overallLevel.toString.asJson,
                    "escalation" -> t.escalationScore.asJson,
                    "clusters"   -> t.activeClusterCount.asJson,
                  )),
                  "escalation" -> predictor.forecast.map(f => io.circe.Json.obj(
                    "level" -> f.currentLevel.asJson,
                    "trend" -> f.trend.toString.asJson,
                    "rate"  -> f.rateOfChange.asJson,
                  )),
                  "temporal" -> temporal.profile.map(p => io.circe.Json.obj(
                    "totalEvents"  -> p.totalEvents.asJson,
                    "eventsPerHour" -> p.eventsPerHour.asJson,
                    "peakHourUtc"  -> p.peakHourUtc.asJson,
                    "maxBurstSize" -> p.maxBurstSize.asJson,
                  )),
                )
                snapshots.saveAll(components).flatMap { saved =>
                  Logger[IO].info(s"State snapshot: $saved components persisted")
                }
              }
              .compile
              .drain,
          ).parTupled.void

        yield ExitCode.Success
      }
    }

  /** Map known location names to approximate coordinates. */
  private def locationToCoords(location: String): Option[(Double, Double)] =
    val loc = location.toLowerCase
    val knownLocations = Map(
      "tehran" -> (51.389, 35.6892), "isfahan" -> (51.6776, 32.6546),
      "natanz" -> (51.7267, 33.5103), "fordow" -> (51.5825, 34.8761),
      "bushehr" -> (50.8886, 28.9684), "parchin" -> (51.7750, 35.5231),
      "tabriz" -> (46.2919, 38.0800), "shiraz" -> (52.5836, 29.5918),
      "mashhad" -> (59.6062, 36.2605), "jerusalem" -> (35.2137, 31.7683),
      "tel aviv" -> (34.7818, 32.0853), "haifa" -> (34.9896, 32.7940),
      "dimona" -> (35.0114, 31.0700), "negev" -> (34.7913, 30.8524),
      "beer sheva" -> (34.7913, 31.2518), "beirut" -> (35.4955, 33.8938),
      "tyre" -> (35.1956, 33.2705), "baalbek" -> (36.2040, 34.0047),
      "damascus" -> (36.2765, 33.5138), "gaza" -> (34.4668, 31.5204),
      "rafah" -> (34.2378, 31.2976), "baghdad" -> (44.3661, 33.3152),
      "erbil" -> (44.0089, 36.1912), "strait of hormuz" -> (56.2667, 26.5667),
      "persian gulf" -> (51.0, 27.0), "red sea" -> (38.0, 20.0),
      "golan heights" -> (35.7500, 33.0000), "west bank" -> (35.2500, 31.9000),
      "suez canal" -> (32.3000, 30.4500),
    )
    knownLocations.find { case (name, _) => loc.contains(name) }.map(_._2)

  private def loadConfig: IO[AppConfig] =
    IO.delay {
      ConfigSource.default.loadOrThrow[AppConfig]
    }.handleErrorWith { _ =>
      IO.pure(AppConfig(
        server = ServerConfig(host = "0.0.0.0", port = 4100),
        db = DbConfig(
          host     = sys.env.getOrElse("PHAROS_DB_HOST", "localhost"),
          port     = sys.env.getOrElse("PHAROS_DB_PORT", "5434").toInt,
          name     = sys.env.getOrElse("PHAROS_DB_NAME", "pharos"),
          user     = sys.env.getOrElse("PHAROS_DB_USER", "pharos"),
          password = sys.env.getOrElse("PHAROS_DB_PASSWORD", "pharos"),
        ),
        engine = EngineConfig(
          correlationWindowMinutes = 120,
          similarityThreshold      = 0.35,
          feedPollIntervalSeconds  = 300,
          maxConcurrentFeeds       = 8,
          threatDecayHours         = 24,
        ),
      ))
    }

  private def resources(config: AppConfig): Resource[IO, (org.http4s.client.Client[IO], Transactor[IO])] =
    for
      httpClient <- EmberClientBuilder.default[IO]
        .withTimeout(scala.concurrent.duration.FiniteDuration(30, "seconds"))
        .build
      xa <- HikariTransactor.newHikariTransactor[IO](
        driverClassName = "org.postgresql.Driver",
        url             = config.db.jdbcUrl,
        user            = config.db.user,
        pass            = config.db.password,
        connectEC       = ExecutionContext.global,
      )
    yield (httpClient, xa)

  extension [A](io: IO[A])
    private def toStream: Stream[IO, A] = Stream.eval(io)

end Main
