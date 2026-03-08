package pharos

import cats.effect.*
import munit.CatsEffectSuite
import pharos.contradiction.{ClusterItem, ContradictionDetector}
import pharos.domain.*
import java.time.Instant
import java.time.temporal.ChronoUnit

class ContradictionDetectorSpec extends CatsEffectSuite:

  private val cluster = EventCluster(
    "c1", "Strike on military base", Severity.HIGH, EventType.MILITARY,
    Some("negev"), Instant.now(), Instant.now(), 2, Set(Perspective.WESTERN, Perspective.IRANIAN),
    List.empty, 0.7, 0.2, Set.empty, None,
  )

  test("detects factual contradiction between sources"):
    for
      detector <- ContradictionDetector.make[IO]
      items = List(
        ClusterItem("i1", "reuters", "WESTERN", "Missile strike hit target",
          "Iranian missiles struck and destroyed the military installation", Instant.now()),
        ClusterItem("i2", "presstv", "IRANIAN", "Missile intercepted",
          "Israeli defense systems intercepted and deflected the incoming missiles", Instant.now()),
      )
      contradictions <- detector.analyze(cluster, items)
    yield
      assert(contradictions.nonEmpty, "Should detect factual contradiction")
      assert(contradictions.exists(_.description.contains("Factual conflict")))

  test("detects attribution conflict"):
    for
      detector <- ContradictionDetector.make[IO]
      items = List(
        ClusterItem("i1", "reuters", "WESTERN", "Iran launches strike",
          "Iranian IRGC forces launched the attack from Tehran", Instant.now()),
        ClusterItem("i2", "aljazeera", "ARAB", "Hezbollah launches strike",
          "Hezbollah forces claimed responsibility for the attack from Lebanon", Instant.now()),
      )
      contradictions <- detector.analyze(cluster, items)
    yield
      assert(contradictions.exists(_.description.contains("Attribution conflict")),
        s"Should detect attribution conflict, got: ${contradictions.map(_.description)}")

  test("detects severity mismatch"):
    for
      detector <- ContradictionDetector.make[IO]
      items = List(
        ClusterItem("i1", "reuters", "WESTERN", "Massive destruction",
          "Devastating attack caused massive casualties and catastrophic damage", Instant.now()),
        ClusterItem("i2", "presstv", "IRANIAN", "Limited damage",
          "Minor and limited damage reported with minimal impact", Instant.now()),
      )
      contradictions <- detector.analyze(cluster, items)
    yield
      assert(contradictions.exists(_.description.contains("Severity mismatch")))

  test("no contradictions for same-perspective items"):
    for
      detector <- ContradictionDetector.make[IO]
      items = List(
        ClusterItem("i1", "reuters", "WESTERN", "Strike hits base",
          "Missiles hit the military base", Instant.now()),
        ClusterItem("i2", "bbc", "WESTERN", "Strike confirmed",
          "Attack confirmed to have hit the base", Instant.now()),
      )
      contradictions <- detector.analyze(cluster, items)
    yield
      assert(contradictions.isEmpty, "Same-perspective items should not contradict")

  test("tracks active contradictions"):
    for
      detector <- ContradictionDetector.make[IO]
      items = List(
        ClusterItem("i1", "reuters", "WESTERN", "Strike destroyed target",
          "The strike destroyed the target facility", Instant.now()),
        ClusterItem("i2", "presstv", "IRANIAN", "Strike missed target",
          "The strike missed and failed to hit any target", Instant.now()),
      )
      _ <- detector.analyze(cluster, items)
      active <- detector.activeContradictions
    yield assert(active.nonEmpty)

  test("resolve clears contradictions"):
    for
      detector <- ContradictionDetector.make[IO]
      items = List(
        ClusterItem("i1", "reuters", "WESTERN", "Hit",
          "The strike destroyed the facility", Instant.now()),
        ClusterItem("i2", "presstv", "IRANIAN", "Miss",
          "The attack was intercepted and deflected", Instant.now()),
      )
      _       <- detector.analyze(cluster, items)
      _       <- detector.resolve(cluster.id)
      cleared <- detector.activeContradictions
    yield assert(cleared.isEmpty, "Should be empty after resolve")

  test("credibility weighting: high-cred sources produce higher severity"):
    for
      detector <- ContradictionDetector.make[IO]
      now = Instant.now()
      items = List(
        ClusterItem("i1", "reuters", "WESTERN", "Strike hit",
          "The strike destroyed the facility", now),
        ClusterItem("i2", "presstv", "IRANIAN", "Strike failed",
          "The attack was intercepted and deflected", now),
      )
      highCred <- detector.analyzeWeighted(cluster, items, Map("reuters" -> 0.9, "presstv" -> 0.9))
      lowCred  <- detector.analyzeWeighted(cluster, items, Map("reuters" -> 0.2, "presstv" -> 0.2))
    yield
      assert(highCred.nonEmpty)
      assert(lowCred.nonEmpty)
      assert(highCred.head.severity > lowCred.head.severity,
        s"High-cred (${highCred.head.severity}) should > low-cred (${lowCred.head.severity})")

  test("temporal gap discounts old contradictions"):
    for
      detector <- ContradictionDetector.make[IO]
      now = Instant.now()
      old = now.minus(48, ChronoUnit.HOURS)
      recentItems = List(
        ClusterItem("i1", "reuters", "WESTERN", "Hit", "The strike destroyed the facility", now),
        ClusterItem("i2", "presstv", "IRANIAN", "Miss", "The attack was intercepted", now),
      )
      oldItems = List(
        ClusterItem("i1", "reuters", "WESTERN", "Hit", "The strike destroyed the facility", now),
        ClusterItem("i2", "presstv", "IRANIAN", "Miss", "The attack was intercepted", old),
      )
      recent <- detector.analyzeWeighted(cluster, recentItems, Map.empty)
      stale  <- detector.analyzeWeighted(cluster, oldItems, Map.empty)
    yield
      assert(recent.nonEmpty && stale.nonEmpty)
      assert(recent.head.severity > stale.head.severity,
        s"Recent (${recent.head.severity}) should be higher than stale (${stale.head.severity})")
      assert(stale.head.description.contains("gap"), "Should note temporal gap")

  test("high-credibility note added to description"):
    for
      detector <- ContradictionDetector.make[IO]
      items = List(
        ClusterItem("i1", "reuters", "WESTERN", "Hit",
          "The strike destroyed the facility", Instant.now()),
        ClusterItem("i2", "presstv", "IRANIAN", "Miss",
          "The attack was intercepted", Instant.now()),
      )
      contras <- detector.analyzeWeighted(cluster, items, Map("reuters" -> 0.9, "presstv" -> 0.85))
    yield
      assert(contras.nonEmpty)
      assert(contras.head.description.contains("HIGH-CREDIBILITY"),
        s"Should flag high-cred: ${contras.head.description}")

  test("low-credibility note added to description"):
    for
      detector <- ContradictionDetector.make[IO]
      items = List(
        ClusterItem("i1", "unknown-1", "WESTERN", "Hit",
          "The strike destroyed the facility", Instant.now()),
        ClusterItem("i2", "unknown-2", "IRANIAN", "Miss",
          "The attack was intercepted", Instant.now()),
      )
      contras <- detector.analyzeWeighted(cluster, items, Map("unknown-1" -> 0.15, "unknown-2" -> 0.2))
    yield
      assert(contras.nonEmpty)
      assert(contras.head.description.contains("LOW-CREDIBILITY"),
        s"Should flag low-cred: ${contras.head.description}")

end ContradictionDetectorSpec
