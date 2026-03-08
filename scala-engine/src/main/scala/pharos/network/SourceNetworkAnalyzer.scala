package pharos.network

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import pharos.domain.*
import java.time.{Duration, Instant}

/** Source network analysis for OSINT intelligence.
  *
  * Maps relationships between intelligence sources to detect:
  *   - Co-reporting patterns (sources that frequently cover the same events)
  *   - Echo chambers (sources that only confirm each other, never disagree)
  *   - Independent confirmation (diverse perspectives covering the same event)
  *   - Amplification chains (one source breaks, others follow in sequence)
  *   - Coverage gaps (event types or regions with single-source coverage)
  *
  * This is critical for OSINT because a story confirmed by 5 sources from
  * the same echo chamber is worth less than 2 genuinely independent confirmations.
  */
trait SourceNetworkAnalyzer[F[_]]:
  /** Record that a source reported on a cluster. */
  def recordCoverage(feedId: String, perspective: Perspective, clusterId: String, timestamp: Instant): F[Unit]

  /** Get the full source network graph. */
  def networkGraph: F[SourceNetwork]

  /** Detect echo chambers — groups of sources with high co-reporting and low diversity. */
  def detectEchoChambers: F[List[EchoChamber]]

  /** Get coverage analysis — which event types or regions have thin sourcing. */
  def coverageAnalysis: F[CoverageReport]

  /** Get the co-reporting matrix — how often each pair of sources covers the same events. */
  def coReportingPairs: F[List[SourcePair]]

