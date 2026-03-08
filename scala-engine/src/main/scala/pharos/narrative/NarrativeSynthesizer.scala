package pharos.narrative

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import pharos.domain.*
import pharos.correlation.{AnomalyResult, BaselineStats}
import pharos.credibility.CredibilityScore
import pharos.network.{CoverageReport, EchoChamber}
import pharos.prediction.{EscalationForecast, EscalationPattern, EscalationTrend}
import pharos.scoring.CompositeThreat
import pharos.geo.{Hotspot, Corridor, TheaterOverview}
import pharos.strategy.{StrategicAssessment, EscalationLadder, Scenario}
import pharos.temporal.{TemporalPattern, TemporalProfile}
import java.time.{Duration, Instant, ZoneOffset}
import java.time.format.DateTimeFormatter

/** Automated narrative intelligence synthesizer.
  *
  * Generates structured situation reports (SITREPs) by combining signals
  * from all engine subsystems:
  *   - Correlation engine: active event clusters
  *   - Anomaly detector: deviations from baseline
  *   - Geo engine: hotspots and corridors
  *   - Escalation predictor: trend and forecast
  *   - Source credibility: reliability weighting
  *
  * Output follows military SITREP format adapted for OSINT:
  *   1. SITUATION — current threat level and overview
  *   2. KEY EVENTS — top clusters by severity/recency
  *   3. GEOGRAPHIC PICTURE — hotspots and corridors
  *   4. ESCALATION ASSESSMENT — trend, forecast, patterns
  *   5. SOURCE ANALYSIS — credibility, bias, contradictions
  *   6. OUTLOOK — 1h/6h/24h projections
  *   7. RECOMMENDATIONS — actionable intelligence
  */
trait NarrativeSynthesizer[F[_]]:
  /** Generate a full SITREP from current engine state. */
  def generateSitrep(input: SitrepInput): F[Sitrep]

  /** Generate a concise flash report for a single critical event. */
  def generateFlash(cluster: EventCluster, context: FlashContext): F[FlashReport]

  /** Get history of generated SITREPs. */
  def history: F[List[SitrepSummary]]

