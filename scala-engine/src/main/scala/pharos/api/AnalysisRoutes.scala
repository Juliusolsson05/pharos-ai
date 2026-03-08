package pharos.api

import cats.effect.*
import cats.syntax.all.*
import fs2.Stream
import io.circe.syntax.*
import io.circe.generic.semiauto.*
import org.http4s.*
import org.http4s.circe.*
import org.http4s.dsl.Http4sDsl
import pharos.alerting.{Alert, AlertEngine, AlertSeverity}
import pharos.chain.*
import pharos.contradiction.ContradictionDetector
import pharos.correlation.{AnomalyDetector, CorrelationEngine}
import pharos.credibility.SourceCredibility
import pharos.domain.*
import pharos.domain.Codecs.given
import pharos.geo.*
import pharos.metrics.EngineMetrics
import pharos.narrative.*
import pharos.network.*
import pharos.prediction.*
import pharos.scoring.*
import pharos.sse.*
import pharos.strategy.*
import pharos.temporal.*

/** Additional API routes for analysis, narrative synthesis, and SSE streaming.
  *
  * Separated from core Routes to keep file sizes manageable.
  */
object AnalysisRoutes:

  // ── JSON codecs ────────────────────────────────────────────────
  given io.circe.Encoder[SitrepSection]       = deriveEncoder
  given io.circe.Encoder[SitrepEvent]         = deriveEncoder
  given io.circe.Encoder[Sitrep]              = deriveEncoder
  given io.circe.Encoder[SitrepSummary]       = deriveEncoder
  given io.circe.Encoder[FlashReport]         = deriveEncoder
  given io.circe.Encoder[Contradiction]       = deriveEncoder
  given io.circe.Encoder[GraphNode]           = deriveEncoder
  given io.circe.Encoder[GraphEdge]           = deriveEncoder
  given io.circe.Encoder[EventGraph]          = deriveEncoder
  given io.circe.Encoder[EngineEventType]     = io.circe.Encoder.encodeString.contramap(_.toString)
  given io.circe.Encoder[EngineEvent]         = deriveEncoder
  given io.circe.Encoder[AlertSeverity]       = io.circe.Encoder.encodeString.contramap(_.toString)
  given io.circe.Encoder[Alert]               = deriveEncoder
  given io.circe.Encoder[SourceNode]           = io.circe.Encoder.instance { n =>
    io.circe.Json.obj(
      "feedId"          -> n.feedId.asJson,
      "perspectives"    -> n.perspectives.map(_.toString).asJson,
      "totalReports"    -> n.totalReports.asJson,
      "uniqueClusters"  -> n.uniqueClusters.asJson,
      "activeHours"     -> n.activeHours.asJson,
      "avgResponseTime" -> n.avgResponseTime.asJson,
    )
  }
  given io.circe.Encoder[SourceEdge]           = deriveEncoder
  given io.circe.Encoder[SourceNetwork]        = deriveEncoder
  given io.circe.Encoder[EchoChamber] = io.circe.Encoder.instance { e =>
    io.circe.Json.obj(
      "perspective"    -> e.perspective.toString.asJson,
      "feedIds"        -> e.feedIds.asJson,
      "avgSimilarity"  -> e.avgSimilarity.asJson,
      "sharedClusters" -> e.sharedClusters.asJson,
      "totalClusters"  -> e.totalClusters.asJson,
      "riskLevel"      -> e.riskLevel.asJson,
      "description"    -> e.description.asJson,
    )
  }
  given io.circe.Encoder[CoverageGap] = io.circe.Encoder.instance { g =>
    io.circe.Json.obj(
      "perspective"   -> g.perspective.toString.asJson,
      "coverageRatio" -> g.coverageRatio.asJson,
      "description"   -> g.description.asJson,
    )
  }
  given io.circe.Encoder[CoverageReport] = io.circe.Encoder.instance { r =>
    io.circe.Json.obj(
      "totalClusters"             -> r.totalClusters.asJson,
      "singleSourceClusters"      -> r.singleSourceClusters.asJson,
      "singlePerspectiveClusters" -> r.singlePerspectiveClusters.asJson,
      "multiPerspectiveClusters"  -> r.multiPerspectiveClusters.asJson,
      "independenceScore"         -> r.independenceScore.asJson,
      "perspectiveCoverage"       -> r.perspectiveCoverage.map { case (k, v) => k.toString -> v }.asJson,
      "coverageGaps"              -> r.coverageGaps.asJson,
      "singleSourceRatio"         -> r.singleSourceRatio.asJson,
    )
  }
  given io.circe.Encoder[SourcePair]           = deriveEncoder
  given io.circe.Encoder[ThreatFactor]        = deriveEncoder
  given io.circe.Encoder[CompositeThreat] = io.circe.Encoder.instance { ct =>
    io.circe.Json.obj(
      "timestamp"      -> ct.timestamp.toString.asJson,
      "compositeScore" -> ct.compositeScore.asJson,
      "threatLevel"    -> ct.threatLevel.toString.asJson,
      "confidence"     -> ct.confidence.asJson,
      "confidenceLow"  -> ct.confidenceLow.asJson,
      "confidenceHigh" -> ct.confidenceHigh.asJson,
      "factors"        -> ct.factors.asJson,
      "dominantFactor" -> ct.dominantFactor.asJson,
      "clusterCount"   -> ct.clusterCount.asJson,
      "dataPoints"     -> ct.dataPoints.asJson,
      "recommendation" -> ct.recommendation.asJson,
    )
  }
  given io.circe.Encoder[TemporalPattern]     = deriveEncoder
  given io.circe.Encoder[HourlyStats]         = deriveEncoder
  given io.circe.Encoder[TemporalProfile] = io.circe.Encoder.instance { p =>
    io.circe.Json.obj(
      "totalEvents"      -> p.totalEvents.asJson,
      "timeSpanHours"    -> p.timeSpanHours.asJson,
      "eventsPerHour"    -> p.eventsPerHour.asJson,
      "last24hCount"     -> p.last24hCount.asJson,
      "last1hCount"      -> p.last1hCount.asJson,
      "peakHourUtc"      -> p.peakHourUtc.asJson,
      "maxBurstSize"     -> p.maxBurstSize.asJson,
      "avgBurstSize"     -> p.avgBurstSize.asJson,
      "typeDistribution" -> p.typeDistribution.asJson,
      "severityTrend"    -> p.severityTrend.asJson,
    )
  }

  // ── Strategic game model codecs ─────────────────────────────────
  given io.circe.Encoder[Actor]           = io.circe.Encoder.encodeString.contramap(_.toString)
  given io.circe.Encoder[Posture]         = io.circe.Encoder.encodeString.contramap(_.toString)
  given io.circe.Encoder[ActionType]      = io.circe.Encoder.encodeString.contramap(_.toString)
  given io.circe.Encoder[ConsequenceType] = io.circe.Encoder.encodeString.contramap(_.toString)
  given io.circe.Encoder[StrategicAction] = deriveEncoder
  given io.circe.Encoder[Consequence]     = deriveEncoder
  given io.circe.Encoder[ScenarioOutcome] = deriveEncoder
  given io.circe.Encoder[CounterMove]     = deriveEncoder
  given io.circe.Encoder[Scenario]        = deriveEncoder
  given io.circe.Encoder[LadderRung]      = deriveEncoder
  given io.circe.Encoder[AnnotatedRung]   = deriveEncoder
  given io.circe.Encoder[EscalationLadder] = deriveEncoder
  given io.circe.Encoder[KeyIndicator]    = deriveEncoder
  given io.circe.Encoder[StrategicWindow] = deriveEncoder
  given io.circe.Encoder[ActorState]      = deriveEncoder
  given io.circe.Encoder[ConflictState] = io.circe.Encoder.instance { cs =>
    io.circe.Json.obj(
      "timestamp"        -> cs.timestamp.toString.asJson,
      "compositeScore"   -> cs.compositeScore.asJson,
      "threatLevel"      -> cs.threatLevel.toString.asJson,
      "clusterCount"     -> cs.clusterCount.asJson,
      "militaryEvents"   -> cs.militaryEvents.asJson,
      "diplomaticEvents" -> cs.diplomaticEvents.asJson,
      "criticalEvents"   -> cs.criticalEvents.asJson,
      "escalationTrend"  -> cs.escalationTrend.asJson,
      "rateOfChange"     -> cs.rateOfChange.asJson,
      "activePatterns"   -> cs.activePatterns.asJson,
    )
  }
  given io.circe.Encoder[StrategicAssessment] = io.circe.Encoder.instance { sa =>
    io.circe.Json.obj(
      "timestamp"         -> sa.timestamp.toString.asJson,
      "currentRung"       -> sa.currentRung.asJson,
      "rungName"          -> sa.rungName.asJson,
      "compositeScore"    -> sa.compositeScore.asJson,
      "momentum"          -> sa.momentum.asJson,
      "keyIndicators"     -> sa.keyIndicators.asJson,
      "strategicWindows"  -> sa.strategicWindows.asJson,
      "actorStates"       -> sa.actorStates.asJson,
      "topScenarios"      -> sa.topScenarios.asJson,
      "overallAssessment" -> sa.overallAssessment.asJson,
    )
  }

  given io.circe.Encoder[EventChain] = io.circe.Encoder.instance { c =>
    io.circe.Json.obj(
      "id"          -> c.id.asJson,
      "causeId"     -> c.causeEvent.id.asJson,
      "causeTitle"  -> c.causeEvent.title.asJson,
      "causeType"   -> c.causeEvent.eventType.toString.asJson,
      "effectId"    -> c.effectEvent.id.asJson,
      "effectTitle" -> c.effectEvent.title.asJson,
      "effectType"  -> c.effectEvent.eventType.toString.asJson,
      "linkType"    -> c.linkType.asJson,
      "confidence"  -> c.confidence.asJson,
      "temporalGap" -> c.temporalGap.asJson,
      "description" -> c.description.asJson,
    )
  }

  // Re-use codecs from Routes
  import Routes.given

  def make[F[_]: Async](
    engine:        CorrelationEngine[F],
    anomaly:       AnomalyDetector[F],
    geo:           GeoSpatialEngine[F],
    credibility:   SourceCredibility[F],
    predictor:     EscalationPredictor[F],
    narrative:     NarrativeSynthesizer[F],
    contradiction: ContradictionDetector[F],
    chainAnalyzer: EventChainAnalyzer[F],
    eventBus:      EventBus[F],
    metrics:       EngineMetrics[F],
    alertEngine:   AlertEngine[F],
    temporal:      TemporalAnalyzer[F],
    sourceNetwork: SourceNetworkAnalyzer[F],
    threatScorer:  ThreatScorer[F],
    gameModel:     StrategicGameModel[F],
  ): HttpRoutes[F] =
    val dsl = Http4sDsl[F]
    import dsl.*

    HttpRoutes.of[F] {

      // ── SITREP generation ──────────────────────────────────────
      case POST -> Root / "api" / "v1" / "engine" / "sitrep" / "generate" =>
        for
          clusters      <- engine.activeClusters
          threat        <- engine.assessThreat
          anomalies     <- anomaly.activeAnomalies
          hotspots      <- geo.detectHotspots(3, 50.0)
          corridors     <- geo.analyzeCorridors(48)
          theater       <- geo.theaterOverview
          forecast      <- predictor.forecast
          credScores    <- credibility.allScores
          contradictions <- contradiction.activeContradictions
          tempPatterns   <- temporal.detectPatterns
          tempProfile    <- temporal.profile
          echoChambers   <- sourceNetwork.detectEchoChambers
          coverageRpt    <- sourceNetwork.coverageAnalysis
          compThreat     <- threatScorer.compositeThreat
          stratAssess    <- gameModel.strategicAssessment
          ladder         <- gameModel.escalationLadder
          scenarios      <- gameModel.scenarios(depth = 2, breadth = 5)
          input = SitrepInput(
            clusters, threat, anomalies, hotspots, corridors,
            theater, forecast, credScores, contradictions,
            temporalPatterns     = tempPatterns,
            temporalProfile      = Some(tempProfile),
            echoChambers         = echoChambers,
            coverageReport       = Some(coverageRpt),
            compositeThreat      = Some(compThreat),
            strategicAssessment  = Some(stratAssess),
            escalationLadder     = Some(ladder),
            topScenarios         = scenarios,
          )
          sitrep <- narrative.generateSitrep(input)
          _      <- metrics.incCounter("sitreps_generated")
          resp   <- Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> sitrep.asJson))
        yield resp

      // ── SITREP history ─────────────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "sitrep" / "history" =>
        narrative.history.flatMap { h =>
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj("reports" -> h.asJson, "count" -> h.size.asJson),
          ))
        }

      // ── Flash report for critical cluster ──────────────────────
      case POST -> Root / "api" / "v1" / "engine" / "flash" / clusterId =>
        for
          clusters <- engine.activeClusters
          threat   <- engine.assessThreat
          forecast <- predictor.forecast
          result <- clusters.find(_.id == clusterId) match
            case Some(cluster) =>
              val ctx = FlashContext(threat.overallLevel, forecast.trend, clusters.size - 1)
              narrative.generateFlash(cluster, ctx).flatMap { flash =>
                eventBus.publish(EngineEvent(
                  s"flash-${cluster.id}", java.time.Instant.now(),
                  EngineEventType.Flash, cluster.severity.toString,
                  flash.headline, io.circe.Json.obj("clusterId" -> clusterId.asJson),
                )) *>
                Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> flash.asJson))
              }
            case None =>
              NotFound(io.circe.Json.obj(
                "ok" -> false.asJson,
                "error" -> io.circe.Json.obj("code" -> "NOT_FOUND".asJson, "message" -> s"Cluster $clusterId not found".asJson),
              ))
        yield result

      // ── Contradictions (paginated) ─────────────────────────────
      case req @ GET -> Root / "api" / "v1" / "engine" / "contradictions" =>
        contradiction.activeContradictions.flatMap { cs =>
          val page = Pagination.fromRequest(req)
          val items = page(cs)
          Ok(page.envelope("contradictions", items, cs.size))
        }

      // ── Event chains (paginated) ───────────────────────────────
      case req @ GET -> Root / "api" / "v1" / "engine" / "chains" =>
        chainAnalyzer.detectChains.flatMap { chains =>
          val page = Pagination.fromRequest(req)
          val items = page(chains)
          Ok(page.envelope("chains", items, chains.size))
        }

      // ── Event graph (nodes + edges for visualization) ──────────
      case GET -> Root / "api" / "v1" / "engine" / "chains" / "graph" =>
        chainAnalyzer.eventGraph.flatMap(graph =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> graph.asJson))
        )

      // ── Chains for a specific event ────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "chains" / "event" / eventId =>
        chainAnalyzer.chainsFor(eventId).flatMap { chains =>
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj("chains" -> chains.asJson, "count" -> chains.size.asJson),
          ))
        }

      // ── Alerts: active ────────────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "alerts" =>
        alertEngine.activeAlerts.flatMap { alerts =>
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj("alerts" -> alerts.asJson, "count" -> alerts.size.asJson),
          ))
        }

      // ── Alerts: history ──────────────────────────────────────
      case req @ GET -> Root / "api" / "v1" / "engine" / "alerts" / "history" =>
        alertEngine.alertHistory.flatMap { alerts =>
          val page = Pagination.fromRequest(req)
          val items = page(alerts)
          Ok(page.envelope("alerts", items, alerts.size))
        }

      // ── Alerts: acknowledge ──────────────────────────────────
      case POST -> Root / "api" / "v1" / "engine" / "alerts" / alertId / "ack" =>
        alertEngine.acknowledge(alertId).flatMap {
          case true  => Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> io.circe.Json.obj("acknowledged" -> alertId.asJson)))
          case false => NotFound(io.circe.Json.obj(
            "ok" -> false.asJson,
            "error" -> io.circe.Json.obj("code" -> "NOT_FOUND".asJson, "message" -> s"Alert $alertId not found".asJson),
          ))
        }

      // ── SSE event stream ───────────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "stream" =>
        val sseStream: Stream[F, String] =
          // Send keepalive comment every 30s to prevent connection timeout
          val keepalive = Stream
            .awakeEvery[F](scala.concurrent.duration.FiniteDuration(30, "seconds"))
            .map(_ => ": keepalive\n\n")

          val events = eventBus.subscribe.map(_.toSSE)

          events.mergeHaltBoth(keepalive)

        Ok(sseStream).map(_.withContentType(
          org.http4s.headers.`Content-Type`(
            MediaType("text", "event-stream"),
            org.http4s.Charset.`UTF-8`,
          )
        ).withHeaders(
          Header.Raw(org.typelevel.ci.CIString("Cache-Control"), "no-cache"),
          Header.Raw(org.typelevel.ci.CIString("Connection"), "keep-alive"),
        ))

      // ── Recent SSE events (for catch-up) ───────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "stream" / "recent" =>
        eventBus.recent(50).flatMap { events =>
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj("events" -> events.asJson, "count" -> events.size.asJson),
          ))
        }

      // ── Temporal: profile ────────────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "temporal" / "profile" =>
        temporal.profile.flatMap { p =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> p.asJson))
        }

      // ── Temporal: detected patterns ──────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "temporal" / "patterns" =>
        temporal.detectPatterns.flatMap { patterns =>
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj("patterns" -> patterns.asJson, "count" -> patterns.size.asJson),
          ))
        }

      // ── Temporal: hourly activity distribution ────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "temporal" / "hourly" =>
        temporal.hourlyDistribution.flatMap { dist =>
          val hours = dist.toList.sortBy(_._1).map { case (hour, stats) =>
            io.circe.Json.obj(
              "hour"        -> hour.asJson,
              "count"       -> stats.count.asJson,
              "avgSeverity" -> stats.avgSeverity.asJson,
              "topType"     -> stats.topType.asJson,
            )
          }
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj("hours" -> hours.asJson),
          ))
        }

      // ── Composite threat scoring ──────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "threat" / "composite" =>
        threatScorer.compositeThreat.flatMap { ct =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> ct.asJson))
        }

      // ── Source network: full graph ─────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "network" / "graph" =>
        sourceNetwork.networkGraph.flatMap { graph =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> graph.asJson))
        }

      // ── Source network: echo chambers ──────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "network" / "echo-chambers" =>
        sourceNetwork.detectEchoChambers.flatMap { chambers =>
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj("echoChambers" -> chambers.asJson, "count" -> chambers.size.asJson),
          ))
        }

      // ── Source network: coverage analysis ─────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "network" / "coverage" =>
        sourceNetwork.coverageAnalysis.flatMap { report =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> report.asJson))
        }

      // ── Source network: co-reporting pairs ────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "network" / "pairs" =>
        sourceNetwork.coReportingPairs.flatMap { pairs =>
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj("pairs" -> pairs.asJson, "count" -> pairs.size.asJson),
          ))
        }

      // ── Strategic: conflict state ───────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "strategy" / "state" =>
        gameModel.conflictState.flatMap { cs =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> cs.asJson))
        }

      // ── Strategic: scenarios ────────────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "strategy" / "scenarios" =>
        gameModel.scenarios(depth = 3, breadth = 5).flatMap { scns =>
          Ok(io.circe.Json.obj(
            "ok"   -> true.asJson,
            "data" -> io.circe.Json.obj("scenarios" -> scns.asJson, "count" -> scns.size.asJson),
          ))
        }

      // ── Strategic: escalation ladder ────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "strategy" / "ladder" =>
        gameModel.escalationLadder.flatMap { ladder =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> ladder.asJson))
        }

      // ── Strategic: full assessment ──────────────────────────────────
      case GET -> Root / "api" / "v1" / "engine" / "strategy" / "assessment" =>
        gameModel.strategicAssessment.flatMap { assessment =>
          Ok(io.circe.Json.obj("ok" -> true.asJson, "data" -> assessment.asJson))
        }
    }

end AnalysisRoutes
