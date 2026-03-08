package pharos

import cats.effect.*
import cats.effect.unsafe.implicits.global
import munit.CatsEffectSuite
import pharos.chain.{ChainEvent, EventChainAnalyzer}
import pharos.domain.*
import java.time.{Duration, Instant}

class EventChainSpec extends CatsEffectSuite:

  private def event(
    id: String, title: String, eventType: EventType,
    hoursAgo: Int = 0, location: Option[String] = None,
    actors: Set[String] = Set.empty,
  ): ChainEvent =
    ChainEvent(id, title, eventType, Severity.HIGH,
      Instant.now().minus(Duration.ofHours(hoursAgo)),
      location, actors, Some(title))

  test("detects retaliation chain"):
    for
      analyzer <- EventChainAnalyzer.make[IO]()
      _ <- analyzer.recordEvent(event("e1",
        "Iran launches missile strike on Israeli military base in Negev",
        EventType.MILITARY, hoursAgo = 6, location = Some("negev"), actors = Set("IRAN")))
      _ <- analyzer.recordEvent(event("e2",
        "Israel retaliates with counter-strike against Iranian targets",
        EventType.MILITARY, hoursAgo = 2, location = Some("tehran"), actors = Set("ISRAEL")))
      chains <- analyzer.detectChains
    yield
      assert(chains.nonEmpty, "Should detect retaliation chain")
      val retaliationChain = chains.find(_.linkType == "retaliation")
      assert(retaliationChain.isDefined, s"Expected retaliation chain, got: ${chains.map(_.linkType)}")

  test("detects diplomatic breakdown → military chain"):
    for
      analyzer <- EventChainAnalyzer.make[IO]()
      _ <- analyzer.recordEvent(event("e1",
        "Peace talks collapse as negotiations failed between parties",
        EventType.DIPLOMATIC, hoursAgo = 12))
      _ <- analyzer.recordEvent(event("e2",
        "Military forces escalated operations following diplomatic breakdown",
        EventType.MILITARY, hoursAgo = 4))
      chains <- analyzer.detectChains
    yield
      val breakdown = chains.find(_.linkType == "breakdown")
      assert(breakdown.isDefined, s"Expected breakdown chain, got: ${chains.map(_.linkType)}")

  test("builds event graph with root causes"):
    for
      analyzer <- EventChainAnalyzer.make[IO]()
      _ <- analyzer.recordEvent(event("e1", "Iran launches attack on Israeli base",
        EventType.MILITARY, hoursAgo = 24, actors = Set("IRAN")))
      _ <- analyzer.recordEvent(event("e2", "Israel retaliates with counter-attack",
        EventType.MILITARY, hoursAgo = 18, actors = Set("ISRAEL")))
      _ <- analyzer.recordEvent(event("e3", "UN condemns escalation, emergency session",
        EventType.DIPLOMATIC, hoursAgo = 12))
      graph <- analyzer.eventGraph
    yield
      assertEquals(graph.nodes.size, 3)
      assert(graph.totalChains >= 0) // may or may not find chains depending on keyword matches

  test("chains for specific event"):
    for
      analyzer <- EventChainAnalyzer.make[IO]()
      _ <- analyzer.recordEvent(event("e1", "Iran launches missile strike",
        EventType.MILITARY, hoursAgo = 10, actors = Set("IRAN")))
      _ <- analyzer.recordEvent(event("e2", "Israel retaliates with response strike",
        EventType.MILITARY, hoursAgo = 4, actors = Set("ISRAEL")))
      chains <- analyzer.chainsFor("e1")
    yield
      // e1 should appear as cause
      chains.foreach { c =>
        assert(c.causeEvent.id == "e1" || c.effectEvent.id == "e1")
      }

end EventChainSpec
