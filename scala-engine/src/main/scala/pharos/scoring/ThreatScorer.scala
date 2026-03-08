package pharos.scoring

import cats.effect.*
import cats.syntax.all.*
import pharos.correlation.{AnomalyDetector, CorrelationEngine}
import pharos.domain.*
import pharos.geo.GeoSpatialEngine
import pharos.network.SourceNetworkAnalyzer
import pharos.prediction.EscalationPredictor
import pharos.temporal.TemporalAnalyzer
import java.time.Instant

/** Composite threat scoring engine.
  *
  * Fuses signals from all analytical components into a single, explainable
  * threat score with factor decomposition and confidence intervals.
  *
  * The score model uses weighted factors:
  *   - Cluster severity (30%): weighted count of CRITICAL/HIGH clusters
  *   - Escalation dynamics (20%): rate of change + acceleration from EWMA predictor
  *   - Anomaly signals (15%): active anomaly count and severity
  *   - Temporal patterns (10%): detected patterns like activity surges, night ops
  *   - Source independence (10%): multi-perspective confirmation strength
  *   - Geographic concentration (10%): hotspot density and spread
  *   - Velocity (5%): rate of new cluster creation
  *
  * Each factor produces a 0.0–1.0 sub-score. The composite is a weighted sum
  * with a confidence interval derived from source diversity and data volume.
  */
trait ThreatScorer[F[_]]:
  /** Compute the full composite threat assessment. */
  def compositeThreat: F[CompositeThreat]