object NarrativeSynthesizer:

  private val TimeFmt = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm'Z'").withZone(ZoneOffset.UTC)

  def make[F[_]: Async]: F[NarrativeSynthesizer[F]] =
    AtomicCell[F].of(Vector.empty[SitrepSummary]).map(new NarrativeSynthesizerImpl[F](_))

  private class NarrativeSynthesizerImpl[F[_]: Async](
    historyCell: AtomicCell[F, Vector[SitrepSummary]],
  ) extends NarrativeSynthesizer[F]:

    override def generateSitrep(input: SitrepInput): F[Sitrep] =
      Sync[F].delay {
        val now = Instant.now()
        val sitrep = buildSitrep(input, now)
        sitrep
      }.flatTap { sitrep =>
        historyCell.update { h =>
          val summary = SitrepSummary(
            id           = sitrep.id,
            generatedAt  = sitrep.generatedAt,
            threatLevel  = sitrep.threatLevel,
            clusterCount = sitrep.keyEvents.size,
            headline     = sitrep.headline,
          )
          (h :+ summary).takeRight(100) // keep last 100
        }
      }

    override def generateFlash(cluster: EventCluster, context: FlashContext): F[FlashReport] =
      Sync[F].delay {
        val now = Instant.now()
        FlashReport(
          id          = s"flash-${now.toEpochMilli}",
          generatedAt = now,
          severity    = cluster.severity,
          headline    = s"FLASH: ${cluster.canonicalTitle}",
          body        = buildFlashBody(cluster, context),
          clusterId   = cluster.id,
          perspectives = cluster.perspectives.toList.map(_.toString),
          sourceCount = cluster.sourceCount,
          confidence  = cluster.confidenceScore,
        )
      }

    override def history: F[List[SitrepSummary]] =
      historyCell.get.map(_.toList.reverse)

    // ── SITREP builder ─────────────────────────────────────────

    private def buildSitrep(input: SitrepInput, now: Instant): Sitrep =
      val id       = s"sitrep-${now.toEpochMilli}"
      val headline = buildHeadline(input)

      Sitrep(
        id          = id,
        generatedAt = now,
        threatLevel = input.threat.overallLevel,
        headline    = headline,
        situation   = buildSituation(input, now),
        keyEvents   = buildKeyEvents(input),
        geoPicture  = buildGeoPicture(input),
        escalation  = buildEscalation(input),
        sourceAnalysis = buildSourceAnalysis(input),
        outlook     = buildOutlook(input),
        recommendations = buildRecommendations(input),
        rawMetrics  = buildRawMetrics(input),
      )

    private def buildHeadline(input: SitrepInput): String =
      val level = input.threat.overallLevel
      val trend = input.forecast.trend match
        case EscalationTrend.Accelerating  => "RAPIDLY ESCALATING"
        case EscalationTrend.Escalating    => "ESCALATING"
        case EscalationTrend.Stable        => "STABLE"
        case EscalationTrend.Cooling       => "COOLING"
        case EscalationTrend.DeEscalating  => "DE-ESCALATING"

      val topEvent = input.clusters.headOption.map(_.canonicalTitle).getOrElse("No active events")
      s"Threat $level — $trend — $topEvent"

    private def buildSituation(input: SitrepInput, now: Instant): SitrepSection =
      val lines = List.newBuilder[String]
      lines += s"As of ${TimeFmt.format(now)}, the theater threat level is ${input.threat.overallLevel}."
      lines += s"${input.clusters.size} active event clusters are being tracked across ${input.theater.activePerspectives.size} intelligence perspectives."

      // Composite threat scoring context
      input.compositeThreat.foreach { ct =>
        lines += s"Composite threat score: ${f"${ct.compositeScore * 100}%.0f"}%% (${f"${ct.confidence * 100}%.0f"}%% confidence, range ${f"${ct.confidenceLow * 100}%.0f"}%%–${f"${ct.confidenceHigh * 100}%.0f"}%%). Primary driver: ${ct.dominantFactor}."
      }

      if input.anomalies.nonEmpty then
        lines += s"ALERT: ${input.anomalies.size} anomal${if input.anomalies.size == 1 then "y" else "ies"} detected — ${input.anomalies.map(_.anomalyType.toString).distinct.mkString(", ")}."

      lines += s"Escalation score: ${f"${input.threat.escalationScore}%.3f"} (${input.forecast.trend})."

      // Temporal context
      input.temporalProfile.foreach { tp =>
        lines += s"Event velocity: ${f"${tp.eventsPerHour}%.1f"} events/hour (${tp.last1hCount} in last 1h, ${tp.last24hCount} in last 24h). Peak activity at ${tp.peakHourUtc}:00 UTC."
        if tp.severityTrend > 0.3 then
          lines += s"WARNING: Severity trend rising (+${f"${tp.severityTrend}%.2f"}) — recent events are higher severity than baseline."
      }

      if input.temporalPatterns.nonEmpty then
        lines += s"${input.temporalPatterns.size} temporal pattern${if input.temporalPatterns.size > 1 then "s" else ""} active: ${input.temporalPatterns.map(_.name).mkString(", ")}."

      // Strategic escalation ladder context
      input.escalationLadder.foreach { ladder =>
        val rungInfo = ladder.rungs.find(_.isCurrent).map(_.rung)
        rungInfo.foreach { rung =>
          lines += s"Escalation ladder position: Rung ${rung.level}/7 — ${rung.name}. Momentum: ${ladder.momentum}."
          lines += s"  ${rung.description}"
        }
        ladder.nextThreshold.foreach { next =>
          val gap = next - ladder.currentScore
          if gap < 0.1 then
            lines += s"⚠ PROXIMITY WARNING: Only ${f"${gap * 100}%.0f"}%% from next escalation rung."
        }
      }

      // Actor postures from strategic assessment
      input.strategicAssessment.foreach { sa =>
        val actorSummary = sa.actorStates.map(a => s"${a.actor}=${a.posture}").mkString(", ")
        lines += s"Actor postures: $actorSummary."
      }

      val biasSummary = input.threat.perspectiveBias.toList.sortBy(-_._2).take(3)
        .map { case (p, w) => s"$p (${f"${w * 100}%.0f"}%%)" }.mkString(", ")
      if biasSummary.nonEmpty then
        lines += s"Source weighting: $biasSummary."

      SitrepSection("SITUATION", lines.result())

    private def buildKeyEvents(input: SitrepInput): List[SitrepEvent] =
      input.clusters
        .sortBy(c => (-c.severity.ordinal, -c.lastUpdated.toEpochMilli))
        .take(10)
        .map { c =>
          SitrepEvent(
            clusterId    = c.id,
            severity     = c.severity,
            eventType    = c.eventType,
            title        = c.canonicalTitle,
            location     = c.location,
            firstSeen    = TimeFmt.format(c.firstSeen),
            sourceCount  = c.sourceCount,
            perspectives = c.perspectives.toList.map(_.toString),
            confidence   = c.confidenceScore,
            summary      = c.summary,
          )
        }

    private def buildGeoPicture(input: SitrepInput): SitrepSection =
      val lines = List.newBuilder[String]

      if input.theater.totalEvents > 0 then
        lines += s"Theater encompasses ${input.theater.totalEvents} geo-located events (${input.theater.last24Hours} in last 24h)."

      if input.hotspots.nonEmpty then
        lines += s"${input.hotspots.size} geographic hotspot${if input.hotspots.size > 1 then "s" else ""} identified:"
        input.hotspots.take(5).foreach { h =>
          lines += s"  • [${f"${h.centroidLat}%.2f"}, ${f"${h.centroidLon}%.2f"}] — ${h.eventCount} events, intensity ${f"${h.intensity}%.1f"}, avg severity ${f"${h.avgSeverity}%.1f"}"
          if h.topEventTitles.nonEmpty then
            lines += s"    Top: ${h.topEventTitles.head}"
        }

      if input.corridors.nonEmpty then
        lines += s"${input.corridors.size} active corridor${if input.corridors.size > 1 then "s" else ""}:"
        input.corridors.take(3).foreach { c =>
          lines += s"  • ${c.locationA} ↔ ${c.locationB} (${f"${c.distance}%.0f"}km, ${c.eventPairs} correlated event pairs, avg gap ${f"${c.avgGapHours}%.1f"}h)"
        }

      if lines.result().isEmpty then
        lines += "Insufficient geo-located data for geographic analysis."

      SitrepSection("GEOGRAPHIC PICTURE", lines.result())

    private def buildEscalation(input: SitrepInput): SitrepSection =
      val f = input.forecast
      val lines = List.newBuilder[String]

      lines += s"Current intensity: ${f"${f.currentLevel}%.1f"}/100 — Trend: ${f.trend} — Confidence: ${f"${f.confidence * 100}%.0f"}%%"
      lines += s"Rate of change: ${f"${f.rateOfChange}%.3f"}/unit — Acceleration: ${f"${f.acceleration}%.3f"} — Volatility: ${f"${f.volatility}%.2f"}"
      lines += ""
      lines += "FORECAST:"
      lines += s"  1h:  ${f"${f.forecast1h.projected}%.1f"} [${f"${f.forecast1h.low}%.1f"} – ${f"${f.forecast1h.high}%.1f"}]"
      lines += s"  6h:  ${f"${f.forecast6h.projected}%.1f"} [${f"${f.forecast6h.low}%.1f"} – ${f"${f.forecast6h.high}%.1f"}]"
      lines += s"  24h: ${f"${f.forecast24h.projected}%.1f"} [${f"${f.forecast24h.low}%.1f"} – ${f"${f.forecast24h.high}%.1f"}]"

      if f.activePatterns.nonEmpty then
        lines += ""
        lines += "ESCALATION PATTERNS:"
        f.activePatterns.foreach { p =>
          lines += s"  ⚠ ${p.name} (confidence: ${f"${p.confidence * 100}%.0f"}%%, bias: +${f"${p.escalationBias}%.1f"})"
          lines += s"    ${p.description}"
        }

      if input.temporalPatterns.nonEmpty then
        lines += ""
        lines += "TEMPORAL PATTERNS:"
        input.temporalPatterns.foreach { p =>
          lines += s"  ⚠ ${p.name} [${p.severity}] (confidence: ${f"${p.confidence * 100}%.0f"}%%)"
          lines += s"    ${p.description}"
        }

      // Strategic scenario projections
      if input.topScenarios.nonEmpty then
        lines += ""
        lines += "SCENARIO PROJECTIONS:"
        input.topScenarios.take(3).foreach { s =>
          val prob = f"${s.outcome.probability * 100}%.0f"
          val delta = if s.netEscalation > 0 then f"+${s.netEscalation}%.2f" else f"${s.netEscalation}%.2f"
          lines += s"  ⚑ ${s.initiator} → ${s.action.name} (${prob}%% probability, ${s.action.actionType}, net ${delta})"
          lines += s"    Impact: ${s.outcome.strategicImpact}"
          s.counterMoves.headOption.foreach { cm =>
            lines += s"    Expected response: ${cm.actor} → ${cm.action.name}"
          }
          s.historicalNote.foreach(note => lines += s"    Historical: $note")
        }

      // Strategic windows
      input.strategicAssessment.foreach { sa =>
        if sa.strategicWindows.nonEmpty then
          lines += ""
          lines += "STRATEGIC WINDOWS:"
          sa.strategicWindows.foreach { w =>
            lines += s"  ◇ ${w.name} [${w.urgency}] — ${w.timeframe}"
            lines += s"    Action: ${w.action}"
            lines += s"    Expires if: ${w.expiresIf}"
          }
      }

      SitrepSection("ESCALATION ASSESSMENT", lines.result())

    private def buildSourceAnalysis(input: SitrepInput): SitrepSection =
      val lines = List.newBuilder[String]

      // Source independence & coverage
      input.coverageReport.foreach { cov =>
        lines += s"Source independence score: ${f"${cov.independenceScore * 100}%.0f"}%% — ${cov.multiPerspectiveClusters}/${cov.totalClusters} clusters have multi-perspective confirmation."
        if cov.singleSourceRatio > 0.5 then
          lines += s"⚠ WARNING: ${f"${cov.singleSourceRatio * 100}%.0f"}%% of clusters rely on a single source — high risk of unverified reporting."
        if cov.coverageGaps.nonEmpty then
          lines += "COVERAGE GAPS:"
          cov.coverageGaps.foreach { g =>
            lines += s"  • ${g.description}"
          }
      }

      // Echo chambers
      if input.echoChambers.nonEmpty then
        lines += ""
        lines += s"⚠ ${input.echoChambers.size} ECHO CHAMBER${if input.echoChambers.size > 1 then "S" else ""} DETECTED:"
        input.echoChambers.foreach { ec =>
          lines += s"  • ${ec.description}"
        }

      if input.credibilityScores.nonEmpty then
        lines += ""
        val top = input.credibilityScores.take(5)
        lines += s"${input.credibilityScores.size} sources scored. Top sources:"
        top.foreach { s =>
          val funded = if s.stateFunded then " [STATE-FUNDED]" else ""
          lines += s"  • ${s.feedId}: ${f"${s.overallScore * 100}%.0f"}%% (tier ${s.tier}, ${s.confirmedReports}/${s.totalReports} confirmed)$funded"
        }

      if input.contradictions.nonEmpty then
        lines += ""
        lines += s"⚠ ${input.contradictions.size} source contradiction${if input.contradictions.size > 1 then "s" else ""} detected:"
        input.contradictions.take(3).foreach { c =>
          lines += s"  • ${c.description}"
        }

      if lines.result().isEmpty then
        lines += "Insufficient source data for credibility analysis."

      SitrepSection("SOURCE ANALYSIS", lines.result())

    private def buildOutlook(input: SitrepInput): SitrepSection =
      val f = input.forecast
      val lines = List.newBuilder[String]

      val outlook = f.trend match
        case EscalationTrend.Accelerating =>
          "CRITICAL OUTLOOK: Escalation is accelerating. Multiple indicators suggest imminent significant activity. " +
          "Recommend maximum alert posture and continuous monitoring."
        case EscalationTrend.Escalating =>
          "ELEVATED OUTLOOK: Escalation trend continues. Monitor for trigger events that could accelerate the situation. " +
          "Prepare contingency briefs for key decision points."
        case EscalationTrend.Stable =>
          "STABLE OUTLOOK: No significant trend detected. Maintain standard monitoring cadence. " +
          "Watch for pattern changes that could indicate emerging dynamics."
        case EscalationTrend.Cooling =>
          "POSITIVE OUTLOOK: Indicators suggest cooling. Potential for diplomatic window. " +
          "Monitor for spoiler events that could reverse the trend."
        case EscalationTrend.DeEscalating =>
          "FAVORABLE OUTLOOK: Active de-escalation detected across multiple indicators. " +
          "Continue monitoring but consider reducing alert posture."

      lines += outlook

      if f.activePatterns.exists(_.name == "Diplomatic Breakdown") then
        lines += "WARNING: Diplomatic breakdown pattern detected — historically precedes escalation within 6–12 hours."
      if f.activePatterns.exists(_.name == "Multi-Front Activation") then
        lines += "WARNING: Multi-front activation may indicate coordinated operations across theaters."

      // Strategic assessment overall
      input.strategicAssessment.foreach { sa =>
        lines += ""
        lines += sa.overallAssessment
        // Key indicators
        val criticalIndicators = sa.keyIndicators.filter(_.trend == "CRITICAL")
        val warningIndicators = sa.keyIndicators.filter(_.trend == "WARNING")
        if criticalIndicators.nonEmpty then
          lines += s"CRITICAL INDICATORS: ${criticalIndicators.map(i => s"${i.name}=${i.value}").mkString(", ")}"
        if warningIndicators.nonEmpty then
          lines += s"WARNING INDICATORS: ${warningIndicators.map(i => s"${i.name}=${i.value}").mkString(", ")}"
      }

      SitrepSection("OUTLOOK", lines.result())

    private def buildRecommendations(input: SitrepInput): List[String] =
      val recs = List.newBuilder[String]

      input.threat.overallLevel match
        case ThreatLevel.CRITICAL =>
          recs += "IMMEDIATE: Activate all monitoring channels and prepare flash alerts for key stakeholders."
          recs += "Verify critical reports through at least 3 independent sources before dissemination."
        case ThreatLevel.HIGH =>
          recs += "Increase monitoring cadence to 15-minute intervals for top-tier sources."
          recs += "Cross-reference emerging reports with existing cluster data before creating new events."
        case ThreatLevel.ELEVATED =>
          recs += "Maintain enhanced monitoring. Focus on source diversity for key clusters."
        case ThreatLevel.MONITORING =>
          recs += "Standard monitoring posture. Review source credibility scores weekly."

      if input.anomalies.exists(_.anomalyType.toString == "PerspectiveConvergence") then
        recs += "Multi-perspective convergence detected — prioritize cross-source verification."

      if input.credibilityScores.exists(s => s.stateFunded && s.overallScore > 0.5) then
        recs += "State-funded sources showing elevated activity — apply additional verification scrutiny."

      if input.hotspots.size >= 3 then
        recs += "Multiple geographic hotspots active — consider geographic segmentation of monitoring resources."

      // Temporal-driven recommendations
      if input.temporalPatterns.exists(_.name == "Night Operations") then
        recs += "Night operations pattern detected — ensure off-hours monitoring coverage."
      if input.temporalPatterns.exists(_.name == "Rapid Response Chain") then
        recs += "Rapid response chain active — events following within minutes. Consider real-time alert escalation."
      if input.temporalPatterns.exists(_.name == "Activity Surge") then
        recs += "Activity surge in progress — increase monitoring cadence and prepare flash reports."

      // Source network recommendations
      if input.echoChambers.nonEmpty then
        recs += s"${input.echoChambers.size} echo chamber(s) detected — discount correlated sources when assessing confirmation. Cross-verify with independent sources."
      input.coverageReport.foreach { cov =>
        if cov.independenceScore < 0.3 then
          recs += "CRITICAL: Low source independence — most clusters lack multi-perspective confirmation. Treat all reporting with heightened scrutiny."
        if cov.coverageGaps.nonEmpty then
          recs += s"Coverage blind spots in ${cov.coverageGaps.map(_.perspective.toString).mkString(", ")} perspective(s) — seek additional sources for these viewpoints."
      }

      // Strategic window recommendations
      input.strategicAssessment.foreach { sa =>
        sa.strategicWindows.filter(_.urgency == "CRITICAL").foreach { w =>
          recs += s"STRATEGIC WINDOW: ${w.name} — ${w.action} (${w.timeframe}). Window closes if ${w.expiresIf}."
        }
        // Escalation ladder proximity
        input.escalationLadder.foreach { ladder =>
          ladder.nextThreshold.foreach { next =>
            if (next - ladder.currentScore) < 0.1 then
              recs += s"ESCALATION WARNING: Current score (${f"${ladder.currentScore * 100}%.0f"}%%) is within 10%% of next rung threshold. Monitor closely for trigger events."
          }
        }
      }

      recs.result()

    private def buildRawMetrics(input: SitrepInput): Map[String, Double] =
      val base = Map(
        "clusters"            -> input.clusters.size.toDouble,
        "anomalies"           -> input.anomalies.size.toDouble,
        "hotspots"            -> input.hotspots.size.toDouble,
        "corridors"           -> input.corridors.size.toDouble,
        "escalation_current"  -> input.forecast.currentLevel,
        "escalation_1h"       -> input.forecast.forecast1h.projected,
        "escalation_6h"       -> input.forecast.forecast6h.projected,
        "escalation_24h"      -> input.forecast.forecast24h.projected,
        "confidence"          -> input.forecast.confidence,
        "volatility"          -> input.forecast.volatility,
        "sources_tracked"     -> input.credibilityScores.size.toDouble,
        "geo_events_total"    -> input.theater.totalEvents.toDouble,
        "geo_events_24h"      -> input.theater.last24Hours.toDouble,
        "temporal_patterns"   -> input.temporalPatterns.size.toDouble,
        "echo_chambers"       -> input.echoChambers.size.toDouble,
        "contradictions"      -> input.contradictions.size.toDouble,
      )
      val temporal = input.temporalProfile.fold(Map.empty[String, Double]) { tp =>
        Map(
          "events_per_hour" -> tp.eventsPerHour,
          "severity_trend"  -> tp.severityTrend,
          "max_burst_size"  -> tp.maxBurstSize.toDouble,
        )
      }
      val coverage = input.coverageReport.fold(Map.empty[String, Double]) { cov =>
        Map(
          "independence_score"   -> cov.independenceScore,
          "single_source_ratio"  -> cov.singleSourceRatio,
        )
      }
      val composite = input.compositeThreat.fold(Map.empty[String, Double]) { ct =>
        Map(
          "composite_score"      -> ct.compositeScore,
          "composite_confidence" -> ct.confidence,
        )
      }
      val strategic = input.strategicAssessment.fold(Map.empty[String, Double]) { sa =>
        Map(
          "escalation_rung"    -> sa.currentRung.toDouble,
          "scenario_count"     -> sa.topScenarios.size.toDouble,
          "strategic_windows"  -> sa.strategicWindows.size.toDouble,
          "critical_indicators" -> sa.keyIndicators.count(_.trend == "CRITICAL").toDouble,
        )
      }
      base ++ temporal ++ coverage ++ composite ++ strategic

    // ── Flash report builder ───────────────────────────────────

    private def buildFlashBody(cluster: EventCluster, ctx: FlashContext): String =
      val sb = new StringBuilder
      sb.append(s"SEVERITY: ${cluster.severity}\n")
      sb.append(s"TYPE: ${cluster.eventType}\n")
      cluster.location.foreach(l => sb.append(s"LOCATION: $l\n"))
      sb.append(s"FIRST SEEN: ${TimeFmt.format(cluster.firstSeen)}\n")
      sb.append(s"SOURCES: ${cluster.sourceCount} (${cluster.perspectives.mkString(", ")})\n")
      sb.append(s"CONFIDENCE: ${f"${cluster.confidenceScore * 100}%.0f"}%%\n")
      sb.append("\n")
      cluster.summary.foreach(s => sb.append(s"SUMMARY: $s\n\n"))
      sb.append(s"THREAT CONTEXT: Current level ${ctx.threatLevel}, escalation trend ${ctx.trend}\n")
      if ctx.relatedClusters > 0 then
        sb.append(s"RELATED: ${ctx.relatedClusters} other active clusters in proximity\n")
      sb.toString

  end NarrativeSynthesizerImpl

