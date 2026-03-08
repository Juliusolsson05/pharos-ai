package pharos.contradiction

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import pharos.domain.*
import pharos.correlation.TextSimilarity
import pharos.narrative.Contradiction
import java.time.{Duration, Instant}

/** Cross-source contradiction detector.
  *
  * Identifies when different sources report conflicting information
  * about the same event. Key contradiction types:
  *
  *   - Factual: contradictory claims (e.g., "strike hit target" vs "strike intercepted")
  *   - Attribution: different actors blamed (e.g., "Iran" vs "Hezbollah")
  *   - Severity: wildly different casualty/damage assessments
  *   - Outcome: opposite claims about event result
  *   - Temporal: conflicting timelines of the same event
  *
  * Uses semantic opposition detection + perspective analysis
  * to flag information conflicts that require analyst attention.
  */
trait ContradictionDetector[F[_]]:
  /** Check a cluster for internal contradictions across its sources. */
  def analyze(cluster: EventCluster, items: List[ClusterItem]): F[List[Contradiction]]

  /** Check with credibility weighting — adjusts severity by source reliability. */
  def analyzeWeighted(cluster: EventCluster, items: List[ClusterItem], credScores: Map[String, Double]): F[List[Contradiction]]

  /** Get all active contradictions. */
  def activeContradictions: F[List[Contradiction]]

  /** Record a contradiction resolution. */
  def resolve(clusterId: String): F[Unit]

