package pharos.temporal

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import pharos.domain.*
import java.time.{Duration, Instant, ZoneOffset}

/** Temporal pattern analysis engine.
  *
  * Detects time-based patterns across events to identify:
  *   - Daily activity cycles (peak hours for military vs diplomatic events)
  *   - Response lag patterns (how quickly events trigger follow-on events)
  *   - Weekly rhythms (weekend vs weekday activity differences)
  *   - Temporal clustering (bursts vs steady-state activity)
  *   - Escalation velocity (time-to-critical acceleration)
  *
  * Operates on a sliding window of timestamped event observations.
  */
trait TemporalAnalyzer[F[_]]:
  /** Record an event timestamp with metadata. */
  def record(event: TemporalEvent): F[Unit]

  /** Get the current temporal profile. */
  def profile: F[TemporalProfile]

  /** Detect active temporal patterns. */
  def detectPatterns: F[List[TemporalPattern]]

  /** Get hourly activity distribution. */
  def hourlyDistribution: F[Map[Int, HourlyStats]]

object TemporalAnalyzer:

  def make[F[_]: Async](maxEvents: Int = 2000): F[TemporalAnalyzer[F]] =
    AtomicCell[F].of(TemporalState(Vector.empty, maxEvents)).map(new TemporalAnalyzerImpl[F](_))

  private class TemporalAnalyzerImpl[F[_]: Async](
    state: AtomicCell[F, TemporalState],
  ) extends TemporalAnalyzer[F]:

    override def record(event: TemporalEvent): F[Unit] =
      state.update { s =>
        val updated = (s.events :+ event).takeRight(s.maxEvents)
        s.copy(events = updated)
      }

    override def profile: F[TemporalProfile] =
      state.get.map { s =>
        if s.events.isEmpty then TemporalProfile.empty
        else
          val events = s.events
          val now = Instant.now()
          val last24h = events.filter(e => math.abs(Duration.between(e.timestamp, now).toHours) <= 24)
          val last1h  = events.filter(e => math.abs(Duration.between(e.timestamp, now).toMinutes) <= 60)

          // Activity rate
          val totalSpanHours = math.max(1.0,
            math.abs(Duration.between(events.head.timestamp, events.last.timestamp).toHours).toDouble
          )
          val overallRate = events.size.toDouble / totalSpanHours

          // Burst detection — sliding 15-min windows
          val burstWindows = events.groupBy { e =>
            e.timestamp.getEpochSecond / 900 // 15-min buckets
          }
          val maxBurstSize = if burstWindows.isEmpty then 0 else burstWindows.values.map(_.size).max
          val avgBurstSize = if burstWindows.isEmpty then 0.0
            else burstWindows.values.map(_.size.toDouble).sum / burstWindows.size

          // Peak hour (UTC)
          val hourCounts = events
            .map(_.timestamp.atZone(ZoneOffset.UTC).getHour)
            .groupBy(identity)
            .view.mapValues(_.size)
            .toMap
          val peakHour = if hourCounts.isEmpty then 0 else hourCounts.maxBy(_._2)._1

          // Type distribution
          val typeDistribution = events
            .groupBy(_.eventType)
            .view.mapValues(_.size.toDouble / events.size)
            .toMap

          // Severity trend — compare last 1h severity to baseline
          val baselineSeverity = events.map(severityScore).sum / events.size
          val recentSeverity = if last1h.isEmpty then baselineSeverity
            else last1h.map(severityScore).sum / last1h.size
          val severityTrend = recentSeverity - baselineSeverity

          TemporalProfile(
            totalEvents       = events.size,
            timeSpanHours     = totalSpanHours,
            eventsPerHour     = overallRate,
            last24hCount      = last24h.size,
            last1hCount       = last1h.size,
            peakHourUtc       = peakHour,
            maxBurstSize      = maxBurstSize,
            avgBurstSize      = avgBurstSize,
            typeDistribution  = typeDistribution,
            severityTrend     = severityTrend,
          )
      }

    override def detectPatterns: F[List[TemporalPattern]] =
      state.get.map { s =>
        if s.events.size < 10 then List.empty
        else
          val patterns = List.newBuilder[TemporalPattern]
          val events = s.events

          // 1. Activity surge — current rate >> baseline
          detectActivitySurge(events).foreach(patterns += _)

          // 2. Night ops — unusual activity outside business hours (06-18 UTC)
          detectNightOps(events).foreach(patterns += _)

          // 3. Rapid response chain — events within minutes of each other
          detectRapidResponse(events).foreach(patterns += _)

          // 4. Escalation acceleration — severity increasing over time
          detectEscalationAcceleration(events).foreach(patterns += _)

          // 5. Multi-type convergence — different event types clustering in time
          detectTypeConvergence(events).foreach(patterns += _)

          patterns.result()
      }

    override def hourlyDistribution: F[Map[Int, HourlyStats]] =
      state.get.map { s =>
        (0 until 24).map { hour =>
          val hourEvents = s.events.filter(_.timestamp.atZone(ZoneOffset.UTC).getHour == hour)
          val types = hourEvents.groupBy(_.eventType).view.mapValues(_.size).toMap
          val avgSeverity = if hourEvents.isEmpty then 0.0
            else hourEvents.map(severityScore).sum / hourEvents.size
          hour -> HourlyStats(
            hour       = hour,
            count      = hourEvents.size,
            avgSeverity = avgSeverity,
            topType    = types.maxByOption(_._2).map(_._1),
          )
        }.toMap
      }

    // ── Pattern detectors ────────────────────────────────────────

    private def detectActivitySurge(events: Vector[TemporalEvent]): Option[TemporalPattern] =
      val now = Instant.now()
      val last1h = events.filter(e => math.abs(Duration.between(e.timestamp, now).toMinutes) <= 60)
      val totalHours = math.max(1.0, math.abs(Duration.between(events.head.timestamp, now).toHours).toDouble)
      val baseline = events.size.toDouble / totalHours
      val currentRate = last1h.size.toDouble

      if baseline > 0 && currentRate > baseline * 2.5 then
        Some(TemporalPattern(
          name        = "Activity Surge",
          description = f"Current rate (${currentRate}%.0f/h) is ${currentRate / baseline}%.1fx above baseline (${baseline}%.1f/h)",
          confidence  = math.min(1.0, (currentRate / baseline - 1.0) / 3.0),
          severity    = if currentRate > baseline * 5 then "CRITICAL" else "HIGH",
        ))
      else None

    private def detectNightOps(events: Vector[TemporalEvent]): Option[TemporalPattern] =
      val now = Instant.now()
      val recent = events.filter(e => math.abs(Duration.between(e.timestamp, now).toHours) <= 6)
      val nightEvents = recent.filter { e =>
        val hour = e.timestamp.atZone(ZoneOffset.UTC).getHour
        hour < 6 || hour >= 22
      }
      val nightRatio = if recent.isEmpty then 0.0 else nightEvents.size.toDouble / recent.size

      if nightRatio > 0.5 && nightEvents.size >= 3 then
        Some(TemporalPattern(
          name        = "Night Operations",
          description = f"${nightEvents.size} events (${nightRatio * 100}%.0f%%) in off-hours — possible covert or military activity",
          confidence  = math.min(1.0, nightRatio),
          severity    = "HIGH",
        ))
      else None

    private def detectRapidResponse(events: Vector[TemporalEvent]): Option[TemporalPattern] =
      if events.size < 3 then None
      else
        val sorted = events.sortBy(_.timestamp)
        val gaps = sorted.sliding(2).map { pair =>
          math.abs(Duration.between(pair(0).timestamp, pair(1).timestamp).toMinutes)
        }.toList

        val shortGaps = gaps.count(_ <= 5) // within 5 minutes
        val ratio = shortGaps.toDouble / gaps.size

        if ratio > 0.3 && shortGaps >= 5 then
          Some(TemporalPattern(
            name        = "Rapid Response Chain",
            description = f"$shortGaps event pairs within 5min (${ratio * 100}%.0f%%) — indicates active engagement or coordinated reporting",
            confidence  = math.min(1.0, ratio * 1.5),
            severity    = "HIGH",
          ))
        else None

    private def detectEscalationAcceleration(events: Vector[TemporalEvent]): Option[TemporalPattern] =
      if events.size < 20 then None
      else
        val halfIdx = events.size / 2
        val firstHalf = events.take(halfIdx)
        val secondHalf = events.drop(halfIdx)

        val firstAvg = firstHalf.map(severityScore).sum / firstHalf.size
        val secondAvg = secondHalf.map(severityScore).sum / secondHalf.size
        val delta = secondAvg - firstAvg

        if delta > 0.5 then
          Some(TemporalPattern(
            name        = "Escalation Acceleration",
            description = f"Average severity increased from ${firstAvg}%.1f to ${secondAvg}%.1f (+${delta}%.1f) over recent events",
            confidence  = math.min(1.0, delta / 2.0),
            severity    = if delta > 1.0 then "CRITICAL" else "HIGH",
          ))
        else None

    private def detectTypeConvergence(events: Vector[TemporalEvent]): Option[TemporalPattern] =
      val now = Instant.now()
      val recent = events.filter(e => math.abs(Duration.between(e.timestamp, now).toMinutes) <= 120)
      val recentTypes = recent.map(_.eventType).distinct

      if recentTypes.size >= 4 then
        Some(TemporalPattern(
          name        = "Multi-Domain Convergence",
          description = s"${recentTypes.size} event types active in last 2h: ${recentTypes.mkString(", ")} — indicates cross-domain escalation",
          confidence  = math.min(1.0, recentTypes.size / 6.0),
          severity    = if recentTypes.size >= 5 then "CRITICAL" else "HIGH",
        ))
      else None

    private def severityScore(event: TemporalEvent): Double = event.severity match
      case Severity.CRITICAL => 3.0
      case Severity.HIGH     => 2.0
      case Severity.STANDARD => 1.0

  end TemporalAnalyzerImpl

  private case class TemporalState(events: Vector[TemporalEvent], maxEvents: Int)

end TemporalAnalyzer

// ── Public types ──────────────────────────────────────────────────

final case class TemporalEvent(
  timestamp: Instant,
  eventType: String,
  severity:  Severity,
  location:  Option[String],
  clusterId: String,
)

final case class TemporalProfile(
  totalEvents:      Int,
  timeSpanHours:    Double,
  eventsPerHour:    Double,
  last24hCount:     Int,
  last1hCount:      Int,
  peakHourUtc:      Int,
  maxBurstSize:     Int,
  avgBurstSize:     Double,
  typeDistribution: Map[String, Double],
  severityTrend:    Double,
)

object TemporalProfile:
  val empty: TemporalProfile = TemporalProfile(0, 0, 0, 0, 0, 0, 0, 0, Map.empty, 0)

final case class TemporalPattern(
  name:        String,
  description: String,
  confidence:  Double,
  severity:    String,
)

final case class HourlyStats(
  hour:        Int,
  count:       Int,
  avgSeverity: Double,
  topType:     Option[String],
)
