package pharos

import cats.effect.*
import cats.syntax.all.*
import munit.CatsEffectSuite
import pharos.correlation.{AnomalyDetector, CorrelationEngine}
import pharos.domain.*
import pharos.geo.GeoSpatialEngine
import pharos.network.SourceNetworkAnalyzer
import pharos.prediction.EscalationPredictor
import pharos.scoring.*
import pharos.temporal.TemporalAnalyzer

class ThreatScorerSpec extends CatsEffectSuite:

  private val defaultConfig = EngineConfig(
    correlationWindowMinutes = 120,
    similarityThreshold      = 0.35,
    feedPollIntervalSeconds  = 300,
    maxConcurrentFeeds       = 8,
    threatDecayHours         = 24,
  )

  private def makeScorer: IO[ThreatScorer[IO]] =
    for
      engine    <- CorrelationEngine.make[IO](defaultConfig)
      anomaly   <- AnomalyDetector.make[IO]()
      predictor <- EscalationPredictor.make[IO]()
      temporal  <- TemporalAnalyzer.make[IO]()
      network   <- SourceNetworkAnalyzer.make[IO]()
      geo       <- GeoSpatialEngine.make[IO]
    yield ThreatScorer.make[IO](engine, anomaly, predictor, temporal, network, geo)

  test("empty engine produces MONITORING with low composite score") {
    makeScorer.flatMap { scorer =>
      scorer.compositeThreat.map { ct =>
        assertEquals(ct.threatLevel, ThreatLevel.MONITORING)
        assert(ct.compositeScore < 0.2, s"Expected low score, got ${ct.compositeScore}")
        assert(ct.factors.nonEmpty)
      }
    }
  }

  test("composite threat has exactly 7 factors") {
    makeScorer.flatMap { scorer =>
      scorer.compositeThreat.map { ct =>
        assertEquals(ct.factors.size, 7)
        val names = ct.factors.map(_.name).toSet
        assert(names.contains("Cluster Severity"))
        assert(names.contains("Escalation Dynamics"))
        assert(names.contains("Anomaly Signals"))
        assert(names.contains("Temporal Patterns"))
        assert(names.contains("Source Risk"))
        assert(names.contains("Geographic Concentration"))
        assert(names.contains("Event Velocity"))
      }
    }
  }

  test("factor weights sum to 1.0") {
    makeScorer.flatMap { scorer =>
      scorer.compositeThreat.map { ct =>
        val totalWeight = ct.factors.map(_.weight).sum
        assertEqualsDouble(totalWeight, 1.0, 0.001)
      }
    }
  }

  test("composite score is within confidence interval") {
    makeScorer.flatMap { scorer =>
      scorer.compositeThreat.map { ct =>
        assert(ct.compositeScore >= ct.confidenceLow)
        assert(ct.compositeScore <= ct.confidenceHigh)
        assert(ct.confidenceLow >= 0.0)
        assert(ct.confidenceHigh <= 1.0)
      }
    }
  }

  test("all factor scores are 0.0 to 1.0") {
    makeScorer.flatMap { scorer =>
      scorer.compositeThreat.map { ct =>
        ct.factors.foreach { f =>
          assert(f.score >= 0.0, s"${f.name} score ${f.score} < 0")
          assert(f.score <= 1.0, s"${f.name} score ${f.score} > 1")
        }
      }
    }
  }

  test("recommendation is non-empty and matches threat level") {
    makeScorer.flatMap { scorer =>
      scorer.compositeThreat.map { ct =>
        assert(ct.recommendation.nonEmpty)
        ct.threatLevel match
          case ThreatLevel.CRITICAL   => assert(ct.recommendation.contains("IMMEDIATE"))
          case ThreatLevel.HIGH       => assert(ct.recommendation.contains("ELEVATED"))
          case ThreatLevel.ELEVATED   => assert(ct.recommendation.contains("MONITORING"))
          case ThreatLevel.MONITORING => assert(ct.recommendation.contains("ROUTINE"))
      }
    }
  }

  test("dominant factor is one of the factor names") {
    makeScorer.flatMap { scorer =>
      scorer.compositeThreat.map { ct =>
        val names = ct.factors.map(_.name).toSet
        assert(names.contains(ct.dominantFactor),
          s"Dominant factor '${ct.dominantFactor}' not in ${names}")
      }
    }
  }

  test("has valid timestamp and data counts") {
    makeScorer.flatMap { scorer =>
      scorer.compositeThreat.map { ct =>
        assert(ct.timestamp != null)
        assert(ct.clusterCount >= 0)
        assert(ct.dataPoints >= 0)
        assert(ct.confidence >= 0.0)
        assert(ct.confidence <= 1.0)
      }
    }
  }

end ThreatScorerSpec