object SourceNetworkAnalyzer:

  def make[F[_]: Async](maxRecords: Int = 5000): F[SourceNetworkAnalyzer[F]] =
    AtomicCell[F].of(NetworkState.empty(maxRecords)).map(new Impl[F](_))

  private case class CoverageRecord(
    feedId:      String,
    perspective: Perspective,
    clusterId:   String,
    timestamp:   Instant,
  )

  private case class NetworkState(
    records:    Vector[CoverageRecord],
    maxRecords: Int,
  ):
    def add(r: CoverageRecord): NetworkState =
      val updated = if records.size >= maxRecords then records.tail :+ r else records :+ r
      copy(records = updated)

  private object NetworkState:
    def empty(max: Int): NetworkState = NetworkState(Vector.empty, max)

  private class Impl[F[_]: Async](state: AtomicCell[F, NetworkState]) extends SourceNetworkAnalyzer[F]:

    override def recordCoverage(feedId: String, perspective: Perspective, clusterId: String, timestamp: Instant): F[Unit] =
      state.update(_.add(CoverageRecord(feedId, perspective, clusterId, timestamp)))

    override def networkGraph: F[SourceNetwork] =
      state.get.map { s =>
        if s.records.isEmpty then SourceNetwork.empty
        else
          val byFeed = s.records.groupBy(_.feedId)
          val nodes = byFeed.map { case (feedId, recs) =>
            val perspectives = recs.map(_.perspective).toSet
            val clusters = recs.map(_.clusterId).toSet
            val span = if recs.size > 1 then
              val sorted = recs.sortBy(_.timestamp)
              math.abs(Duration.between(sorted.head.timestamp, sorted.last.timestamp).toHours).toDouble
            else 0.0

            SourceNode(
              feedId          = feedId,
              perspectives    = perspectives,
              totalReports    = recs.size,
              uniqueClusters  = clusters.size,
              activeHours     = span,
              avgResponseTime = computeAvgResponseTime(feedId, s.records),
            )
          }.toList.sortBy(-_.totalReports)

          // Build edges from co-reporting
          val pairs = coReportingMatrix(s.records)
          val edges = pairs.filter(_.coReportCount >= 2).map { pair =>
            SourceEdge(
              sourceA       = pair.feedIdA,
              sourceB       = pair.feedIdB,
              weight        = pair.jaccardSimilarity,
              coReportCount = pair.coReportCount,
              relationship  = classifyRelationship(pair),
            )
          }

          SourceNetwork(
            nodes          = nodes,
            edges          = edges,
            totalSources   = nodes.size,
            totalClusters  = s.records.map(_.clusterId).toSet.size,
            avgSourcesPerCluster = if s.records.isEmpty then 0.0 else
              s.records.groupBy(_.clusterId).values.map(_.map(_.feedId).toSet.size.toDouble).sum /
              s.records.map(_.clusterId).toSet.size,
          )
      }

    override def detectEchoChambers: F[List[EchoChamber]] =
      state.get.map { s =>
        if s.records.size < 20 then List.empty
        else
          // Group by perspective first
          val byPerspective = s.records.groupBy(_.perspective)

          byPerspective.toList.flatMap { case (perspective, recs) =>
            val feeds = recs.groupBy(_.feedId)
            if feeds.size < 2 then None
            else
              // Check if these feeds form an echo chamber:
              // high overlap in cluster coverage + same perspective
              val feedIds = feeds.keys.toList
              val clusterSets = feeds.view.mapValues(_.map(_.clusterId).toSet).toMap

              // Average Jaccard similarity among feeds in this perspective
              val pairs = for
                i <- feedIds.indices
                j <- (i + 1) until feedIds.size
              yield
                val setA = clusterSets(feedIds(i))
                val setB = clusterSets(feedIds(j))
                val intersection = setA.intersect(setB).size.toDouble
                val union = setA.union(setB).size.toDouble
                if union > 0 then intersection / union else 0.0

              val avgSimilarity = if pairs.isEmpty then 0.0 else pairs.sum / pairs.size

              // Echo chamber: high similarity within perspective group
              if avgSimilarity > 0.4 && feedIds.size >= 2 then
                Some(EchoChamber(
                  perspective    = perspective,
                  feedIds        = feedIds,
                  avgSimilarity  = avgSimilarity,
                  sharedClusters = clusterSets.values.reduce(_ intersect _).size,
                  totalClusters  = clusterSets.values.reduce(_ union _).size,
                  riskLevel      = if avgSimilarity > 0.7 then "HIGH" else "MEDIUM",
                  description    = f"${feedIds.size} sources from ${perspective} perspective share ${avgSimilarity * 100}%.0f%% cluster overlap — treat as correlated, not independent",
                ))
              else None
          }.sortBy(-_.avgSimilarity)
      }

    override def coverageAnalysis: F[CoverageReport] =
      state.get.map { s =>
        if s.records.isEmpty then CoverageReport.empty
        else
          val byClusters = s.records.groupBy(_.clusterId)

          // Single-source clusters (thin coverage)
          val singleSource = byClusters.filter(_._2.map(_.feedId).toSet.size == 1)
          val singlePerspective = byClusters.filter(_._2.map(_.perspective).toSet.size == 1)

          // Perspective coverage across all clusters
          val perspectiveCoverage = Perspective.values.map { p =>
            val coveredClusters = byClusters.count(_._2.exists(_.perspective == p))
            p -> (coveredClusters.toDouble / math.max(byClusters.size, 1))
          }.toMap

          // Find the weakest perspectives (coverage gaps)
          val gaps = perspectiveCoverage.toList
            .filter(_._2 < 0.1) // Less than 10% coverage
            .sortBy(_._2)
            .map { case (p, ratio) =>
              CoverageGap(
                perspective = p,
                coverageRatio = ratio,
                description = f"${p} perspective covers only ${ratio * 100}%.0f%% of clusters — potential blind spot",
              )
            }

          // Independence score: what fraction of clusters have 2+ perspectives?
          val multiPerspective = byClusters.count(_._2.map(_.perspective).toSet.size >= 2)
          val independenceScore = multiPerspective.toDouble / math.max(byClusters.size, 1)

          CoverageReport(
            totalClusters         = byClusters.size,
            singleSourceClusters  = singleSource.size,
            singlePerspectiveClusters = singlePerspective.size,
            multiPerspectiveClusters  = multiPerspective,
            independenceScore     = independenceScore,
            perspectiveCoverage   = perspectiveCoverage,
            coverageGaps          = gaps,
            singleSourceRatio     = singleSource.size.toDouble / math.max(byClusters.size, 1),
          )
      }

    override def coReportingPairs: F[List[SourcePair]] =
      state.get.map(s => coReportingMatrix(s.records).sortBy(-_.jaccardSimilarity).take(30))

    // ── Private helpers ────────────────────────────────────────────

    private def coReportingMatrix(records: Vector[CoverageRecord]): List[SourcePair] =
      val byFeed = records.groupBy(_.feedId).view.mapValues(_.map(_.clusterId).toSet).toMap
      val feedIds = byFeed.keys.toList

      (for
        i <- feedIds.indices
        j <- (i + 1) until feedIds.size
      yield
        val a = feedIds(i)
        val b = feedIds(j)
        val setA = byFeed(a)
        val setB = byFeed(b)
        val intersection = setA.intersect(setB)
        val union = setA.union(setB)
        val jaccard = if union.nonEmpty then intersection.size.toDouble / union.size else 0.0
        SourcePair(
          feedIdA          = a,
          feedIdB          = b,
          coReportCount    = intersection.size,
          totalA           = setA.size,
          totalB           = setB.size,
          jaccardSimilarity = jaccard,
        )
      ).toList.filter(_.coReportCount > 0)

    private def computeAvgResponseTime(feedId: String, records: Vector[CoverageRecord]): Double =
      val byCluster = records.groupBy(_.clusterId)
      val feedRecords = records.filter(_.feedId == feedId)

      if feedRecords.isEmpty then 0.0
      else
        val delays = feedRecords.flatMap { rec =>
          byCluster.get(rec.clusterId).flatMap { clusterRecs =>
            val earliest = clusterRecs.minBy(_.timestamp).timestamp
            val delay = math.abs(Duration.between(earliest, rec.timestamp).toMinutes).toDouble
            if delay > 0 then Some(delay) else None
          }
        }
        if delays.isEmpty then 0.0 else delays.sum / delays.size

    private def classifyRelationship(pair: SourcePair): String =
      if pair.jaccardSimilarity > 0.7 then "ECHO"       // very high overlap — likely same news cycle
      else if pair.jaccardSimilarity > 0.4 then "CORRELATED" // moderate overlap
      else if pair.jaccardSimilarity > 0.1 then "RELATED"    // some overlap
      else "INDEPENDENT"

  end Impl