object ThreatScorer:

  def make[F[_]: Async](
    engine:        CorrelationEngine[F],
    anomaly:       AnomalyDetector[F],
    predictor:     EscalationPredictor[F],
    temporal:      TemporalAnalyzer[F],
    sourceNetwork: SourceNetworkAnalyzer[F],
    geo:           GeoSpatialEngine[F],
  ): ThreatScorer[F] = new Impl[F](engine, anomaly, predictor, temporal, sourceNetwork, geo)

  private class Impl[F[_]: Async](
    engine:        CorrelationEngine[F],
    anomaly:       AnomalyDetector[F],
    predictor:     EscalationPredictor[F],
    temporal:      TemporalAnalyzer[F],
    sourceNetwork: SourceNetworkAnalyzer[F],
    geo:           GeoSpatialEngine[F],
  ) extends ThreatScorer[F]:

    // Factor weights — must sum to 1.0
    private val W_SEVERITY   = 0.30
    private val W_ESCALATION = 0.20
    private val W_ANOMALY    = 0.15
    private val W_TEMPORAL   = 0.10
    private val W_SOURCE     = 0.10
    private val W_GEO        = 0.10
    private val W_VELOCITY   = 0.05

    override def compositeThreat: F[CompositeThreat] =
      for
        clusters  <- engine.activeClusters
        forecast  <- predictor.forecast
        anomalies <- anomaly.activeAnomalies
        tempProf  <- temporal.profile
        tempPats  <- temporal.detectPatterns
        coverage  <- sourceNetwork.coverageAnalysis
        hotspots  <- geo.detectHotspots(2, 50.0)
        theater   <- geo.theaterOverview
      yield
        val now = Instant.now()

        // ── Factor 1: Cluster severity ──────────────────────────
        val severityFactor = if clusters.isEmpty then ThreatFactor("Cluster Severity", 0.0, W_SEVERITY, "No active clusters")
        else
          val critCount = clusters.count(_.severity == Severity.CRITICAL)
          val highCount = clusters.count(_.severity == Severity.HIGH)
          val raw = math.min(1.0, (critCount * 0.4 + highCount * 0.15 + clusters.size * 0.02))
          ThreatFactor("Cluster Severity", raw, W_SEVERITY,
            f"$critCount CRITICAL, $highCount HIGH, ${clusters.size} total clusters")

        // ── Factor 2: Escalation dynamics ───────────────────────
        val escFactor =
          val rateNorm = math.min(1.0, math.max(0.0, (forecast.rateOfChange + 5.0) / 10.0)) // normalize -5..+5 → 0..1
          val accelNorm = math.min(1.0, math.max(0.0, (forecast.acceleration + 1.0) / 2.0))
          val raw = rateNorm * 0.6 + accelNorm * 0.4
          val desc = f"rate=${forecast.rateOfChange}%.2f/h accel=${forecast.acceleration}%.3f trend=${forecast.trend}"
          ThreatFactor("Escalation Dynamics", raw, W_ESCALATION, desc)

        // ── Factor 3: Anomaly signals ───────────────────────────
        val anomalyFactor =
          val activeCount = anomalies.size
          val maxScore = if anomalies.isEmpty then 0.0 else anomalies.map(_.anomalyScore).max
          val raw = math.min(1.0, activeCount * 0.1 + maxScore * 0.15)
          ThreatFactor("Anomaly Signals", raw, W_ANOMALY,
            f"$activeCount active anomalies, max score ${maxScore}%.2f")

        // ── Factor 4: Temporal patterns ─────────────────────────
        val temporalFactor =
          val patternScore = tempPats.map { p =>
            val sevWeight = p.severity match
              case "CRITICAL" => 0.4
              case "HIGH"     => 0.25
              case _          => 0.1
            sevWeight * p.confidence
          }.sum
          val burstScore = math.min(0.3, tempProf.maxBurstSize * 0.03)
          val raw = math.min(1.0, patternScore + burstScore)
          ThreatFactor("Temporal Patterns", raw, W_TEMPORAL,
            f"${tempPats.size} patterns detected, max burst ${tempProf.maxBurstSize}, sev trend ${tempProf.severityTrend}%.2f")

        // ── Factor 5: Source independence ───────────────────────
        // Higher independence = LOWER threat factor (diverse sources = more reliable)
        // But we want the threat to increase when independence is LOW (echo chamber risk)
        val sourceFactor =
          val echoRisk = 1.0 - coverage.independenceScore  // low independence → high risk
          val singleSourcePenalty = math.min(0.3, coverage.singleSourceRatio * 0.5)
          val raw = math.min(1.0, echoRisk * 0.7 + singleSourcePenalty * 0.3)
          ThreatFactor("Source Risk", raw, W_SOURCE,
            f"independence=${coverage.independenceScore}%.0f%%, single-source ratio=${coverage.singleSourceRatio}%.0f%%")

        // ── Factor 6: Geographic concentration ──────────────────
        val geoFactor =
          val hotspotIntensity = if hotspots.isEmpty then 0.0
            else math.min(1.0, hotspots.map(_.intensity).sum / 20.0)
          val spread = if theater.totalEvents < 2 then 0.0
            else
              val bb = theater.boundingBox
              val spanKm = pharos.geo.GeoSpatialEngine.haversine(bb.minLon, bb.minLat, bb.maxLon, bb.maxLat)
              // Large spread with multiple hotspots = multi-front → higher threat
              math.min(0.3, hotspots.size * 0.05) + math.min(0.2, spanKm / 5000.0)
          val raw = math.min(1.0, hotspotIntensity + spread)
          ThreatFactor("Geographic Concentration", raw, W_GEO,
            f"${hotspots.size} hotspots, ${theater.totalEvents} geo events")

        // ── Factor 7: Velocity ──────────────────────────────────
        val velocityFactor =
          val rate = tempProf.eventsPerHour
          val raw = math.min(1.0, rate / 20.0) // 20 events/hr = max velocity score
          ThreatFactor("Event Velocity", raw, W_VELOCITY,
            f"${rate}%.1f events/hour, ${tempProf.last1hCount} in last hour")

        // ── Composite calculation ───────────────────────────────
        val factors = List(severityFactor, escFactor, anomalyFactor, temporalFactor, sourceFactor, geoFactor, velocityFactor)
        val compositeScore = factors.map(f => f.score * f.weight).sum

        // Confidence: higher with more data, more sources, more perspectives
        val dataConfidence = math.min(0.4, clusters.size * 0.02 + tempProf.totalEvents * 0.001)
        val sourceConfidence = math.min(0.3, coverage.multiPerspectiveClusters * 0.03)
        val timeConfidence = math.min(0.3, tempProf.timeSpanHours * 0.01)
        val overallConfidence = math.min(1.0, dataConfidence + sourceConfidence + timeConfidence)

        // Confidence interval widens with lower confidence
        val halfWidth = (1.0 - overallConfidence) * 0.2

        // Threat level from composite score
        val level = compositeScore match
          case s if s > 0.7  => ThreatLevel.CRITICAL
          case s if s > 0.45 => ThreatLevel.HIGH
          case s if s > 0.2  => ThreatLevel.ELEVATED
          case _             => ThreatLevel.MONITORING

        // Dominant factor
        val dominant = factors.maxBy(f => f.score * f.weight)

        CompositeThreat(
          timestamp        = now,
          compositeScore   = compositeScore,
          threatLevel      = level,
          confidence       = overallConfidence,
          confidenceLow    = math.max(0.0, compositeScore - halfWidth),
          confidenceHigh   = math.min(1.0, compositeScore + halfWidth),
          factors          = factors,
          dominantFactor   = dominant.name,
          clusterCount     = clusters.size,
          dataPoints       = tempProf.totalEvents,
          recommendation   = generateRecommendation(level, dominant, factors),
        )

    private def generateRecommendation(level: ThreatLevel, dominant: ThreatFactor, factors: List[ThreatFactor]): String =
      val base = level match
        case ThreatLevel.CRITICAL  => "IMMEDIATE ACTION REQUIRED."
        case ThreatLevel.HIGH      => "ELEVATED POSTURE RECOMMENDED."
        case ThreatLevel.ELEVATED  => "INCREASED MONITORING ADVISED."
        case ThreatLevel.MONITORING => "ROUTINE MONITORING POSTURE."

      val driver = s" Primary driver: ${dominant.name} (${f"${dominant.score * 100}%.0f"}%%)."

      val warnings = factors.filter(_.score > 0.6).map { f =>
        f.name match
          case "Cluster Severity"         => "Multiple high-severity events active."
          case "Escalation Dynamics"      => "Escalation trajectory accelerating."
          case "Anomaly Signals"          => "Statistical anomalies detected above baseline."
          case "Temporal Patterns"        => "Unusual temporal activity patterns identified."
          case "Source Risk"              => "Low source independence — possible echo chamber effects."
          case "Geographic Concentration" => "Activity concentrated in multiple hotspots."
          case "Event Velocity"           => "Event reporting rate significantly elevated."
          case _                          => ""
      }.filter(_.nonEmpty)

      val warningStr = if warnings.isEmpty then "" else s" ${warnings.mkString(" ")}"

      s"$base$driver$warningStr"

  end Impl

end ThreatScorer

// ── Public types ──────────────────────────────────────────────────

final case class ThreatFactor(
  name:        String,
  score:       Double,   // 0.0–1.0 raw factor score
  weight:      Double,   // factor weight in composite
  description: String,
)

final case class CompositeThreat(
  timestamp:      Instant,
  compositeScore: Double,        // 0.0–1.0 weighted composite
  threatLevel:    ThreatLevel,
  confidence:     Double,        // 0.0–1.0 overall confidence
  confidenceLow:  Double,        // lower bound of confidence interval
  confidenceHigh: Double,        // upper bound of confidence interval
  factors:        List[ThreatFactor],
  dominantFactor: String,
  clusterCount:   Int,
  dataPoints:     Int,
  recommendation: String,
)
