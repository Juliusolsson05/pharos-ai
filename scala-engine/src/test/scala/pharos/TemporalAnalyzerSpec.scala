package pharos

import cats.effect.*
import munit.CatsEffectSuite
import pharos.domain.*
import pharos.temporal.*
import java.time.{Duration, Instant}

class TemporalAnalyzerSpec extends CatsEffectSuite:

  private def event(
    hoursAgo: Int,
    eventType: String = "MILITARY",
    severity: Severity = Severity.STANDARD,
    clusterId: String = "c1",
  ): TemporalEvent =
    TemporalEvent(
      Instant.now().minus(Duration.ofHours(hoursAgo)),
      eventType, severity, Some("Tehran"), clusterId,
    )

  private def eventMinutesAgo(
    minutes: Int,
    eventType: String = "MILITARY",
    severity: Severity = Severity.STANDARD,
  ): TemporalEvent =
    TemporalEvent(
      Instant.now().minus(Duration.ofMinutes(minutes)),
      eventType, severity, Some("Tehran"), s"c-$minutes",
    )

  test("empty analyzer returns empty profile") {
    TemporalAnalyzer.make[IO]().flatMap { analyzer =>
      analyzer.profile.map { p =>
        assertEquals(p.totalEvents, 0)
        assertEquals(p.eventsPerHour, 0.0)
      }
    }
  }

  test("records events and computes profile") {
    TemporalAnalyzer.make[IO]().flatMap { analyzer =>
      val events = (1 to 10).map(i => event(i)).toList
      events.traverse_(analyzer.record) *>
      analyzer.profile.map { p =>
        assertEquals(p.totalEvents, 10)
        assert(p.timeSpanHours > 0)
        assert(p.eventsPerHour > 0)
      }
    }
  }

  test("detects no patterns with fewer than 10 events") {
    TemporalAnalyzer.make[IO]().flatMap { analyzer =>
      val events = (1 to 5).map(i => event(i)).toList
      events.traverse_(analyzer.record) *>
      analyzer.detectPatterns.map { patterns =>
        assertEquals(patterns.size, 0)
      }
    }
  }

  test("computes hourly distribution for 24 hours") {
    TemporalAnalyzer.make[IO]().flatMap { analyzer =>
      val events = (0 to 23).map(i => event(i)).toList
      events.traverse_(analyzer.record) *>
      analyzer.hourlyDistribution.map { dist =>
        assertEquals(dist.size, 24)
        assert(dist.values.exists(_.count > 0))
      }
    }
  }

  test("detects escalation acceleration when severity increases") {
    TemporalAnalyzer.make[IO]().flatMap { analyzer =>
      // First half: all STANDARD
      val firstHalf = (20 to 11).map(i =>
        event(i, severity = Severity.STANDARD)
      ).toList
      // Second half: all CRITICAL
      val secondHalf = (10 to 1).map(i =>
        event(i, severity = Severity.CRITICAL)
      ).toList
      (firstHalf ++ secondHalf).traverse_(analyzer.record) *>
      analyzer.detectPatterns.map { patterns =>
        val escPattern = patterns.find(_.name == "Escalation Acceleration")
        assert(escPattern.isDefined, s"Expected Escalation Acceleration, got: ${patterns.map(_.name)}")
      }
    }
  }

  test("detects multi-domain convergence with 4+ event types") {
    TemporalAnalyzer.make[IO]().flatMap { analyzer =>
      val types = List("MILITARY", "DIPLOMATIC", "ECONOMIC", "NUCLEAR")
      val events = types.zipWithIndex.flatMap { case (t, i) =>
        (0 to 2).map(j => eventMinutesAgo(i * 10 + j, eventType = t))
      }
      events.traverse_(analyzer.record) *>
      analyzer.detectPatterns.map { patterns =>
        val conv = patterns.find(_.name == "Multi-Domain Convergence")
        assert(conv.isDefined, s"Expected Multi-Domain Convergence, got: ${patterns.map(_.name)}")
      }
    }
  }

  test("profile shows type distribution") {
    TemporalAnalyzer.make[IO]().flatMap { analyzer =>
      val events = List(
        event(1, eventType = "MILITARY"),
        event(2, eventType = "MILITARY"),
        event(3, eventType = "DIPLOMATIC"),
      )
      events.traverse_(analyzer.record) *>
      analyzer.profile.map { p =>
        assert(p.typeDistribution.contains("MILITARY"))
        assert(p.typeDistribution("MILITARY") > 0.5)
      }
    }
  }

  test("respects maxEvents limit") {
    TemporalAnalyzer.make[IO](maxEvents = 5).flatMap { analyzer =>
      val events = (1 to 10).map(i => event(i)).toList
      events.traverse_(analyzer.record) *>
      analyzer.profile.map { p =>
        assertEquals(p.totalEvents, 5)
      }
    }
  }

  test("empty profile has zero severity trend") {
    assertEquals(TemporalProfile.empty.severityTrend, 0.0)
    assertEquals(TemporalProfile.empty.totalEvents, 0)
  }

end TemporalAnalyzerSpec
