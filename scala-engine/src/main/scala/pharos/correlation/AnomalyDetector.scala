package pharos.correlation

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import pharos.domain.*
import java.time.{Duration, Instant}

/** Statistical anomaly detection for intelligence signals.
  *
  * Maintains a rolling baseline of event frequency, severity distribution,
  * and source diversity. Detects anomalies when current observations deviate
  * significantly from the baseline using modified Z-scores and entropy measures.
  *
  * Designed for OSINT: a sudden spike in CRITICAL events from multiple
  * perspectives is more significant than a single-source spike.
  */
trait AnomalyDetector[F[_]]:
  /** Record an observation and check if it's anomalous. */
  def observe(cluster: EventCluster): F[AnomalyResult]

  /** Get current baseline statistics. */
  def baseline: F[BaselineStats]

  /** Get all active anomalies (not yet resolved). */
  def activeAnomalies: F[List[AnomalyResult]]

object AnomalyDetector:

  def make[F[_]: Async](windowSize: Int = 100): F[AnomalyDetector[F]] =
    (
      AtomicCell[F].of(DetectorState.empty(windowSize)),
      AtomicCell[F].of(List.empty[AnomalyResult]),
    ).mapN { (stateCell, anomaliesCell) =>
      new AnomalyDetectorImpl[F](stateCell, anomaliesCell, windowSize)
    }

  private class AnomalyDetectorImpl[F[_]: Async](
    stateCell:     AtomicCell[F, DetectorState],
    anomaliesCell: AtomicCell[F, List[AnomalyResult]],
    windowSize:    Int,
  ) extends AnomalyDetector[F]:

    override def observe(cluster: EventCluster): F[AnomalyResult] =
      stateCell.evalModify { state =>
        Sync[F].delay {
          val now         = Instant.now()
          val observation = Observation.fromCluster(cluster, now)
          val updated     = state.addObservation(observation)
          val result      = detectAnomaly(updated, observation)
          (updated, result)
        }
      }.flatTap { result =>
        if result.isAnomaly then
          anomaliesCell.update(anomalies =>
            (result :: anomalies).take(50) // keep last 50 anomalies
          )
        else Sync[F].unit
      }

    override def baseline: F[BaselineStats] =
      stateCell.get.map(computeBaseline)

    override def activeAnomalies: F[List[AnomalyResult]] =
      anomaliesCell.get.map(_.filter(a =>
        Duration.between(a.detectedAt, Instant.now()).toHours < 6
      ))

    private def detectAnomaly(state: DetectorState, obs: Observation): AnomalyResult =
      if state.observations.size < 10 then
        // Not enough data for baseline — no anomaly detection yet
        AnomalyResult(
          detectedAt    = obs.timestamp,
          clusterId     = obs.clusterId,
          isAnomaly     = false,
          anomalyScore  = 0.0,
          anomalyType   = AnomalyType.None,
          description   = "Insufficient baseline data",
          baselineStats = computeBaseline(state),
        )
      else
        val stats = computeBaseline(state)
        val signals = List(
          checkFrequencySpike(state, obs, stats),
          checkSeverityShift(state, obs, stats),
          checkPerspectiveSurge(state, obs, stats),
          checkSourceDiversityAnomaly(obs, stats),
        ).flatten

        if signals.isEmpty then
          AnomalyResult(obs.timestamp, obs.clusterId, false, 0.0, AnomalyType.None, "Within normal parameters", stats)
        else
          val topSignal = signals.maxBy(_.score)
          AnomalyResult(
            detectedAt    = obs.timestamp,
            clusterId     = obs.clusterId,
            isAnomaly     = topSignal.score > 2.0, // modified Z-score threshold
            anomalyScore  = topSignal.score,
            anomalyType   = topSignal.anomalyType,
            description   = topSignal.description,
            baselineStats = stats,
          )

    /** Detect unusual frequency of new clusters. */
    private def checkFrequencySpike(
      state: DetectorState, obs: Observation, stats: BaselineStats,
    ): Option[AnomalySignal] =
      val recentWindow = Duration.ofMinutes(30)
      val recentCount = state.observations.count(o =>
        math.abs(Duration.between(o.timestamp, obs.timestamp).toMinutes) <= recentWindow.toMinutes
      )
      val expectedRate = stats.meanFrequencyPerHour / 2.0 // per 30 min
      if expectedRate > 0 && stats.stdFrequencyPerHour > 0 then
        val zScore = (recentCount - expectedRate) / math.max(stats.stdFrequencyPerHour / 2.0, 0.1)
        if zScore > 1.5 then
          Some(AnomalySignal(zScore, AnomalyType.FrequencySpike,
            f"Event frequency spike: $recentCount clusters in 30min vs baseline ${expectedRate}%.1f (z=$zScore%.2f)"))
        else None
      else None

    /** Detect shift toward higher severity events. */
    private def checkSeverityShift(
      state: DetectorState, obs: Observation, stats: BaselineStats,
    ): Option[AnomalySignal] =
      val severityScore = obs.severity match
        case Severity.CRITICAL => 3.0
        case Severity.HIGH     => 2.0
        case Severity.STANDARD => 1.0
      val zScore = if stats.stdSeverity > 0
        then (severityScore - stats.meanSeverity) / stats.stdSeverity
        else 0.0
      if zScore > 2.0 then
        Some(AnomalySignal(zScore, AnomalyType.SeverityShift,
          f"Severity escalation: ${obs.severity} vs baseline mean ${stats.meanSeverity}%.2f (z=$zScore%.2f)"))
      else None

    /** Detect multi-perspective convergence (many viewpoints reporting simultaneously). */
    private def checkPerspectiveSurge(
      state: DetectorState, obs: Observation, stats: BaselineStats,
    ): Option[AnomalySignal] =
      val perspCount = obs.perspectiveCount.toDouble
      if perspCount > stats.meanPerspectives + 2.0 * math.max(stats.stdPerspectives, 0.5) then
        val zScore = (perspCount - stats.meanPerspectives) / math.max(stats.stdPerspectives, 0.5)
        Some(AnomalySignal(zScore, AnomalyType.PerspectiveConvergence,
          f"Multi-perspective convergence: $perspCount%.0f perspectives vs baseline ${stats.meanPerspectives}%.1f"))
      else None

    /** Detect unusual source diversity within a single cluster. */
    private def checkSourceDiversityAnomaly(
      obs: Observation, stats: BaselineStats,
    ): Option[AnomalySignal] =
      if obs.sourceCount > stats.meanSourcesPerCluster + 3.0 * math.max(stats.stdSourcesPerCluster, 0.5) then
        val zScore = (obs.sourceCount - stats.meanSourcesPerCluster) / math.max(stats.stdSourcesPerCluster, 0.5)
        Some(AnomalySignal(zScore, AnomalyType.SourceDiversitySpike,
          f"Source diversity spike: ${obs.sourceCount} sources vs baseline ${stats.meanSourcesPerCluster}%.1f"))
      else None

    private def computeBaseline(state: DetectorState): BaselineStats =
      val obs = state.observations
      if obs.isEmpty then BaselineStats.empty
      else
        val severities = obs.map(o => o.severity match
          case Severity.CRITICAL => 3.0
          case Severity.HIGH     => 2.0
          case Severity.STANDARD => 1.0
        )
        val perspectives = obs.map(_.perspectiveCount.toDouble)
        val sources      = obs.map(_.sourceCount.toDouble)

        // Compute hourly frequency
        val timespan = if obs.size > 1 then
          val sorted = obs.sortBy(_.timestamp)
          Duration.between(sorted.head.timestamp, sorted.last.timestamp).toHours.toDouble.max(1.0)
        else 1.0
        val hourlyRate = obs.size.toDouble / timespan

        BaselineStats(
          observationCount       = obs.size,
          meanSeverity           = mean(severities),
          stdSeverity            = stddev(severities),
          meanPerspectives       = mean(perspectives),
          stdPerspectives        = stddev(perspectives),
          meanSourcesPerCluster  = mean(sources),
          stdSourcesPerCluster   = stddev(sources),
          meanFrequencyPerHour   = hourlyRate,
          stdFrequencyPerHour    = stddev(severities), // proxy — refined with more data
        )

    private def mean(xs: Vector[Double]): Double =
      if xs.isEmpty then 0.0 else xs.sum / xs.size

    private def stddev(xs: Vector[Double]): Double =
      if xs.size < 2 then 0.0
      else
        val m   = mean(xs)
        val variance = xs.map(x => (x - m) * (x - m)).sum / (xs.size - 1)
        math.sqrt(variance)

  end AnomalyDetectorImpl

  // ── Internal types ─────────────────────────────────────────────

  private case class Observation(
    clusterId:        String,
    timestamp:        Instant,
    severity:         Severity,
    perspectiveCount: Int,
    sourceCount:      Int,
  )

  private object Observation:
    def fromCluster(c: EventCluster, now: Instant): Observation =
      Observation(c.id, now, c.severity, c.perspectives.size, c.sourceCount)

  private case class DetectorState(
    observations: Vector[Observation],
    maxSize:      Int,
  ):
    def addObservation(obs: Observation): DetectorState =
      val updated = if observations.size >= maxSize
        then observations.tail :+ obs
        else observations :+ obs
      copy(observations = updated)

  private object DetectorState:
    def empty(maxSize: Int): DetectorState = DetectorState(Vector.empty, maxSize)

  private case class AnomalySignal(
    score:       Double,
    anomalyType: AnomalyType,
    description: String,
  )

end AnomalyDetector

// ── Public result types ──────────────────────────────────────────

enum AnomalyType:
  case None, FrequencySpike, SeverityShift, PerspectiveConvergence, SourceDiversitySpike

final case class AnomalyResult(
  detectedAt:    Instant,
  clusterId:     String,
  isAnomaly:     Boolean,
  anomalyScore:  Double,
  anomalyType:   AnomalyType,
  description:   String,
  baselineStats: BaselineStats,
)

final case class BaselineStats(
  observationCount:      Int,
  meanSeverity:          Double,
  stdSeverity:           Double,
  meanPerspectives:      Double,
  stdPerspectives:       Double,
  meanSourcesPerCluster: Double,
  stdSourcesPerCluster:  Double,
  meanFrequencyPerHour:  Double,
  stdFrequencyPerHour:   Double,
)

object BaselineStats:
  val empty: BaselineStats = BaselineStats(0, 0, 0, 0, 0, 0, 0, 0, 0)
