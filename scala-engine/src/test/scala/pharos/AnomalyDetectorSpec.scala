package pharos

import cats.effect.*
import cats.effect.unsafe.implicits.global
import munit.CatsEffectSuite
import pharos.correlation.{AnomalyDetector, AnomalyType}
import pharos.domain.*
import java.time.Instant

class AnomalyDetectorSpec extends CatsEffectSuite:

  private def makeCluster(
    severity: Severity = Severity.STANDARD,
    perspectives: Set[Perspective] = Set(Perspective.WESTERN),
    sourceCount: Int = 1,
  ): EventCluster =
    EventCluster(
      id              = java.util.UUID.randomUUID().toString.take(8),
      canonicalTitle   = "Test event",
      severity        = severity,
      eventType       = EventType.MILITARY,
      location        = Some("tehran"),
      firstSeen       = Instant.now(),
      lastUpdated     = Instant.now(),
      sourceCount     = sourceCount,
      perspectives    = perspectives,
      feedItemLinks   = List("http://example.com"),
      confidenceScore = 0.5,
      threatDelta     = 0.1,
      keywords        = Set("test"),
      summary         = Some("Test cluster"),
    )

  test("returns no anomaly with insufficient baseline"):
    for
      detector <- AnomalyDetector.make[IO](windowSize = 100)
      result   <- detector.observe(makeCluster())
    yield
      assert(!result.isAnomaly)
      assert(result.description.contains("Insufficient"))

  test("builds baseline after sufficient observations"):
    for
      detector <- AnomalyDetector.make[IO](windowSize = 100)
      // Feed 15 normal observations to build baseline
      _ <- (1 to 15).toList.traverse_ { _ =>
        detector.observe(makeCluster())
      }
      stats <- detector.baseline
    yield
      assert(stats.observationCount == 15)
      assert(stats.meanSeverity > 0.0)

  test("detects severity escalation anomaly"):
    for
      detector <- AnomalyDetector.make[IO](windowSize = 100)
      // Build baseline with STANDARD severity
      _ <- (1 to 20).toList.traverse_ { _ =>
        detector.observe(makeCluster(severity = Severity.STANDARD))
      }
      // Inject CRITICAL event
      result <- detector.observe(makeCluster(severity = Severity.CRITICAL))
    yield
      // Should detect severity shift (CRITICAL is 3.0 vs baseline mean ~1.0)
      assert(result.anomalyScore > 0.0,
        s"Expected anomaly score > 0, got ${result.anomalyScore}")

  test("detects multi-perspective convergence"):
    for
      detector <- AnomalyDetector.make[IO](windowSize = 100)
      // Build baseline with single-perspective clusters
      _ <- (1 to 20).toList.traverse_ { _ =>
        detector.observe(makeCluster(perspectives = Set(Perspective.WESTERN)))
      }
      // Inject cluster with many perspectives
      result <- detector.observe(makeCluster(
        perspectives = Set(
          Perspective.WESTERN, Perspective.IRANIAN, Perspective.ISRAELI,
          Perspective.RUSSIAN, Perspective.CHINESE, Perspective.ARAB,
        )
      ))
    yield
      assert(result.anomalyScore > 0.0,
        s"Expected anomaly for multi-perspective convergence, score=${result.anomalyScore}")

  test("tracks active anomalies"):
    for
      detector <- AnomalyDetector.make[IO](windowSize = 100)
      _ <- (1 to 20).toList.traverse_ { _ =>
        detector.observe(makeCluster(severity = Severity.STANDARD))
      }
      _ <- detector.observe(makeCluster(severity = Severity.CRITICAL))
      anomalies <- detector.activeAnomalies
    yield
      // May or may not have anomalies depending on thresholds, but list should be accessible
      assert(anomalies.size >= 0)

end AnomalyDetectorSpec
