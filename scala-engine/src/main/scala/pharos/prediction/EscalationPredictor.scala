package pharos.prediction

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import pharos.domain.*
import java.time.{Duration, Instant}

/** Time-series based escalation predictor.
  *
  * Analyzes conflict escalation patterns using:
  *   - Exponentially weighted moving average (EWMA) of event intensity
  *   - Rate-of-change detection (first derivative of escalation score)
  *   - Pattern matching against known escalation signatures
  *   - Multi-factor scoring: military tempo, diplomatic breakdown, rhetoric
  *
  * Produces a forecast with confidence intervals for the next 1h, 6h, 24h.
  */
trait EscalationPredictor[F[_]]:
  /** Record an escalation data point. */
  def record(point: EscalationPoint): F[Unit]

  /** Get the current escalation forecast. */
  def forecast: F[EscalationForecast]

  /** Get the escalation time series. */
  def timeSeries: F[List[EscalationPoint]]

object EscalationPredictor:

  /** EWMA smoothing factor — higher = more responsive, lower = more stable. */
  private val Alpha = 0.3

  def make[F[_]: Async](maxHistory: Int = 500): F[EscalationPredictor[F]] =
    AtomicCell[F].of(PredictorState.empty(maxHistory)).map(new EscalationPredictorImpl[F](_))

  private case class PredictorState(
    points:     Vector[EscalationPoint],
    ewma:       Double,
    maxHistory: Int,
  ):
    def add(p: EscalationPoint): PredictorState =
      val newEwma = Alpha * p.intensity + (1 - Alpha) * ewma
      val updated = if points.size >= maxHistory then points.tail :+ p else points :+ p
      copy(points = updated, ewma = newEwma)

  private object PredictorState:
    def empty(max: Int): PredictorState = PredictorState(Vector.empty, 0.0, max)

  private class EscalationPredictorImpl[F[_]: Async](
    state: AtomicCell[F, PredictorState],
  ) extends EscalationPredictor[F]:

    override def record(point: EscalationPoint): F[Unit] =
      state.update(_.add(point))

    override def timeSeries: F[List[EscalationPoint]] =
      state.get.map(_.points.toList)

    override def forecast: F[EscalationForecast] =
      state.get.map { s =>
        if s.points.size < 5 then EscalationForecast.insufficient
        else computeForecast(s)
      }

    private def computeForecast(s: PredictorState): EscalationForecast =
      val points  = s.points
      val current = s.ewma
      val now     = Instant.now()

      // Compute rate of change (first derivative) over recent points
      val recentWindow = math.min(points.size, 20)
      val recent       = points.takeRight(recentWindow)
      val rateOfChange = if recent.size >= 2 then
        val firstHalf  = recent.take(recent.size / 2)
        val secondHalf = recent.drop(recent.size / 2)
        val avgFirst   = firstHalf.map(_.intensity).sum / firstHalf.size
        val avgSecond  = secondHalf.map(_.intensity).sum / secondHalf.size
        avgSecond - avgFirst
      else 0.0

      // Compute acceleration (second derivative)
      val acceleration = if recent.size >= 6 then
        val thirds = recent.grouped(recent.size / 3).toList.map(seg =>
          seg.map(_.intensity).sum / seg.size
        )
        if thirds.size >= 3 then
          val rate1 = thirds(1) - thirds(0)
          val rate2 = thirds(2) - thirds(1)
          rate2 - rate1
        else 0.0
      else 0.0

      // Detect escalation patterns
      val patterns = detectPatterns(s)

      // Compute volatility (standard deviation of recent intensities)
      val recentIntensities = recent.map(_.intensity)
      val mean     = recentIntensities.sum / recentIntensities.size
      val variance = recentIntensities.map(x => (x - mean) * (x - mean)).sum / recentIntensities.size
      val volatility = math.sqrt(variance)

      // Linear projection with pattern adjustments
      val patternBias = patterns.map(_.escalationBias).sum
      val projected1h  = math.max(0, math.min(100, current + rateOfChange * 1 + patternBias * 0.3))
      val projected6h  = math.max(0, math.min(100, current + rateOfChange * 6 + patternBias * 0.8 + acceleration * 3))
      val projected24h = math.max(0, math.min(100, current + rateOfChange * 24 + patternBias * 1.5 + acceleration * 12))

      // Confidence intervals widen with time horizon
      val ci1h  = volatility * 1.0
      val ci6h  = volatility * 2.5
      val ci24h = volatility * 5.0

      // Overall trend
      val trend = if rateOfChange > 0.5 && acceleration > 0.1 then EscalationTrend.Accelerating
        else if rateOfChange > 0.2 then EscalationTrend.Escalating
        else if rateOfChange < -0.5 then EscalationTrend.DeEscalating
        else if rateOfChange < -0.2 then EscalationTrend.Cooling
        else EscalationTrend.Stable

      // Confidence: higher with more data, lower with more volatility
      val dataConf      = math.min(1.0, points.size / 50.0)
      val volPenalty     = math.min(0.4, volatility * 0.1)
      val confidence     = math.max(0.1, dataConf - volPenalty)

      EscalationForecast(
        timestamp       = now,
        currentLevel    = current,
        trend           = trend,
        rateOfChange    = rateOfChange,
        acceleration    = acceleration,
        volatility      = volatility,
        forecast1h      = ForecastPoint(projected1h, ci1h),
        forecast6h      = ForecastPoint(projected6h, ci6h),
        forecast24h     = ForecastPoint(projected24h, ci24h),
        activePatterns  = patterns,
        confidence      = confidence,
        dataPoints      = points.size,
      )

    /** Detect known escalation signatures in the time series. */
    private def detectPatterns(s: PredictorState): List[EscalationPattern] =
      val points  = s.points
      val recent  = points.takeRight(30)
      val patterns = List.newBuilder[EscalationPattern]

      if recent.size < 10 then return List.empty

      // Pattern 1: Military tempo surge — rapid increase in MILITARY events
      val militaryRecent = recent.count(_.dominantType == EventType.MILITARY)
      val militaryRate   = militaryRecent.toDouble / recent.size
      if militaryRate > 0.7 then
        patterns += EscalationPattern(
          name           = "Military Tempo Surge",
          description    = f"${militaryRate * 100}%.0f%% of recent events are military (threshold: 70%%)",
          escalationBias = 2.0,
          confidence     = militaryRate,
        )

      // Pattern 2: Diplomatic breakdown — diplomatic events followed by military
      val lastDiplomatic = recent.lastIndexWhere(_.dominantType == EventType.DIPLOMATIC)
      val lastMilitary   = recent.lastIndexWhere(_.dominantType == EventType.MILITARY)
      if lastDiplomatic >= 0 && lastMilitary > lastDiplomatic then
        val gap = lastMilitary - lastDiplomatic
        if gap <= 3 then
          patterns += EscalationPattern(
            name           = "Diplomatic Breakdown",
            description    = s"Military action $gap events after diplomatic activity — possible talks failure",
            escalationBias = 3.0,
            confidence     = 0.6,
          )

      // Pattern 3: Multi-front activation — events from 3+ distinct locations
      val recentLocations = recent.flatMap(_.locationName).distinct
      if recentLocations.size >= 3 then
        patterns += EscalationPattern(
          name           = "Multi-Front Activation",
          description    = s"Activity detected across ${recentLocations.size} locations: ${recentLocations.take(4).mkString(", ")}",
          escalationBias = 1.5,
          confidence     = math.min(1.0, recentLocations.size / 5.0),
        )

      // Pattern 4: Severity cascade — STANDARD → HIGH → CRITICAL progression
      val recentSeverities = recent.takeRight(10).map(_.maxSeverity)
      val hasEscalation = recentSeverities.sliding(3).exists { window =>
        val w = window.toList
        w.size == 3 && w(0).ordinal < w(1).ordinal && w(1).ordinal < w(2).ordinal
      }
      if hasEscalation then
        patterns += EscalationPattern(
          name           = "Severity Cascade",
          description    = "Progressive severity escalation: STANDARD → HIGH → CRITICAL observed",
          escalationBias = 4.0,
          confidence     = 0.7,
        )

      // Pattern 5: Source convergence — multiple perspectives reporting simultaneously
      val avgPerspectives = recent.map(_.perspectiveCount.toDouble).sum / recent.size
      if avgPerspectives > 4.0 then
        patterns += EscalationPattern(
          name           = "Source Convergence",
          description    = f"Average ${avgPerspectives}%.1f perspectives per event (high cross-source attention)",
          escalationBias = 1.0,
          confidence     = math.min(1.0, avgPerspectives / 6.0),
        )

      patterns.result()

  end EscalationPredictorImpl

