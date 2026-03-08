package pharos

import cats.effect.*
import cats.effect.unsafe.implicits.global
import munit.CatsEffectSuite
import pharos.narrative.*
import pharos.domain.*
import pharos.correlation.{AnomalyResult, AnomalyType, BaselineStats}
import pharos.geo.{BoundingBox, TheaterOverview}
import pharos.prediction.{EscalationForecast, EscalationTrend, ForecastPoint}
import java.time.Instant

class NarrativeSynthesizerSpec extends CatsEffectSuite:

  private val cluster = EventCluster(
    "c1", "Iranian missile strike on Negev base", Severity.CRITICAL, EventType.MILITARY,
    Some("negev"), Instant.now(), Instant.now(), 4,
    Set(Perspective.WESTERN, Perspective.IRANIAN, Perspective.ISRAELI),
    List.empty, 0.85, 0.4, Set("missile", "strike", "iran"), Some("Major strike event"),
  )

  private val minInput = SitrepInput(
    clusters          = List(cluster),
    threat            = ThreatAssessment(Instant.now(), ThreatLevel.HIGH, 0.5, 1,
                          List(cluster), Map(Perspective.WESTERN -> 0.5), "Monitor closely"),
    anomalies         = List.empty,
    hotspots          = List.empty,
    corridors         = List.empty,
    theater           = TheaterOverview.empty,
    forecast          = EscalationForecast.insufficient,
    credibilityScores = List.empty,
    contradictions    = List.empty,
  )

  test("generates SITREP with all sections"):
    for
      synth  <- NarrativeSynthesizer.make[IO]
      sitrep <- synth.generateSitrep(minInput)
    yield
      assert(sitrep.headline.nonEmpty)
      assert(sitrep.situation.lines.nonEmpty)
      assert(sitrep.keyEvents.nonEmpty)
      assertEquals(sitrep.keyEvents.head.title, cluster.canonicalTitle)
      assert(sitrep.recommendations.nonEmpty)
      assert(sitrep.threatLevel == ThreatLevel.HIGH)

  test("headline reflects threat level and trend"):
    for
      synth  <- NarrativeSynthesizer.make[IO]
      sitrep <- synth.generateSitrep(minInput)
    yield
      assert(sitrep.headline.contains("HIGH"))

  test("records SITREP in history"):
    for
      synth <- NarrativeSynthesizer.make[IO]
      _     <- synth.generateSitrep(minInput)
      _     <- synth.generateSitrep(minInput)
      h     <- synth.history
    yield assertEquals(h.size, 2)

  test("generates flash report for critical cluster"):
    for
      synth <- NarrativeSynthesizer.make[IO]
      ctx    = FlashContext(ThreatLevel.HIGH, EscalationTrend.Escalating, 3)
      flash <- synth.generateFlash(cluster, ctx)
    yield
      assert(flash.headline.contains("FLASH"))
      assert(flash.body.contains("CRITICAL"))
      assert(flash.severity == Severity.CRITICAL)

  test("raw metrics are populated"):
    for
      synth  <- NarrativeSynthesizer.make[IO]
      sitrep <- synth.generateSitrep(minInput)
    yield
      assert(sitrep.rawMetrics.contains("clusters"))
      assertEqualsDouble(sitrep.rawMetrics("clusters"), 1.0, 0.001)

end NarrativeSynthesizerSpec
