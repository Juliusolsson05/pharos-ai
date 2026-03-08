package pharos.alerting

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import io.circe.*
import io.circe.syntax.*
import org.typelevel.log4cats.Logger
import pharos.domain.*
import pharos.sse.{EngineEvent, EngineEventType, EventBus}
import java.time.{Duration, Instant}

/** Configurable alert rules engine.
  *
  * Evaluates a set of rules against the current engine state on each tick.
  * Rules have cooldowns to prevent alert fatigue. Triggered alerts are published
  * to the SSE EventBus and stored in alert history.
  *
  * Built-in rules:
  *   - CRITICAL_CLUSTER:    new cluster with CRITICAL severity
  *   - THREAT_ESCALATION:   threat level >= HIGH with rising escalation
  *   - MULTI_SOURCE_EVENT:  cluster confirmed by 3+ perspectives
  *   - ANOMALY_BURST:       3+ anomalies active simultaneously
  *   - FEED_DEGRADATION:    >30% of feed circuits open
  *   - ESCALATION_SPIKE:    escalation rate-of-change > threshold
  */
trait AlertEngine[F[_]]:
  /** Evaluate all rules against current state. Returns triggered alerts. */
  def evaluate(snapshot: AlertSnapshot): F[List[Alert]]

  /** Get all alerts from history. */
  def alertHistory: F[List[Alert]]

  /** Get active (unacknowledged) alerts. */
  def activeAlerts: F[List[Alert]]

  /** Acknowledge an alert by ID. */
  def acknowledge(alertId: String): F[Boolean]