end NarrativeSynthesizer

// ── Domain types ─────────────────────────────────────────────────

final case class SitrepInput(
  clusters:          List[EventCluster],
  threat:            ThreatAssessment,
  anomalies:         List[AnomalyResult],
  hotspots:          List[Hotspot],
  corridors:         List[Corridor],
  theater:           TheaterOverview,
  forecast:          EscalationForecast,
  credibilityScores: List[CredibilityScore],
  contradictions:    List[Contradiction],
  // New enrichments (optional for backward compat)
  temporalPatterns:  List[TemporalPattern]   = List.empty,
  temporalProfile:   Option[TemporalProfile] = None,
  echoChambers:      List[EchoChamber]        = List.empty,
  coverageReport:       Option[CoverageReport]      = None,
  compositeThreat:      Option[CompositeThreat]     = None,
  strategicAssessment:  Option[StrategicAssessment] = None,
  escalationLadder:     Option[EscalationLadder]    = None,
  topScenarios:         List[Scenario]              = List.empty,
)

final case class Contradiction(
  clusterIdA:   String,
  clusterIdB:   String,
  perspectiveA: String,
  perspectiveB: String,
  description:  String,
  severity:     Double,
)

final case class FlashContext(
  threatLevel:     ThreatLevel,
  trend:           EscalationTrend,
  relatedClusters: Int,
)

final case class SitrepSection(
  title: String,
  lines: List[String],
)

final case class SitrepEvent(
  clusterId:    String,
  severity:     Severity,
  eventType:    EventType,
  title:        String,
  location:     Option[String],
  firstSeen:    String,
  sourceCount:  Int,
  perspectives: List[String],
  confidence:   Double,
  summary:      Option[String],
)

final case class Sitrep(
  id:              String,
  generatedAt:     Instant,
  threatLevel:     ThreatLevel,
  headline:        String,
  situation:       SitrepSection,
  keyEvents:       List[SitrepEvent],
  geoPicture:      SitrepSection,
  escalation:      SitrepSection,
  sourceAnalysis:  SitrepSection,
  outlook:         SitrepSection,
  recommendations: List[String],
  rawMetrics:      Map[String, Double],
)

final case class SitrepSummary(
  id:           String,
  generatedAt:  Instant,
  threatLevel:  ThreatLevel,
  clusterCount: Int,
  headline:     String,
)

final case class FlashReport(
  id:           String,
  generatedAt:  Instant,
  severity:     Severity,
  headline:     String,
  body:         String,
  clusterId:    String,
  perspectives: List[String],
  sourceCount:  Int,
  confidence:   Double,
)
