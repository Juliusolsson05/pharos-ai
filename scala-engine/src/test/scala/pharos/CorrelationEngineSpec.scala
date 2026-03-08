package pharos

import cats.effect.*
import cats.effect.unsafe.implicits.global
import munit.CatsEffectSuite
import pharos.correlation.CorrelationEngine
import pharos.domain.*
import java.time.Instant

class CorrelationEngineSpec extends CatsEffectSuite:

  private val testConfig = EngineConfig(
    correlationWindowMinutes = 120,
    similarityThreshold      = 0.35,
    feedPollIntervalSeconds  = 300,
    maxConcurrentFeeds       = 4,
    threatDecayHours         = 24,
  )

  private val reutersFeed = FeedSource(
    id = "reuters", name = "Reuters", url = "https://example.com/rss",
    perspective = Perspective.WESTERN, country = "US",
    tags = List("wire"), stateFunded = false, tier = 1,
  )

  private val pressTV = FeedSource(
    id = "presstv", name = "Press TV", url = "https://example.com/rss2",
    perspective = Perspective.IRANIAN, country = "IR",
    tags = List("state"), stateFunded = true, tier = 4,
  )

  test("creates new cluster for first item"):
    for
      engine <- CorrelationEngine.make[IO](testConfig)
      item = RawFeedItem(
        feedId = "reuters", title = "Iran launches missile strike on Israeli bases",
        link = "https://reuters.com/1", pubDate = Instant.now(),
        contentSnippet = Some("Multiple ballistic missiles fired from Iranian territory"),
        creator = None, categories = List("military"), imageUrl = None,
      )
      result <- engine.correlate(item, reutersFeed)
    yield
      assert(result.isNew)
      assertEquals(result.matchedOn, List("new_cluster"))

  test("merges similar items into same cluster"):
    for
      engine <- CorrelationEngine.make[IO](testConfig)
      item1 = RawFeedItem(
        feedId = "reuters", title = "Iran launches ballistic missile strike on Israeli military bases in Negev",
        link = "https://reuters.com/1", pubDate = Instant.now(),
        contentSnippet = Some("Multiple ballistic missiles fired from Iran targeting Israeli military installations"),
        creator = None, categories = List("military"), imageUrl = None,
      )
      item2 = RawFeedItem(
        feedId = "presstv", title = "Iranian missiles hit Israeli military installations in Negev desert",
        link = "https://presstv.com/1", pubDate = Instant.now(),
        contentSnippet = Some("IRGC confirms ballistic missile launch against Israeli bases in southern Negev"),
        creator = None, categories = List("military"), imageUrl = None,
      )
      r1 <- engine.correlate(item1, reutersFeed)
      r2 <- engine.correlate(item2, pressTV)
      clusters <- engine.activeClusters
    yield
      assert(r1.isNew)
      assert(!r2.isNew, s"Second item should merge, but got new cluster. Confidence: ${r2.confidence}")
      assertEquals(r1.clusterId, r2.clusterId)
      assertEquals(clusters.size, 1)
      assertEquals(clusters.head.sourceCount, 2)
      assert(clusters.head.perspectives.contains(Perspective.WESTERN))
      assert(clusters.head.perspectives.contains(Perspective.IRANIAN))

  test("keeps unrelated items in separate clusters"):
    for
      engine <- CorrelationEngine.make[IO](testConfig)
      military = RawFeedItem(
        feedId = "reuters", title = "Iran launches missile strike on Israeli bases",
        link = "https://reuters.com/1", pubDate = Instant.now(),
        contentSnippet = Some("Ballistic missiles targeted military installations"),
        creator = None, categories = Nil, imageUrl = None,
      )
      economic = RawFeedItem(
        feedId = "reuters", title = "Oil prices surge amid global supply disruptions",
        link = "https://reuters.com/2", pubDate = Instant.now(),
        contentSnippet = Some("Brent crude jumps 5% on supply chain concerns"),
        creator = None, categories = Nil, imageUrl = None,
      )
      r1 <- engine.correlate(military, reutersFeed)
      r2 <- engine.correlate(economic, reutersFeed)
    yield
      assert(r1.clusterId != r2.clusterId)

  test("threat assessment reflects cluster severity"):
    for
      engine <- CorrelationEngine.make[IO](testConfig)
      critical = RawFeedItem(
        feedId = "reuters", title = "Nuclear facility attacked in massive strike",
        link = "https://reuters.com/nuke", pubDate = Instant.now(),
        contentSnippet = Some("Nuclear enrichment site hit by cruise missiles"),
        creator = None, categories = Nil, imageUrl = None,
      )
      _ <- engine.correlate(critical, reutersFeed)
      assessment <- engine.assessThreat
    yield
      assert(assessment.activeClusterCount >= 1)
      assert(assessment.escalationScore > 0.0)

  test("deduplicates identical links"):
    for
      engine <- CorrelationEngine.make[IO](testConfig)
      item = RawFeedItem(
        feedId = "reuters", title = "Test article",
        link = "https://reuters.com/same", pubDate = Instant.now(),
        contentSnippet = None, creator = None, categories = Nil, imageUrl = None,
      )
      r1 <- engine.correlate(item, reutersFeed)
      r2 <- engine.correlate(item, reutersFeed)
    yield
      assertEquals(r1.clusterId, r2.clusterId)
      assertEquals(r2.matchedOn, List("duplicate"))

end CorrelationEngineSpec