object AlertEngine:

  def make[F[_]: Async: Logger](
    eventBus:       EventBus[F],
    cooldownMinutes: Int = 15,
  ): F[AlertEngine[F]] =
    for
      state <- AtomicCell[F].of(AlertState.empty)
    yield new AlertEngineImpl[F](eventBus, state, cooldownMinutes)

  private class AlertEngineImpl[F[_]: Async: Logger](
    eventBus:        EventBus[F],
    state:           AtomicCell[F, AlertState],
    cooldownMinutes: Int,
  ) extends AlertEngine[F]:

    private val rules: List[AlertRule] = List(
      AlertRule("CRITICAL_CLUSTER",    "Critical event cluster detected",       AlertSeverity.Critical),
      AlertRule("THREAT_ESCALATION",   "Threat level escalation detected",      AlertSeverity.High),
      AlertRule("MULTI_SOURCE_EVENT",  "Multi-perspective event confirmation",  AlertSeverity.Medium),
      AlertRule("ANOMALY_BURST",       "Multiple anomalies active",             AlertSeverity.High),
      AlertRule("FEED_DEGRADATION",    "Feed source degradation detected",      AlertSeverity.Medium),
      AlertRule("ESCALATION_SPIKE",    "Rapid escalation rate detected",        AlertSeverity.Critical),
      AlertRule("TEMPORAL_SURGE",      "Temporal activity surge detected",      AlertSeverity.High),
      AlertRule("LOW_INDEPENDENCE",    "Low source independence — echo chamber risk", AlertSeverity.High),
      AlertRule("ECHO_CHAMBER_ACTIVE", "Echo chambers affecting coverage",      AlertSeverity.Medium),
    )

    override def evaluate(snapshot: AlertSnapshot): F[List[Alert]] =
      val now = Instant.now()
      val triggered = rules.flatMap(rule => evaluateRule(rule, snapshot, now))

      state.evalModify { s =>
        val cooldown = Duration.ofMinutes(cooldownMinutes.toLong)
        val newAlerts = triggered.filterNot { alert =>
          s.lastFired.get(alert.ruleId).exists { lastTime =>
            Duration.between(lastTime, now).compareTo(cooldown) < 0
          }
        }

        val updatedFired = newAlerts.foldLeft(s.lastFired) { (acc, alert) =>
          acc.updated(alert.ruleId, now)
        }
        val updatedHistory = (s.history ++ newAlerts).takeRight(500)

        val newState = s.copy(lastFired = updatedFired, history = updatedHistory)
        val publishOp = newAlerts.traverse_ { alert =>
          Logger[F].warn(s"ALERT [${alert.severity}] ${alert.ruleId}: ${alert.message}") *>
          eventBus.publish(EngineEvent(
            id        = alert.id,
            timestamp = alert.timestamp,
            eventType = EngineEventType.Escalation,
            severity  = alert.severity.toString,
            title     = s"Alert: ${alert.ruleId}",
            payload   = Json.obj(
              "ruleId"  -> alert.ruleId.asJson,
              "message" -> alert.message.asJson,
              "details" -> alert.details.asJson,
            ),
          ))
        }
        Async[F].pure((newState, newAlerts)).flatTap(_ => publishOp)
      }

    override def alertHistory: F[List[Alert]] =
      state.get.map(_.history.toList.reverse)

    override def activeAlerts: F[List[Alert]] =
      state.get.map(_.history.filterNot(_.acknowledged).toList.reverse)

    override def acknowledge(alertId: String): F[Boolean] =
      state.evalModify { s =>
        val idx = s.history.indexWhere(_.id == alertId)
        if idx >= 0 then
          val updated = s.history.updated(idx, s.history(idx).copy(acknowledged = true))
          Async[F].pure((s.copy(history = updated), true))
        else
          Async[F].pure((s, false))
      }

    private def evaluateRule(rule: AlertRule, snap: AlertSnapshot, now: Instant): Option[Alert] =
      val result: Option[String] = rule.id match
        case "CRITICAL_CLUSTER" =>
          val criticals = snap.clusters.filter(_.severity == Severity.CRITICAL)
          if criticals.nonEmpty then
            Some(s"${criticals.size} critical cluster(s): ${criticals.take(3).map(_.canonicalTitle).mkString(", ")}")
          else None

        case "THREAT_ESCALATION" =>
          if (snap.threatLevel == ThreatLevel.CRITICAL || snap.threatLevel == ThreatLevel.HIGH) &&
             snap.escalationScore > 0.3 then
            Some(s"Threat at ${snap.threatLevel} with escalation score ${f"${snap.escalationScore}%.2f"}")
          else None

        case "MULTI_SOURCE_EVENT" =>
          val multiSource = snap.clusters.filter(_.perspectives.size >= 3)
          if multiSource.nonEmpty then
            Some(s"${multiSource.size} event(s) confirmed by 3+ perspectives: ${multiSource.head.canonicalTitle}")
          else None

        case "ANOMALY_BURST" =>
          if snap.activeAnomalies >= 3 then
            Some(s"${snap.activeAnomalies} anomalies active simultaneously")
          else None

        case "FEED_DEGRADATION" =>
          if snap.totalFeeds > 0 then
            val degradedRatio = snap.openCircuits.toDouble / snap.totalFeeds
            if degradedRatio > 0.3 then
              Some(f"${degradedRatio * 100}%.0f%% of feeds degraded (${snap.openCircuits}/${snap.totalFeeds} circuits open)")
            else None
          else None

        case "ESCALATION_SPIKE" =>
          if snap.escalationRateOfChange > 5.0 then
            Some(f"Escalation rate-of-change at ${snap.escalationRateOfChange}%.1f (threshold: 5.0)")
          else None

        case "TEMPORAL_SURGE" =>
          if snap.temporalPatterns >= 3 then
            Some(s"${snap.temporalPatterns} temporal patterns detected simultaneously — activity surge likely")
          else None

        case "LOW_INDEPENDENCE" =>
          if snap.independenceScore < 0.3 then
            Some(f"Source independence score at ${snap.independenceScore}%.2f — high echo chamber risk")
          else None

        case "ECHO_CHAMBER_ACTIVE" =>
          if snap.echoChambers >= 2 then
            Some(s"${snap.echoChambers} echo chambers detected — coverage reliability degraded")
          else None

        case _ => None

      result.map { message =>
        Alert(
          id           = s"alert-${rule.id}-${now.toEpochMilli}",
          ruleId       = rule.id,
          severity     = rule.severity,
          message      = message,
          details      = rule.description,
          timestamp    = now,
          acknowledged = false,
        )
      }

  end AlertEngineImpl

  // ── Data types ──────────────────────────────────────────────────

  private case class AlertState(
    lastFired: Map[String, Instant],
    history:   Vector[Alert],
  )

  private object AlertState:
    val empty: AlertState = AlertState(Map.empty, Vector.empty)

end AlertEngine

// ── Public types ──────────────────────────────────────────────────

enum AlertSeverity:
  case Critical, High, Medium, Low

final case class AlertRule(
  id:          String,
  description: String,
  severity:    AlertSeverity,
)

final case class Alert(
  id:           String,
  ruleId:       String,
  severity:     AlertSeverity,
  message:      String,
  details:      String,
  timestamp:    Instant,
  acknowledged: Boolean,
)

/** Snapshot of engine state for alert evaluation. */
final case class AlertSnapshot(
  clusters:               List[EventCluster],
  threatLevel:            ThreatLevel,
  escalationScore:        Double,
  escalationRateOfChange: Double,
  activeAnomalies:        Int,
  openCircuits:           Int,
  totalFeeds:             Int,
  temporalPatterns:       Int = 0,
  echoChambers:           Int = 0,
  independenceScore:      Double = 1.0,
)