object ContradictionDetector:

  /** Word pairs that indicate semantic opposition. */
  private val OppositionPairs: List[(Set[String], Set[String])] = List(
    (Set("hit", "struck", "destroyed", "damaged"), Set("missed", "intercepted", "failed", "deflected")),
    (Set("confirmed", "verified", "authenticated"), Set("denied", "rejected", "refuted", "fabricated")),
    (Set("killed", "dead", "casualties", "fatalities"), Set("survived", "safe", "unhurt", "evacuated")),
    (Set("launched", "fired", "attacked"), Set("defended", "repelled", "blocked", "intercepted")),
    (Set("advancing", "offensive", "invaded"), Set("retreating", "withdrawing", "pulled back")),
    (Set("ceasefire", "truce", "agreement"), Set("violated", "broke", "collapsed", "ended")),
    (Set("escalation", "intensified", "expanded"), Set("de-escalation", "reduced", "scaled back")),
    (Set("success", "achieved", "accomplished"), Set("failure", "failed", "unsuccessful")),
    (Set("dozens", "hundreds", "massive"), Set("few", "minor", "limited", "minimal")),
    (Set("nuclear", "enrichment", "weapons"), Set("peaceful", "civilian", "medical", "energy")),
  )

  /** Actor attribution conflicts. */
  private val ActorGroups: List[(String, Set[String])] = List(
    "IRAN"      -> Set("iran", "irgc", "tehran", "iranian"),
    "ISRAEL"    -> Set("israel", "idf", "mossad", "israeli"),
    "USA"       -> Set("united states", "us forces", "pentagon", "centcom", "american"),
    "HEZBOLLAH" -> Set("hezbollah", "hezballah"),
    "HAMAS"     -> Set("hamas"),
    "HOUTHIS"   -> Set("houthi", "ansar allah"),
    "RUSSIA"    -> Set("russia", "russian", "moscow"),
  )

  def make[F[_]: Async]: F[ContradictionDetector[F]] =
    AtomicCell[F].of(Map.empty[String, List[Contradiction]]).map(new ContradictionDetectorImpl[F](_))

  private class ContradictionDetectorImpl[F[_]: Async](
    state: AtomicCell[F, Map[String, List[Contradiction]]],
  ) extends ContradictionDetector[F]:

    override def analyze(cluster: EventCluster, items: List[ClusterItem]): F[List[Contradiction]] =
      analyzeWeighted(cluster, items, Map.empty)

    override def analyzeWeighted(
      cluster: EventCluster, items: List[ClusterItem], credScores: Map[String, Double],
    ): F[List[Contradiction]] =
      Sync[F].delay {
        if items.size < 2 then List.empty
        else
          val contradictions = List.newBuilder[Contradiction]

          // Compare all item pairs
          for
            i <- items.indices
            j <- (i + 1) until items.size
          do
            val a = items(i)
            val b = items(j)

            // Skip items from the same perspective
            if a.perspective != b.perspective then
              // Credibility weight: average of both sources (higher = more credible contradiction)
              val credA = credScores.getOrElse(a.feedId, 0.5)
              val credB = credScores.getOrElse(b.feedId, 0.5)
              val credWeight = (credA + credB) / 2.0

              // Temporal context: items close in time are more likely real contradictions
              val temporalGapHours = math.abs(Duration.between(a.timestamp, b.timestamp).toHours)
              val temporalWeight = if temporalGapHours <= 1 then 1.0      // same-hour = strongest
                else if temporalGapHours <= 6 then 0.85                   // same-day window
                else if temporalGapHours <= 24 then 0.6                   // could be evolving story
                else 0.3                                                   // old reports — may reflect updated info

              // Check factual opposition
              detectFactualContradiction(a, b, cluster.id).foreach { c =>
                contradictions += adjustSeverity(c, credWeight, temporalWeight, temporalGapHours)
              }

              // Check attribution conflicts
              detectAttributionConflict(a, b, cluster.id).foreach { c =>
                contradictions += adjustSeverity(c, credWeight, temporalWeight, temporalGapHours)
              }

              // Check severity mismatch
              detectSeverityMismatch(a, b, cluster.id).foreach { c =>
                contradictions += adjustSeverity(c, credWeight, temporalWeight, temporalGapHours)
              }

          contradictions.result()
      }.flatTap { found =>
        if found.nonEmpty then
          state.update(s => s.updated(cluster.id, found))
        else Sync[F].unit
      }

    override def activeContradictions: F[List[Contradiction]] =
      state.get.map(_.values.flatten.toList.sortBy(-_.severity))

    override def resolve(clusterId: String): F[Unit] =
      state.update(_ - clusterId)

    /** Detect when two items use semantically opposed language. */
    private def detectFactualContradiction(
      a: ClusterItem, b: ClusterItem, clusterId: String,
    ): Option[Contradiction] =
      val tokA = TextSimilarity.tokenize(a.text).toSet
      val tokB = TextSimilarity.tokenize(b.text).toSet

      val oppositions = OppositionPairs.flatMap { case (setA, setB) =>
        val aHitPositive = (tokA & setA).nonEmpty
        val aHitNegative = (tokA & setB).nonEmpty
        val bHitPositive = (tokB & setA).nonEmpty
        val bHitNegative = (tokB & setB).nonEmpty

        // Contradiction: A uses positive language, B uses negative (or vice versa)
        if (aHitPositive && bHitNegative) || (aHitNegative && bHitPositive) then
          val aWords = if aHitPositive then tokA & setA else tokA & setB
          val bWords = if bHitPositive then tokB & setA else tokB & setB
          Some((aWords, bWords))
        else None
      }

      if oppositions.nonEmpty then
        val firstOpp = oppositions.head
        Some(Contradiction(
          clusterIdA   = clusterId,
          clusterIdB   = clusterId,
          perspectiveA = a.perspective,
          perspectiveB = b.perspective,
          description  = s"Factual conflict: ${a.perspective} reports '${firstOpp._1.mkString("/")}' while ${b.perspective} reports '${firstOpp._2.mkString("/")}' — ${a.title} vs ${b.title}",
          severity     = 0.7 + oppositions.size * 0.1,
        ))
      else None

    /** Detect when items attribute an event to different actors. */
    private def detectAttributionConflict(
      a: ClusterItem, b: ClusterItem, clusterId: String,
    ): Option[Contradiction] =
      val actorsA = extractActorGroups(a.text)
      val actorsB = extractActorGroups(b.text)

      // Look for one item blaming actor X while the other blames actor Y
      val aOnly = actorsA -- actorsB
      val bOnly = actorsB -- actorsA

      if aOnly.nonEmpty && bOnly.nonEmpty then
        Some(Contradiction(
          clusterIdA   = clusterId,
          clusterIdB   = clusterId,
          perspectiveA = a.perspective,
          perspectiveB = b.perspective,
          description  = s"Attribution conflict: ${a.perspective} attributes to ${aOnly.mkString("/")} while ${b.perspective} attributes to ${bOnly.mkString("/")}",
          severity     = 0.8,
        ))
      else None

    /** Detect vastly different severity assessments. */
    private def detectSeverityMismatch(
      a: ClusterItem, b: ClusterItem, clusterId: String,
    ): Option[Contradiction] =
      val magnitudeWords = Map(
        "massive"   -> 5, "devastating" -> 5, "catastrophic" -> 5,
        "hundreds"  -> 4, "significant" -> 4, "major"        -> 4, "dozens" -> 4,
        "several"   -> 3, "multiple"    -> 3, "moderate"     -> 3,
        "limited"   -> 1, "minor"       -> 1, "small"        -> 1, "few" -> 1,
        "minimal"   -> 0, "negligible"  -> 0,
      )

      def magnitudeScore(text: String): Option[Int] =
        val lower = text.toLowerCase
        magnitudeWords.collectFirst { case (word, score) if lower.contains(word) => score }

      (magnitudeScore(a.text), magnitudeScore(b.text)) match
        case (Some(scoreA), Some(scoreB)) if (scoreA - scoreB).abs >= 3 =>
          Some(Contradiction(
            clusterIdA   = clusterId,
            clusterIdB   = clusterId,
            perspectiveA = a.perspective,
            perspectiveB = b.perspective,
            description  = s"Severity mismatch: ${a.perspective} describes as ${magnitudeLabel(scoreA)} while ${b.perspective} describes as ${magnitudeLabel(scoreB)}",
            severity     = 0.6,
          ))
        case _ => None

    private def magnitudeLabel(score: Int): String = score match
      case s if s >= 5 => "catastrophic"
      case s if s >= 4 => "major"
      case s if s >= 3 => "moderate"
      case s if s >= 1 => "minor"
      case _           => "negligible"

    private def extractActorGroups(text: String): Set[String] =
      val lower = text.toLowerCase
      ActorGroups.collect { case (group, keywords) if keywords.exists(lower.contains) => group }.toSet

    /** Adjust contradiction severity based on source credibility and temporal context.
      * High-credibility sources contradicting each other = more significant.
      * Old contradictions (>24h gap) are discounted — may reflect evolving information. */
    private def adjustSeverity(
      c: Contradiction, credWeight: Double, temporalWeight: Double, gapHours: Long,
    ): Contradiction =
      val adjusted = c.severity * credWeight * temporalWeight
      val temporal = if gapHours > 24 then s" [${gapHours}h gap — may reflect updated information]"
        else if gapHours > 6 then s" [${gapHours}h gap]"
        else ""
      val credNote = if credWeight > 0.7 then " [HIGH-CREDIBILITY SOURCES]"
        else if credWeight < 0.4 then " [LOW-CREDIBILITY — verify independently]"
        else ""
      c.copy(
        severity    = math.max(0.1, math.min(1.0, adjusted)),
        description = c.description + temporal + credNote,
      )

  end ContradictionDetectorImpl

end ContradictionDetector

// ── Input type ───────────────────────────────────────────────────

final case class ClusterItem(
  id:          String,
  feedId:      String,
  perspective: String,
  title:       String,
  text:        String,
  timestamp:   Instant,
)