end EscalationPredictor

// ── Domain types ─────────────────────────────────────────────────

/** A single data point for escalation analysis. */
final case class EscalationPoint(
  timestamp:        Instant,
  intensity:        Double,         // 0–100 composite intensity score
  dominantType:     EventType,
  maxSeverity:      Severity,
  locationName:     Option[String],
  perspectiveCount: Int,
  clusterCount:     Int,
)

enum EscalationTrend:
  case Accelerating, Escalating, Stable, Cooling, DeEscalating

final case class ForecastPoint(
  projected:          Double,   // predicted intensity level
  confidenceInterval: Double,   // ± range
):
  def low: Double  = math.max(0, projected - confidenceInterval)
  def high: Double = math.min(100, projected + confidenceInterval)

final case class EscalationPattern(
  name:           String,
  description:    String,
  escalationBias: Double,   // how much this pattern pushes the forecast up
  confidence:     Double,   // how confident we are in this pattern match
)

final case class EscalationForecast(
  timestamp:      Instant,
  currentLevel:   Double,
  trend:          EscalationTrend,
  rateOfChange:   Double,
  acceleration:   Double,
  volatility:     Double,
  forecast1h:     ForecastPoint,
  forecast6h:     ForecastPoint,
  forecast24h:    ForecastPoint,
  activePatterns: List[EscalationPattern],
  confidence:     Double,
  dataPoints:     Int,
)

object EscalationForecast:
  val insufficient: EscalationForecast = EscalationForecast(
    timestamp      = Instant.now(),
    currentLevel   = 0.0,
    trend          = EscalationTrend.Stable,
    rateOfChange   = 0.0,
    acceleration   = 0.0,
    volatility     = 0.0,
    forecast1h     = ForecastPoint(0.0, 0.0),
    forecast6h     = ForecastPoint(0.0, 0.0),
    forecast24h    = ForecastPoint(0.0, 0.0),
    activePatterns = List.empty,
    confidence     = 0.0,
    dataPoints     = 0,
  )
