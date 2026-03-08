package pharos

import cats.effect.*
import cats.effect.unsafe.implicits.global
import munit.CatsEffectSuite
import pharos.credibility.{SourceCredibility, SourceReport}
import pharos.domain.*
import java.time.Instant

class SourceCredibilitySpec extends CatsEffectSuite:

  test("tier 1 sources score higher than tier 4"):
    for
      cred <- SourceCredibility.make[IO]
      s1   <- cred.scoreFor("reuters-world")   // guessed as tier 1
      s4   <- cred.scoreFor("presstv-iran")     // guessed as tier 4
    yield
      assert(s1.overallScore > s4.overallScore,
        s"Reuters (${s1.overallScore}) should score higher than PressTV (${s4.overallScore})")

  test("confirmation rate improves score"):
    for
      cred <- SourceCredibility.make[IO]
      // Record 10 reports, confirm 8
      _ <- (1 to 10).toList.traverse_ { i =>
        cred.recordReport(SourceReport(
          id = s"r$i", feedId = "test-feed", clusterId = s"c$i", timestamp = Instant.now(),
        ))
      }
      _ <- (1 to 8).toList.traverse_ { i =>
        cred.confirmReport(s"r$i", Set("other-feed"))
      }
      score <- cred.scoreFor("test-feed")
    yield
      assertEquals(score.totalReports, 10)
      assertEquals(score.confirmedReports, 8)
      assertEqualsDouble(score.confirmationRate, 0.8, 0.01)

  test("cluster confidence increases with perspective diversity"):
    for
      cred <- SourceCredibility.make[IO]
      single <- cred.clusterConfidence(
        List("reuters"), Set(Perspective.WESTERN))
      multi <- cred.clusterConfidence(
        List("reuters", "presstv", "aljazeera-net"),
        Set(Perspective.WESTERN, Perspective.IRANIAN, Perspective.ARAB))
    yield
      assert(multi > single,
        s"Multi-perspective ($multi) should score higher than single ($single)")

  test("all scores are ranked by overall score"):
    for
      cred <- SourceCredibility.make[IO]
      _ <- cred.recordReport(SourceReport("r1", "reuters-top", "c1", Instant.now()))
      _ <- cred.recordReport(SourceReport("r2", "bbc-world", "c2", Instant.now()))
      _ <- cred.recordReport(SourceReport("r3", "presstv-iran", "c3", Instant.now()))
      scores <- cred.allScores
    yield
      assert(scores.size == 3)
      // Scores should be in descending order
      val values = scores.map(_.overallScore)
      assert(values == values.sorted.reverse, s"Scores not sorted: $values")

end SourceCredibilitySpec
