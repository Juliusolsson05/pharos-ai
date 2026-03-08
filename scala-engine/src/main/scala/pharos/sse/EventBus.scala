package pharos.sse

import cats.effect.*
import cats.effect.std.Queue
import cats.syntax.all.*
import fs2.{Pipe, Stream}
import io.circe.*
import io.circe.syntax.*
import io.circe.generic.semiauto.*
import java.time.Instant

/** Server-Sent Events bus for real-time intelligence push.
  *
  * Publishes engine events to connected SSE clients:
  *   - NEW_CLUSTER:     new event cluster detected
  *   - CLUSTER_UPDATE:  existing cluster updated with new sources
  *   - ANOMALY:         statistical anomaly detected
  *   - THREAT_CHANGE:   threat level changed
  *   - ESCALATION:      escalation pattern triggered
  *   - FLASH:           flash report generated for critical event
  *   - CONTRADICTION:   cross-source contradiction detected
  *   - CHAIN:           new causal chain link discovered
  *
  * Uses fs2 Topic for fan-out to multiple clients with backpressure.
  */
trait EventBus[F[_]]:
  /** Publish an event to all subscribers. */
  def publish(event: EngineEvent): F[Unit]

  /** Subscribe to the event stream. Returns a never-ending stream. */
  def subscribe: Stream[F, EngineEvent]

  /** Get recent events (last N). */
  def recent(n: Int): F[List[EngineEvent]]

object EventBus:

  def make[F[_]: Concurrent](bufferSize: Int = 256): F[EventBus[F]] =
    for
      queue   <- Queue.unbounded[F, EngineEvent]
      history <- Ref[F].of(Vector.empty[EngineEvent])
      subs    <- Ref[F].of(Vector.empty[Queue[F, Option[EngineEvent]]])
    yield new EventBusImpl[F](queue, history, subs, bufferSize)

  private class EventBusImpl[F[_]: Concurrent](
    inbound:  Queue[F, EngineEvent],
    history:  Ref[F, Vector[EngineEvent]],
    subscribers: Ref[F, Vector[Queue[F, Option[EngineEvent]]]],
    bufferSize: Int,
  ) extends EventBus[F]:

    override def publish(event: EngineEvent): F[Unit] =
      for
        _ <- history.update(h => (h :+ event).takeRight(500))
        subs <- subscribers.get
        _ <- subs.traverse_(sub => sub.tryOffer(Some(event)).void)
      yield ()

    override def subscribe: Stream[F, EngineEvent] =
      Stream.eval(Queue.bounded[F, Option[EngineEvent]](bufferSize)).flatMap { subQueue =>
        val register   = subscribers.update(_ :+ subQueue)
        val unregister = subscribers.update(_.filterNot(_ eq subQueue))

        Stream.bracket(register)(_ => unregister) >>
          Stream.fromQueueNoneTerminated(subQueue)
      }

    override def recent(n: Int): F[List[EngineEvent]] =
      history.get.map(_.takeRight(n).toList.reverse)

  end EventBusImpl

end EventBus

// ── Event types ──────────────────────────────────────────────────

enum EngineEventType:
  case NewCluster, ClusterUpdate, Anomaly, ThreatChange,
       Escalation, Flash, Contradiction, ChainLink

final case class EngineEvent(
  id:        String,
  timestamp: Instant,
  eventType: EngineEventType,
  severity:  String,
  title:     String,
  payload:   Json,
):
  /** Format as SSE text: "event: <type>\ndata: <json>\n\n" */
  def toSSE: String =
    val data = Json.obj(
      "id"        -> id.asJson,
      "timestamp" -> timestamp.toString.asJson,
      "type"      -> eventType.toString.asJson,
      "severity"  -> severity.asJson,
      "title"     -> title.asJson,
      "payload"   -> payload,
    ).noSpaces
    s"event: ${eventType.toString}\ndata: $data\n\n"

object EngineEvent:
  def cluster(id: String, title: String, severity: String, isNew: Boolean): EngineEvent =
    EngineEvent(
      id        = s"sse-${System.currentTimeMillis}",
      timestamp = Instant.now(),
      eventType = if isNew then EngineEventType.NewCluster else EngineEventType.ClusterUpdate,
      severity  = severity,
      title     = title,
      payload   = Json.obj("clusterId" -> id.asJson, "isNew" -> isNew.asJson),
    )

  def anomaly(clusterId: String, anomalyType: String, score: Double, desc: String): EngineEvent =
    EngineEvent(
      id        = s"sse-${System.currentTimeMillis}",
      timestamp = Instant.now(),
      eventType = EngineEventType.Anomaly,
      severity  = if score > 3.0 then "CRITICAL" else if score > 2.0 then "HIGH" else "STANDARD",
      title     = s"Anomaly: $anomalyType",
      payload   = Json.obj(
        "clusterId"   -> clusterId.asJson,
        "anomalyType" -> anomalyType.asJson,
        "score"       -> score.asJson,
        "description" -> desc.asJson,
      ),
    )

  def threatChange(from: String, to: String, escalation: Double): EngineEvent =
    EngineEvent(
      id        = s"sse-${System.currentTimeMillis}",
      timestamp = Instant.now(),
      eventType = EngineEventType.ThreatChange,
      severity  = to,
      title     = s"Threat level: $from → $to",
      payload   = Json.obj(
        "previousLevel" -> from.asJson,
        "currentLevel"  -> to.asJson,
        "escalation"    -> escalation.asJson,
      ),
    )

  def escalationPattern(patternName: String, bias: Double, desc: String): EngineEvent =
    EngineEvent(
      id        = s"sse-${System.currentTimeMillis}",
      timestamp = Instant.now(),
      eventType = EngineEventType.Escalation,
      severity  = if bias > 3.0 then "CRITICAL" else "HIGH",
      title     = s"Pattern: $patternName",
      payload   = Json.obj(
        "pattern"     -> patternName.asJson,
        "bias"        -> bias.asJson,
        "description" -> desc.asJson,
      ),
    )

  def contradiction(desc: String, perspA: String, perspB: String): EngineEvent =
    EngineEvent(
      id        = s"sse-${System.currentTimeMillis}",
      timestamp = Instant.now(),
      eventType = EngineEventType.Contradiction,
      severity  = "HIGH",
      title     = s"Contradiction: $perspA vs $perspB",
      payload   = Json.obj("description" -> desc.asJson),
    )

  def chainLink(causeTitle: String, effectTitle: String, linkType: String, confidence: Double): EngineEvent =
    EngineEvent(
      id        = s"sse-${System.currentTimeMillis}",
      timestamp = Instant.now(),
      eventType = EngineEventType.ChainLink,
      severity  = "STANDARD",
      title     = s"Chain: $linkType",
      payload   = Json.obj(
        "cause"      -> causeTitle.asJson,
        "effect"     -> effectTitle.asJson,
        "linkType"   -> linkType.asJson,
        "confidence" -> confidence.asJson,
      ),
    )
