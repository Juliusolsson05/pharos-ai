package pharos

import cats.effect.*
import munit.CatsEffectSuite
import pharos.alerting.*
import pharos.domain.*
import pharos.sse.EventBus
import java.time.Instant

class AlertEngineSpec extends CatsEffectSuite:

  private def criticalCluster(title: String) = EventCluster(
    id = "c1", canonicalTitle = title, severity = Severity.CRITICAL,
    eventType = EventType.MILITARY, location = Some("Tehran"),
    firstSeen = Instant.now(), lastUpdated = Instant.now(),
    sourceCount = 1, perspectives = Set(Perspective.WESTERN),
    feedItemLinks = List("link1"), confidenceScore = 0.8,
    threatDelta = 0.5, keywords = Set("test"), summary = None,
  )

  private def multiSourceCluster = EventCluster(
    id = "c2", canonicalTitle = "Joint airstrike reported",
    severity = Severity.HIGH, eventType = EventType.MILITARY,
    location = Some("Damascus"), firstSeen = Instant.now(),
    lastUpdated = Instant.now(), sourceCount = 5,
    perspectives = Set(Perspective.WESTERN, Perspective.REGIONAL, Perspective.INDEPENDENT),
    feedItemLinks = List("l1", "l2", "l3"), confidenceScore = 0.9,
    threatDelta = 0.3, keywords = Set("airstrike"), summary = None,
  )

  private val calmSnapshot = AlertSnapshot(
    clusters = List.empty, threatLevel = ThreatLevel.MONITORING,
    escalationScore = 0.0, escalationRateOfChange = 0.0,
    activeAnomalies = 0, openCircuits = 0, totalFeeds = 10,
  )

  test("no alerts on calm snapshot") {
    for
      bus     <- EventBus.make[IO](64)
      engine  <- AlertEngine.make[IO](bus, cooldownMinutes = 0)
      alerts  <- engine.evaluate(calmSnapshot)
    yield assertEquals(alerts.size, 0)
  }

  test("critical cluster triggers alert") {
    for
      bus     <- EventBus.make[IO](64)
      engine  <- AlertEngine.make[IO](bus, cooldownMinutes = 0)
      alerts  <- engine.evaluate(calmSnapshot.copy(
        clusters = List(criticalCluster("Nuclear test detected")),
      ))
    yield {
      assert(alerts.exists(_.ruleId == "CRITICAL_CLUSTER"))
    }
  }

  test("threat escalation triggers alert") {
    for
      bus     <- EventBus.make[IO](64)
      engine  <- AlertEngine.make[IO](bus, cooldownMinutes = 0)
      alerts  <- engine.evaluate(calmSnapshot.copy(
        threatLevel = ThreatLevel.CRITICAL,
        escalationScore = 0.6,
      ))
    yield assert(alerts.exists(_.ruleId == "THREAT_ESCALATION"))
  }

  test("multi-source event triggers alert") {
    for
      bus     <- EventBus.make[IO](64)
      engine  <- AlertEngine.make[IO](bus, cooldownMinutes = 0)
      alerts  <- engine.evaluate(calmSnapshot.copy(
        clusters = List(multiSourceCluster),
      ))
    yield assert(alerts.exists(_.ruleId == "MULTI_SOURCE_EVENT"))
  }

  test("anomaly burst triggers alert") {
    for
      bus     <- EventBus.make[IO](64)
      engine  <- AlertEngine.make[IO](bus, cooldownMinutes = 0)
      alerts  <- engine.evaluate(calmSnapshot.copy(activeAnomalies = 5))
    yield assert(alerts.exists(_.ruleId == "ANOMALY_BURST"))
  }

  test("feed degradation triggers alert") {
    for
      bus     <- EventBus.make[IO](64)
      engine  <- AlertEngine.make[IO](bus, cooldownMinutes = 0)
      alerts  <- engine.evaluate(calmSnapshot.copy(openCircuits = 5, totalFeeds = 10))
    yield assert(alerts.exists(_.ruleId == "FEED_DEGRADATION"))
  }

  test("cooldown prevents duplicate alerts") {
    for
      bus      <- EventBus.make[IO](64)
      engine   <- AlertEngine.make[IO](bus, cooldownMinutes = 60)
      critical  = calmSnapshot.copy(clusters = List(criticalCluster("Test")))
      alerts1  <- engine.evaluate(critical)
      alerts2  <- engine.evaluate(critical) // should be suppressed
    yield {
      assert(alerts1.nonEmpty)
      assertEquals(alerts2.size, 0)
    }
  }

  test("acknowledge marks alert as acknowledged") {
    for
      bus     <- EventBus.make[IO](64)
      engine  <- AlertEngine.make[IO](bus, cooldownMinutes = 0)
      alerts  <- engine.evaluate(calmSnapshot.copy(
        clusters = List(criticalCluster("Test")),
      ))
      alertId  = alerts.head.id
      acked   <- engine.acknowledge(alertId)
      active  <- engine.activeAlerts
    yield {
      assert(acked)
      assert(active.forall(_.id != alertId))
    }
  }

  test("alert history preserves all alerts") {
    for
      bus     <- EventBus.make[IO](64)
      engine  <- AlertEngine.make[IO](bus, cooldownMinutes = 0)
      _       <- engine.evaluate(calmSnapshot.copy(
        clusters = List(criticalCluster("Test"), multiSourceCluster),
        activeAnomalies = 5,
      ))
      history <- engine.alertHistory
    yield assert(history.size >= 3)
  }

end AlertEngineSpec
