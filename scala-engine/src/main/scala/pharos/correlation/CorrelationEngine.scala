package pharos.correlation

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import pharos.domain.*
import java.time.{Duration, Instant}
import java.util.UUID

/** Streaming event correlation engine.
  *
  * Maintains a sliding window of active EventClusters. When a new feed item
  * arrives, the engine:
  *   1. Computes text similarity against all active clusters
  *   2. Extracts locations and actors for geo/entity correlation
  *   3. Either merges into an existing cluster or creates a new one
  *   4. Recomputes threat assessment when clusters change
  *
  * Thread-safe via AtomicCell — safe for concurrent feed ingestion.
  */
trait CorrelationEngine[F[_]]:
  def correlate(item: RawFeedItem, source: FeedSource): F[CorrelationResult]
  def activeClusters: F[List[EventCluster]]
  def assessThreat: F[ThreatAssessment]
  def expireStale: F[Int]

object CorrelationEngine:

  def make[F[_]: Async](config: EngineConfig): F[CorrelationEngine[F]] =
    AtomicCell[F].of(EngineState.empty).map { state =>
      new CorrelationEngineImpl[F](config, state)
    }

  private final case class EngineState(
    clusters:    Map[String, EventCluster],
    itemIndex:   Map[String, String],  // feedItemLink -> clusterId
  )

  private object EngineState:
    val empty: EngineState = EngineState(Map.empty, Map.empty)

  private class CorrelationEngineImpl[F[_]: Async](
    config: EngineConfig,
    state:  AtomicCell[F, EngineState],
  ) extends CorrelationEngine[F]:

    override def correlate(item: RawFeedItem, source: FeedSource): F[CorrelationResult] =
      state.evalModify { s =>
        // Don't double-process
        if s.itemIndex.contains(item.link) then
          val cid = s.itemIndex(item.link)
          Sync[F].pure((s, CorrelationResult(cid, isNew = false, confidence = 1.0, matchedOn = List("duplicate"))))
        else
          Sync[F].delay {
            val textToMatch = s"${item.title} ${item.contentSnippet.getOrElse("")}"
            val itemLocations = TextSimilarity.extractLocations(textToMatch)
            val itemActors    = TextSimilarity.extractActors(textToMatch)
            val itemTokens    = TextSimilarity.tokenize(textToMatch).toSet

            // Find best matching cluster
            val candidates = s.clusters.values.toList
              .filter(c => math.abs(Duration.between(c.lastUpdated, item.pubDate).toMinutes) <= config.correlationWindowMinutes)
              .map { cluster =>
                val clusterText = s"${cluster.canonicalTitle} ${cluster.summary.getOrElse("")}"
                val textSim     = TextSimilarity.compositeSimilarity(textToMatch, clusterText)
                val locOverlap  = {
                  val clusterLocs = TextSimilarity.extractLocations(clusterText)
                  if clusterLocs.isEmpty && itemLocations.isEmpty then 0.0
                  else if clusterLocs.isEmpty || itemLocations.isEmpty then 0.0
                  else (clusterLocs & itemLocations).size.toDouble / (clusterLocs | itemLocations).size.toDouble
                }
                val actorOverlap = {
                  val clusterActors = TextSimilarity.extractActors(clusterText)
                  if clusterActors.isEmpty && itemActors.isEmpty then 0.0
                  else if clusterActors.isEmpty || itemActors.isEmpty then 0.0
                  else (clusterActors & itemActors).size.toDouble / (clusterActors | itemActors).size.toDouble
                }

                val score = (textSim * 0.5) + (locOverlap * 0.3) + (actorOverlap * 0.2)
                val reasons = List.newBuilder[String]
                if textSim > 0.3 then reasons += s"text:${f"$textSim%.2f"}"
                if locOverlap > 0.0 then reasons += s"location:${(itemLocations & TextSimilarity.extractLocations(clusterText)).mkString(",")}"
                if actorOverlap > 0.0 then reasons += s"actors:${(itemActors & TextSimilarity.extractActors(clusterText)).mkString(",")}"

                (cluster, score, reasons.result())
              }
              .filter(_._2 >= config.similarityThreshold)
              .sortBy(-_._2)

            candidates.headOption match
              case Some((cluster, score, reasons)) =>
                // Merge into existing cluster
                val updated = cluster.copy(
                  lastUpdated   = Instant.now(),
                  sourceCount   = cluster.sourceCount + 1,
                  perspectives  = cluster.perspectives + source.perspective,
                  feedItemLinks = cluster.feedItemLinks :+ item.link,
                  keywords      = cluster.keywords ++ itemTokens.take(10),
                )
                val newState = s.copy(
                  clusters = s.clusters.updated(cluster.id, updated),
                  itemIndex = s.itemIndex + (item.link -> cluster.id),
                )
                (newState, CorrelationResult(cluster.id, isNew = false, confidence = score, matchedOn = reasons))

              case None =>
                // Create new cluster
                val clusterId   = UUID.randomUUID().toString.take(12)
                val severity    = inferSeverity(item, itemActors)
                val eventType   = inferEventType(item, itemActors)
                val location    = itemLocations.headOption
                val newCluster  = EventCluster(
                  id              = clusterId,
                  canonicalTitle  = item.title,
                  severity        = severity,
                  eventType       = eventType,
                  location        = location,
                  firstSeen       = item.pubDate,
                  lastUpdated     = Instant.now(),
                  sourceCount     = 1,
                  perspectives    = Set(source.perspective),
                  feedItemLinks   = List(item.link),
                  confidenceScore = 0.5,
                  threatDelta     = if severity == Severity.CRITICAL then 0.3 else if severity == Severity.HIGH then 0.15 else 0.0,
                  keywords        = itemTokens.take(15),
                  summary         = item.contentSnippet,
                )
                val newState = s.copy(
                  clusters = s.clusters + (clusterId -> newCluster),
                  itemIndex = s.itemIndex + (item.link -> clusterId),
                )
                (newState, CorrelationResult(clusterId, isNew = true, confidence = 0.5, matchedOn = List("new_cluster")))
          }
      }

    override def activeClusters: F[List[EventCluster]] =
      state.get.map(_.clusters.values.toList.sortBy(c => -c.lastUpdated.toEpochMilli))

    override def assessThreat: F[ThreatAssessment] =
      activeClusters.map { clusters =>
        val now = Instant.now()
        val escalation = if clusters.isEmpty then 0.0
          else clusters.map(_.threatDelta).sum / clusters.size

        val level = escalation match
          case e if e > 0.5  => ThreatLevel.CRITICAL
          case e if e > 0.25 => ThreatLevel.HIGH
          case e if e > 0.1  => ThreatLevel.ELEVATED
          case _             => ThreatLevel.MONITORING

        val perspectiveCounts = clusters
          .flatMap(_.perspectives)
          .groupBy(identity)
          .view.mapValues(_.size.toDouble / math.max(clusters.size, 1))
          .toMap

        val recommendation = level match
          case ThreatLevel.CRITICAL  => "IMMEDIATE: Multiple high-severity events detected across sources. Recommend full-spectrum monitoring and alert escalation."
          case ThreatLevel.HIGH      => "ELEVATED: Significant activity detected. Increase monitoring cadence and prepare situation brief."
          case ThreatLevel.ELEVATED  => "WATCH: Notable activity above baseline. Continue standard monitoring with attention to escalation indicators."
          case ThreatLevel.MONITORING => "ROUTINE: Activity within normal parameters. Standard monitoring posture."

        ThreatAssessment(
          timestamp          = now,
          overallLevel       = level,
          escalationScore    = math.max(-1.0, math.min(1.0, escalation)),
          activeClusterCount = clusters.size,
          topClusters        = clusters.sortBy(c => -c.threatDelta).take(5),
          perspectiveBias    = perspectiveCounts,
          recommendation     = recommendation,
        )
      }

    override def expireStale: F[Int] =
      state.evalModify { s =>
        Sync[F].delay {
          val cutoff = Instant.now().minus(Duration.ofHours(config.threatDecayHours))
          val (active, expired) = s.clusters.partition { case (_, c) =>
            c.lastUpdated.isAfter(cutoff)
          }
          val expiredLinks = expired.values.flatMap(_.feedItemLinks).toSet
          val newState = s.copy(
            clusters = active,
            itemIndex = s.itemIndex.filterNot { case (link, _) => expiredLinks.contains(link) },
          )
          (newState, expired.size)
        }
      }

    // ── Inference helpers ──────────────────────────────────────────

    private def inferSeverity(item: RawFeedItem, actors: Set[String]): Severity =
      val text = (item.title + " " + item.contentSnippet.getOrElse("")).toLowerCase
      val criticalPatterns = List("nuclear", "war", "invasion", "declaration of war", "massive attack", "wmd")
      val highPatterns = List("airstrike", "missile launch", "casualties", "killed", "bombing", "attack", "intercepted")

      if criticalPatterns.exists(text.contains) then Severity.CRITICAL
      else if highPatterns.exists(text.contains) then Severity.HIGH
      else Severity.STANDARD

    private def inferEventType(item: RawFeedItem, actors: Set[String]): EventType =
      val text = (item.title + " " + item.contentSnippet.getOrElse("")).toLowerCase
      if List("strike", "missile", "attack", "military", "troops", "drone", "bomb", "naval").exists(text.contains) then
        EventType.MILITARY
      else if List("negotiat", "diplomat", "summit", "treaty", "talks", "resolution").exists(text.contains) then
        EventType.DIPLOMATIC
      else if List("intelligence", "spy", "covert", "surveillance", "intercept").exists(text.contains) then
        EventType.INTELLIGENCE
      else if List("sanction", "oil", "trade", "economic", "market", "price").exists(text.contains) then
        EventType.ECONOMIC
      else if List("civilian", "humanitarian", "refugee", "aid", "evacuation", "hospital").exists(text.contains) then
        EventType.HUMANITARIAN
      else
        EventType.POLITICAL

end CorrelationEngine
