package pharos.chain

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import pharos.domain.*
import pharos.correlation.TextSimilarity
import java.time.{Duration, Instant}

/** Causal event chain analyzer.
  *
  * Reconstructs temporal-causal chains of events by identifying
  * action→reaction patterns in the conflict timeline:
  *
  *   - Strike → Retaliation chains
  *   - Diplomatic action → Military response
  *   - Intelligence report → Preemptive action
  *   - Economic action → Political response
  *
  * Uses temporal proximity, actor relationships, and semantic
  * causality signals to build directed acyclic graphs (DAGs)
  * of event causation.
  */
trait EventChainAnalyzer[F[_]]:
  /** Record an event for chain analysis. */
  def recordEvent(event: ChainEvent): F[Unit]

  /** Detect causal chains in the recorded event history. */
  def detectChains: F[List[EventChain]]

  /** Get chains involving a specific event. */
  def chainsFor(eventId: String): F[List[EventChain]]

  /** Get the full event graph. */
  def eventGraph: F[EventGraph]

object EventChainAnalyzer:

  /** Maximum time gap between cause and effect (hours). */
  private val MaxCausalGapHours = 48

  /** Causal relationship patterns: (cause type, effect type, keywords). */
  private val CausalPatterns: List[CausalPattern] = List(
    CausalPattern(EventType.MILITARY,    EventType.MILITARY,    "retaliation", Set("retaliat", "response", "counter", "revenge", "reprisal")),
    CausalPattern(EventType.MILITARY,    EventType.DIPLOMATIC,  "condemnation", Set("condemn", "denounce", "protest", "emergency session", "resolution")),
    CausalPattern(EventType.DIPLOMATIC,  EventType.MILITARY,    "breakdown",    Set("collapse", "failed", "broke down", "withdrew", "escalat")),
    CausalPattern(EventType.INTELLIGENCE, EventType.MILITARY,   "preemption",   Set("preemptive", "intelligence", "discovered", "detected", "uncovered")),
    CausalPattern(EventType.MILITARY,    EventType.HUMANITARIAN, "consequence", Set("civilian", "casualt", "refugee", "displacement", "humanitarian")),
    CausalPattern(EventType.ECONOMIC,    EventType.POLITICAL,   "pressure",     Set("sanction", "embargo", "pressure", "demand", "ultimatum")),
    CausalPattern(EventType.MILITARY,    EventType.ECONOMIC,    "impact",       Set("oil", "market", "price", "supply", "shipping", "trade")),
    CausalPattern(EventType.POLITICAL,   EventType.MILITARY,    "authorization", Set("authorized", "approved", "ordered", "declared", "mobiliz")),
  )

  def make[F[_]: Async](maxEvents: Int = 1000): F[EventChainAnalyzer[F]] =
    AtomicCell[F].of(AnalyzerState.empty(maxEvents)).map(new EventChainAnalyzerImpl[F](_))

  private case class AnalyzerState(
    events:    Vector[ChainEvent],
    maxEvents: Int,
  ):
    def add(e: ChainEvent): AnalyzerState =
      val updated = if events.size >= maxEvents then events.tail :+ e else events :+ e
      copy(events = updated)

  private object AnalyzerState:
    def empty(max: Int): AnalyzerState = AnalyzerState(Vector.empty, max)

  private class EventChainAnalyzerImpl[F[_]: Async](
    state: AtomicCell[F, AnalyzerState],
  ) extends EventChainAnalyzer[F]:

    override def recordEvent(event: ChainEvent): F[Unit] =
      state.update(_.add(event))

    override def detectChains: F[List[EventChain]] =
      state.get.map { s =>
        if s.events.size < 2 then List.empty
        else
          val sorted = s.events.sortBy(_.timestamp)
          val chains = List.newBuilder[EventChain]

          for
            i <- sorted.indices
            j <- (i + 1) until math.min(i + 20, sorted.size) // look ahead up to 20 events
          do
            val cause  = sorted(i)
            val effect = sorted(j)
            val gap    = Duration.between(cause.timestamp, effect.timestamp).toHours

            if gap <= MaxCausalGapHours && gap > 0 then
              findCausalLink(cause, effect).foreach { link =>
                chains += EventChain(
                  id           = s"chain-${cause.id}-${effect.id}",
                  causeEvent   = cause,
                  effectEvent  = effect,
                  linkType     = link.patternName,
                  confidence   = link.confidence,
                  temporalGap  = gap,
                  description  = link.description,
                )
              }

          // Deduplicate and rank
          chains.result()
            .groupBy(c => (c.causeEvent.id, c.effectEvent.id))
            .values
            .map(_.maxBy(_.confidence))
            .toList
            .sortBy(c => (-c.confidence, c.temporalGap))
            .take(50)
      }

    override def chainsFor(eventId: String): F[List[EventChain]] =
      detectChains.map(_.filter(c =>
        c.causeEvent.id == eventId || c.effectEvent.id == eventId
      ))

    override def eventGraph: F[EventGraph] =
      for
        chains <- detectChains
        events <- state.get.map(_.events.toList)
      yield
        val nodes = events.map(e => GraphNode(e.id, e.title, e.eventType, e.severity, e.timestamp))
        val edges = chains.map(c => GraphEdge(c.causeEvent.id, c.effectEvent.id, c.linkType, c.confidence))

        // Find root causes (nodes with outgoing but no incoming edges)
        val withIncoming = edges.map(_.targetId).toSet
        val withOutgoing = edges.map(_.sourceId).toSet
        val rootCauses   = (withOutgoing -- withIncoming).toList

        // Find terminal effects (nodes with incoming but no outgoing)
        val terminalEffects = (withIncoming -- withOutgoing).toList

        // Find longest chain
        val longestChain = findLongestChain(edges)

        EventGraph(
          nodes           = nodes,
          edges           = edges,
          rootCauses      = rootCauses,
          terminalEffects = terminalEffects,
          longestChainLen = longestChain,
          totalChains     = chains.size,
        )

    /** Find causal link between two events using pattern matching. */
    private def findCausalLink(cause: ChainEvent, effect: ChainEvent): Option[CausalLink] =
      // Find matching causal patterns
      val matchingPatterns = CausalPatterns.filter { p =>
        p.causeType == cause.eventType && p.effectType == effect.eventType
      }

      if matchingPatterns.isEmpty then None
      else
        val effectText = (effect.title + " " + effect.summary.getOrElse("")).toLowerCase

        val bestMatch = matchingPatterns.flatMap { pattern =>
          val keywordHits = pattern.keywords.count(effectText.contains)
          if keywordHits > 0 then
            // Check for actor relationship (e.g., Iran strikes → Israel retaliates)
            val causeActors  = TextSimilarity.extractActors(cause.title + " " + cause.summary.getOrElse(""))
            val effectActors = TextSimilarity.extractActors(effect.title + " " + effect.summary.getOrElse(""))
            val actorOverlap = (causeActors & effectActors).nonEmpty || causeActors.nonEmpty && effectActors.nonEmpty

            // Check for location correlation
            val causeLocs  = TextSimilarity.extractLocations(cause.title + " " + cause.summary.getOrElse(""))
            val effectLocs = TextSimilarity.extractLocations(effect.title + " " + effect.summary.getOrElse(""))
            val locOverlap = (causeLocs & effectLocs).nonEmpty

            val confidence =
              0.3 +                                              // base for pattern match
              (keywordHits.toDouble / pattern.keywords.size * 0.3) + // keyword coverage
              (if actorOverlap then 0.2 else 0.0) +              // actor linkage
              (if locOverlap then 0.2 else 0.0)                  // geographic linkage

            val desc = s"${pattern.patternName}: '${cause.title}' → '${effect.title}'" +
              (if actorOverlap then s" (actors: ${(causeActors ++ effectActors).mkString(", ")})" else "") +
              (if locOverlap then s" (locations: ${(causeLocs & effectLocs).mkString(", ")})" else "")

            Some(CausalLink(pattern.patternName, math.min(1.0, confidence), desc))
          else None
        }.sortBy(-_.confidence)

        bestMatch.headOption

    /** Find the longest chain using simple BFS. */
    private def findLongestChain(edges: List[GraphEdge]): Int =
      if edges.isEmpty then 0
      else
        val adj = edges.groupBy(_.sourceId).view.mapValues(_.map(_.targetId)).toMap
        var maxLen = 0

        def dfs(node: String, depth: Int, visited: Set[String]): Unit =
          maxLen = math.max(maxLen, depth)
          adj.getOrElse(node, Nil).foreach { next =>
            if !visited.contains(next) then
              dfs(next, depth + 1, visited + next)
          }

        val sources = edges.map(_.sourceId).distinct
        sources.foreach(s => dfs(s, 1, Set(s)))
        maxLen

  end EventChainAnalyzerImpl

  private case class CausalPattern(
    causeType:   EventType,
    effectType:  EventType,
    patternName: String,
    keywords:    Set[String],
  )

  private case class CausalLink(
    patternName: String,
    confidence:  Double,
    description: String,
  )

end EventChainAnalyzer

// ── Domain types ─────────────────────────────────────────────────

final case class ChainEvent(
  id:        String,
  title:     String,
  eventType: EventType,
  severity:  Severity,
  timestamp: Instant,
  location:  Option[String],
  actors:    Set[String],
  summary:   Option[String],
)

final case class EventChain(
  id:          String,
  causeEvent:  ChainEvent,
  effectEvent: ChainEvent,
  linkType:    String,
  confidence:  Double,
  temporalGap: Long,    // hours
  description: String,
)

final case class GraphNode(
  id:        String,
  title:     String,
  eventType: EventType,
  severity:  Severity,
  timestamp: Instant,
)

final case class GraphEdge(
  sourceId:   String,
  targetId:   String,
  linkType:   String,
  confidence: Double,
)

final case class EventGraph(
  nodes:           List[GraphNode],
  edges:           List[GraphEdge],
  rootCauses:      List[String],
  terminalEffects: List[String],
  longestChainLen: Int,
  totalChains:     Int,
)