end SourceNetworkAnalyzer

// ── Public types ──────────────────────────────────────────────────

final case class SourceNode(
  feedId:          String,
  perspectives:    Set[Perspective],
  totalReports:    Int,
  uniqueClusters:  Int,
  activeHours:     Double,
  avgResponseTime: Double,  // minutes after first report
)

final case class SourceEdge(
  sourceA:       String,
  sourceB:       String,
  weight:        Double,  // Jaccard similarity 0-1
  coReportCount: Int,
  relationship:  String,  // ECHO, CORRELATED, RELATED, INDEPENDENT
)

final case class SourceNetwork(
  nodes:                List[SourceNode],
  edges:                List[SourceEdge],
  totalSources:         Int,
  totalClusters:        Int,
  avgSourcesPerCluster: Double,
)

object SourceNetwork:
  val empty: SourceNetwork = SourceNetwork(List.empty, List.empty, 0, 0, 0.0)

final case class EchoChamber(
  perspective:    Perspective,
  feedIds:        List[String],
  avgSimilarity:  Double,
  sharedClusters: Int,
  totalClusters:  Int,
  riskLevel:      String,
  description:    String,
)

final case class CoverageGap(
  perspective:   Perspective,
  coverageRatio: Double,
  description:   String,
)

final case class CoverageReport(
  totalClusters:             Int,
  singleSourceClusters:      Int,
  singlePerspectiveClusters: Int,
  multiPerspectiveClusters:  Int,
  independenceScore:         Double,  // 0-1, fraction with 2+ perspectives
  perspectiveCoverage:       Map[Perspective, Double],
  coverageGaps:              List[CoverageGap],
  singleSourceRatio:         Double,
)

object CoverageReport:
  val empty: CoverageReport = CoverageReport(0, 0, 0, 0, 0.0, Map.empty, List.empty, 0.0)

final case class SourcePair(
  feedIdA:           String,
  feedIdB:           String,
  coReportCount:     Int,
  totalA:            Int,
  totalB:            Int,
  jaccardSimilarity: Double,
)
