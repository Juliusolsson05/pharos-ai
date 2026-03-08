package pharos

import cats.effect.*
import cats.effect.unsafe.implicits.global
import munit.CatsEffectSuite
import pharos.prediction.{EscalationPoint, EscalationPredictor, EscalationTrend}
import pharos.domain.*
import java.time.Instant

class EscalationPredictorSpec extends CatsEffectSuite:

  private def point(
    intensity:    Double,
    eventType:    EventType = EventType.MILITARY,
    severity:     Severity  = Severity.STANDARD,
    location:     Option[String] = None,
    perspectives: Int = 1,
  ): EscalationPoint =
    EscalationPoint(Instant.now(), intensity, eventType, severity, location, perspectives, 1)

  test("returns insufficient forecast with < 5 data points"):
    for
      pred <- EscalationPredictor.make[IO]()
      _ <- pred.record(point(10.0))
      _ <- pred.record(point(20.0))
      f <- pred.forecast
    yield
      assertEqualsDouble(f.confidence, 0.0, 0.001)
      assertEquals(f.dataPoints, 0) // insufficient returns empty

  test("detects escalating trend"):
    for
      pred <- EscalationPredictor.make[IO]()
      // Feed escalating sequence
      _ <- (1 to 20).toList.traverse_ { i =>
        pred.record(point(i.toDouble * 3))
      }
      f <- pred.forecast
    yield
      assert(f.rateOfChange > 0, s"Rate of change should be positive: ${f.rateOfChange}")
      assert(f.dataPoints == 20)

  test("detects de-escalating trend"):
    for
      pred <- EscalationPredictor.make[IO]()
      _ <- (1 to 20).toList.traverse_ { i =>
        pred.record(point((20 - i).toDouble * 3))
      }
      f <- pred.forecast
    yield
      assert(f.rateOfChange < 0, s"Rate of change should be negative: ${f.rateOfChange}")

  test("detects military tempo surge pattern"):
    for
      pred <- EscalationPredictor.make[IO]()
      // All military events → should trigger pattern
      _ <- (1 to 30).toList.traverse_ { i =>
        pred.record(point(50.0, eventType = EventType.MILITARY, severity = Severity.HIGH))
      }
      f <- pred.forecast
    yield
      val patternNames = f.activePatterns.map(_.name)
      assert(patternNames.contains("Military Tempo Surge"),
        s"Should detect military tempo surge, got: $patternNames")

  test("forecast has valid confidence intervals"):
    for
      pred <- EscalationPredictor.make[IO]()
      _ <- (1 to 15).toList.traverse_ { i =>
        pred.record(point(30.0 + math.random() * 10))
      }
      f <- pred.forecast
    yield
      assert(f.forecast1h.confidenceInterval <= f.forecast6h.confidenceInterval,
        "CI should widen with time horizon")
      assert(f.forecast6h.confidenceInterval <= f.forecast24h.confidenceInterval,
        "CI should widen with time horizon")
      assert(f.forecast1h.low <= f.forecast1h.projected)
      assert(f.forecast1h.projected <= f.forecast1h.high)

  test("time series returns recorded points"):
    for
      pred <- EscalationPredictor.make[IO]()
      _ <- (1 to 5).toList.traverse_(i => pred.record(point(i * 10.0)))
      series <- pred.timeSeries
    yield assertEquals(series.size, 5)

end EscalationPredictorSpec
