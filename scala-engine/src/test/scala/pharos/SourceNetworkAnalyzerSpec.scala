package pharos

import cats.effect.*
import cats.syntax.all.*
import munit.CatsEffectSuite
import pharos.domain.*
import pharos.network.*
import java.time.{Duration, Instant}

class SourceNetworkAnalyzerSpec extends CatsEffectSuite:

  private val now = Instant.now()

  test("empty analyzer returns empty network") {
    SourceNetworkAnalyzer.make[IO]().flatMap { analyzer =>
      analyzer.networkGraph.map { graph =>
        assertEquals(graph.totalSources, 0)
        assertEquals(graph.totalClusters, 0)
      }
    }
  }

  test("records coverage and builds network graph") {
    SourceNetworkAnalyzer.make[IO]().flatMap { analyzer =>
      val ops = List(
        analyzer.recordCoverage("reuters", Perspective.WESTERN, "c1", now),
        analyzer.recordCoverage("bbc", Perspective.WESTERN, "c1", now.plusSeconds(60)),
        analyzer.recordCoverage("reuters", Perspective.WESTERN, "c2", now.plusSeconds(120)),
      )
      ops.sequence_ *>
      analyzer.networkGraph.map { graph =>
        assertEquals(graph.totalSources, 2)
        assertEquals(graph.totalClusters, 2)
        assert(graph.nodes.exists(_.feedId == "reuters"))
        assert(graph.nodes.exists(_.feedId == "bbc"))
      }
    }
  }

  test("detects co-reporting pairs") {
    SourceNetworkAnalyzer.make[IO]().flatMap { analyzer =>
      val ops = List(
        analyzer.recordCoverage("reuters", Perspective.WESTERN, "c1", now),
        analyzer.recordCoverage("bbc", Perspective.WESTERN, "c1", now),
        analyzer.recordCoverage("reuters", Perspective.WESTERN, "c2", now),
        analyzer.recordCoverage("bbc", Perspective.WESTERN, "c2", now),
        analyzer.recordCoverage("reuters", Perspective.WESTERN, "c3", now),
      )
      ops.sequence_ *>
      analyzer.coReportingPairs.map { pairs =>
        assert(pairs.nonEmpty)
        val reutersBbc = pairs.find(p =>
          (p.feedIdA == "reuters" && p.feedIdB == "bbc") ||
          (p.feedIdA == "bbc" && p.feedIdB == "reuters")
        )
        assert(reutersBbc.isDefined)
        assertEquals(reutersBbc.get.coReportCount, 2)
      }
    }
  }

  test("detects echo chambers with high overlap") {
    SourceNetworkAnalyzer.make[IO]().flatMap { analyzer =>
      // Two Western sources covering almost the same clusters
      val clusters = (1 to 10).toList
      val ops = clusters.flatMap { i =>
        List(
          analyzer.recordCoverage("source-a", Perspective.WESTERN, s"c$i", now),
          analyzer.recordCoverage("source-b", Perspective.WESTERN, s"c$i", now),
        )
      }
      ops.sequence_ *>
      analyzer.detectEchoChambers.map { chambers =>
        assert(chambers.nonEmpty, "Expected at least one echo chamber")
        val western = chambers.find(_.perspective == Perspective.WESTERN)
        assert(western.isDefined)
        assert(western.get.avgSimilarity > 0.8)
      }
    }
  }

  test("coverage analysis reports single-source clusters") {
    SourceNetworkAnalyzer.make[IO]().flatMap { analyzer =>
      val ops = List(
        // c1: multi-source
        analyzer.recordCoverage("reuters", Perspective.WESTERN, "c1", now),
        analyzer.recordCoverage("presstv", Perspective.IRANIAN, "c1", now),
        // c2: single source
        analyzer.recordCoverage("reuters", Perspective.WESTERN, "c2", now),
        // c3: single source
        analyzer.recordCoverage("bbc", Perspective.WESTERN, "c3", now),
      )
      ops.sequence_ *>
      analyzer.coverageAnalysis.map { report =>
        assertEquals(report.totalClusters, 3)
        assertEquals(report.singleSourceClusters, 2)
        assertEquals(report.multiPerspectiveClusters, 1)
        assert(report.independenceScore > 0.0)
        assert(report.independenceScore < 1.0)
      }
    }
  }

  test("empty coverage returns empty report") {
    SourceNetworkAnalyzer.make[IO]().flatMap { analyzer =>
      analyzer.coverageAnalysis.map { report =>
        assertEquals(report.totalClusters, 0)
        assertEquals(report.independenceScore, 0.0)
      }
    }
  }

  test("computes average sources per cluster") {
    SourceNetworkAnalyzer.make[IO]().flatMap { analyzer =>
      val ops = List(
        analyzer.recordCoverage("a", Perspective.WESTERN, "c1", now),
        analyzer.recordCoverage("b", Perspective.WESTERN, "c1", now),
        analyzer.recordCoverage("c", Perspective.IRANIAN, "c1", now),
        analyzer.recordCoverage("a", Perspective.WESTERN, "c2", now),
      )
      ops.sequence_ *>
      analyzer.networkGraph.map { graph =>
        // c1 has 3 sources, c2 has 1 → avg = 2.0
        assertEquals(graph.avgSourcesPerCluster, 2.0)
      }
    }
  }

  test("respects maxRecords limit") {
    SourceNetworkAnalyzer.make[IO](maxRecords = 3).flatMap { analyzer =>
      val ops = (1 to 10).toList.map(i =>
        analyzer.recordCoverage(s"feed-$i", Perspective.WESTERN, s"c$i", now)
      )
      ops.sequence_ *>
      analyzer.networkGraph.map { graph =>
        // Only 3 records kept
        assertEquals(graph.totalSources, 3)
      }
    }
  }

  test("no echo chambers with insufficient data") {
    SourceNetworkAnalyzer.make[IO]().flatMap { analyzer =>
      val ops = List(
        analyzer.recordCoverage("a", Perspective.WESTERN, "c1", now),
        analyzer.recordCoverage("b", Perspective.IRANIAN, "c2", now),
      )
      ops.sequence_ *>
      analyzer.detectEchoChambers.map { chambers =>
        assertEquals(chambers.size, 0)
      }
    }
  }

end SourceNetworkAnalyzerSpec
