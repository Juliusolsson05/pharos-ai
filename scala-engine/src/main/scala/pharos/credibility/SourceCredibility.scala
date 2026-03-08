package pharos.credibility

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import pharos.domain.*
import java.time.{Duration, Instant}

/** Source credibility scoring system.
  *
  * Computes a dynamic credibility score for each feed source based on:
  *   - Base tier (wire services > major outlets > regional > state media)
  *   - State funding penalty
  *   - Perspective diversity of corroborating sources
  *   - Historical accuracy (did other sources confirm the report?)
  *   - Timeliness (first-to-report bonus, but penalized if unconfirmed)
  *   - Retraction rate (sources that frequently report unconfirmed stories)
  *
  * Scores are 0.0–1.0 and used to weight event cluster confidence.
  */
trait SourceCredibility[F[_]]:
  /** Record a report and its eventual outcome. */
  def recordReport(report: SourceReport): F[Unit]

  /** Mark a report as confirmed by other sources. */
  def confirmReport(reportId: String, confirmedBy: Set[String]): F[Unit]

  /** Get credibility score for a feed source. */
  def scoreFor(feedId: String): F[CredibilityScore]

  /** Get all credibility scores, ranked. */
  def allScores: F[List[CredibilityScore]]

  /** Compute weighted confidence for a cluster given its sources. */
  def clusterConfidence(feedIds: List[String], perspectives: Set[Perspective]): F[Double]

object SourceCredibility:

  /** Base credibility by tier (1=highest). */
  private val TierBase: Map[Int, Double] = Map(
    1 -> 0.90,  // Wire services: Reuters, AP
    2 -> 0.75,  // Major global: BBC, NYT, Al Jazeera
    3 -> 0.60,  // Regional/specialist: ToI, JPost, FP
    4 -> 0.40,  // State media/niche: Press TV, RT, TASS
  )

  /** State-funded media penalty. */
  private val StateFundedPenalty = 0.15

  /** Bonus for perspective diversity in corroboration. */
  private val DiversityBonus = 0.05

  def make[F[_]: Async]: F[SourceCredibility[F]] =
    AtomicCell[F].of(CredState.empty).map(new SourceCredibilityImpl[F](_))

  private case class CredState(
    reports:     Map[String, SourceReport],                 // reportId -> report
    feedHistory: Map[String, FeedHistory],                  // feedId -> history
  ):
    def addReport(r: SourceReport): CredState =
      val history = feedHistory.getOrElse(r.feedId, FeedHistory.empty)
      copy(
        reports     = reports + (r.id -> r),
        feedHistory = feedHistory.updated(r.feedId, history.addReport(r)),
      )

    def confirm(reportId: String, confirmedBy: Set[String]): CredState =
      reports.get(reportId) match
        case None => this
        case Some(report) =>
          val updated = report.copy(confirmed = true, confirmedByFeeds = confirmedBy)
          val history = feedHistory.getOrElse(report.feedId, FeedHistory.empty)
          copy(
            reports     = reports.updated(reportId, updated),
            feedHistory = feedHistory.updated(report.feedId, history.confirmOne),
          )

  private object CredState:
    val empty: CredState = CredState(Map.empty, Map.empty)

  private case class FeedHistory(
    totalReports:     Int,
    confirmedReports: Int,
    firstReports:     Int,  // times this source was first to report
    recentReports:    Int,  // reports in last 24h
  ):
    def addReport(r: SourceReport): FeedHistory =
      copy(totalReports = totalReports + 1, recentReports = recentReports + 1)
    def confirmOne: FeedHistory =
      copy(confirmedReports = confirmedReports + 1)
    def confirmationRate: Double =
      if totalReports == 0 then 0.5 else confirmedReports.toDouble / totalReports

  private object FeedHistory:
    val empty: FeedHistory = FeedHistory(0, 0, 0, 0)

  private class SourceCredibilityImpl[F[_]: Async](
    state: AtomicCell[F, CredState],
  ) extends SourceCredibility[F]:

    override def recordReport(report: SourceReport): F[Unit] =
      state.update(_.addReport(report))

    override def confirmReport(reportId: String, confirmedBy: Set[String]): F[Unit] =
      state.update(_.confirm(reportId, confirmedBy))

    override def scoreFor(feedId: String): F[CredibilityScore] =
      state.get.map { s =>
        computeScore(feedId, s.feedHistory.getOrElse(feedId, FeedHistory.empty), None)
      }

    override def allScores: F[List[CredibilityScore]] =
      state.get.map { s =>
        s.feedHistory.toList.map { case (feedId, history) =>
          computeScore(feedId, history, None)
        }.sortBy(-_.overallScore)
      }

    override def clusterConfidence(feedIds: List[String], perspectives: Set[Perspective]): F[Double] =
      state.get.map { s =>
        if feedIds.isEmpty then 0.5
        else
          val scores = feedIds.map { fid =>
            val history = s.feedHistory.getOrElse(fid, FeedHistory.empty)
            computeScore(fid, history, None).overallScore
          }

          // Weighted average with diversity bonus
          val avgScore       = scores.sum / scores.size
          val diversityBonus = math.min(perspectives.size * DiversityBonus, 0.2)
          val multiSource    = if feedIds.size >= 3 then 0.1 else if feedIds.size >= 2 then 0.05 else 0.0

          math.min(1.0, avgScore + diversityBonus + multiSource)
      }

    private def computeScore(
      feedId: String, history: FeedHistory, source: Option[FeedSource],
    ): CredibilityScore =
      val tier         = source.map(_.tier).getOrElse(guesssTier(feedId))
      val baseScore    = TierBase.getOrElse(tier, 0.50)
      val stateFunded  = source.exists(_.stateFunded)
      val sfPenalty    = if stateFunded then StateFundedPenalty else 0.0
      val confirmRate  = history.confirmationRate
      val accuracyAdj  = (confirmRate - 0.5) * 0.2 // ±0.1 adjustment

      val overall = math.max(0.1, math.min(1.0, baseScore - sfPenalty + accuracyAdj))

      CredibilityScore(
        feedId           = feedId,
        overallScore     = overall,
        tierScore        = baseScore,
        stateFunded      = stateFunded,
        confirmationRate = confirmRate,
        totalReports     = history.totalReports,
        confirmedReports = history.confirmedReports,
        tier             = tier,
      )

    /** Heuristic tier guess from feedId patterns when source metadata unavailable. */
    private def guesssTier(feedId: String): Int =
      val id = feedId.toLowerCase
      if List("reuters", "ap-", "afp").exists(id.contains) then 1
      else if List("bbc", "nyt", "cnn", "aljazeera", "guardian").exists(id.contains) then 2
      else if List("presstv", "rt-", "tass", "xinhua", "sputnik", "mehr").exists(id.contains) then 4
      else 3

  end SourceCredibilityImpl

end SourceCredibility

// ── Domain types ─────────────────────────────────────────────────

final case class SourceReport(
  id:               String,
  feedId:           String,
  clusterId:        String,
  timestamp:        Instant,
  confirmed:        Boolean = false,
  confirmedByFeeds: Set[String] = Set.empty,
)

final case class CredibilityScore(
  feedId:           String,
  overallScore:     Double,
  tierScore:        Double,
  stateFunded:      Boolean,
  confirmationRate: Double,
  totalReports:     Int,
  confirmedReports: Int,
  tier:             Int,
)
