package pharos.feeds

import cats.effect.*
import cats.syntax.all.*
import fs2.*
import org.http4s.client.Client
import org.http4s.*
import org.typelevel.log4cats.Logger
import pharos.domain.*
import pharos.correlation.{CorrelationEngine, AnomalyDetector}
import pharos.metrics.EngineMetrics
import java.time.Instant
import scala.xml.XML
import scala.util.Try

/** FS2 streaming feed ingester with circuit breaker protection.
  *
  * Polls configured RSS feeds on a schedule, parses items,
  * and pushes them through the correlation engine + anomaly detector.
  * Uses fs2.Stream for backpressure-aware, concurrent processing.
  * Circuit breaker prevents cascading failures from flaky feeds.
  */
trait FeedIngester[F[_]]:
  /** Start continuous feed polling. Returns a never-ending stream. */
  def pollStream(sources: List[FeedSource]): Stream[F, CorrelationResult]

  /** One-shot fetch and correlate for a single feed. */
  def fetchAndCorrelate(source: FeedSource): F[List[CorrelationResult]]

object FeedIngester:

  def make[F[_]: Async: Logger](
    client:    Client[F],
    engine:    CorrelationEngine[F],
    anomaly:   AnomalyDetector[F],
    breaker:   CircuitBreaker[F],
    metrics:   EngineMetrics[F],
    config:    EngineConfig,
  ): FeedIngester[F] = new FeedIngester[F]:

    override def pollStream(sources: List[FeedSource]): Stream[F, CorrelationResult] =
      Stream
        .awakeEvery[F](scala.concurrent.duration.FiniteDuration(config.feedPollIntervalSeconds.toLong, "seconds"))
        .evalMap(_ =>
          Logger[F].info(s"Starting feed poll cycle for ${sources.size} feeds") *>
          metrics.incCounter("feed_poll_cycles")
        )
        .flatMap { _ =>
          Stream
            .emits(sources)
            .covary[F]
            .parEvalMap(config.maxConcurrentFeeds) { source =>
              fetchAndCorrelate(source)
                .handleErrorWith {
                  case _: CircuitOpenException =>
                    Logger[F].warn(s"Circuit OPEN for ${source.name} — skipping") *>
                    metrics.incCounter("feed_circuit_open", Map("feed" -> source.id)) *>
                    Async[F].pure(List.empty[CorrelationResult])
                  case err =>
                    Logger[F].warn(s"Feed fetch failed for ${source.name}: ${err.getMessage}") *>
                    metrics.incCounter("feed_fetch_errors", Map("feed" -> source.id)) *>
                    Async[F].pure(List.empty[CorrelationResult])
                }
            }
            .flatMap(results => Stream.emits(results))
        }

    override def fetchAndCorrelate(source: FeedSource): F[List[CorrelationResult]] =
      val timed = for
        start   <- Async[F].monotonic
        _       <- Logger[F].debug(s"Fetching feed: ${source.name} (${source.url})")
        body    <- breaker.protect(source.id)(fetchFeedBody(source.url))
        items   <- Async[F].delay(parseFeed(body, source.id))
        _       <- Logger[F].debug(s"Parsed ${items.size} items from ${source.name}")
        _       <- metrics.incCounter("feed_items_parsed", Map("feed" -> source.id))
        results <- items.traverse { item =>
          for
            corr    <- engine.correlate(item, source)
            _       <- metrics.incCounter("correlations_total",
                         Map("new" -> corr.isNew.toString))
            // Run anomaly detection on new clusters
            _       <- (engine.activeClusters.flatMap { clusters =>
                           clusters.find(_.id == corr.clusterId).traverse_ { cluster =>
                             anomaly.observe(cluster).flatMap { result =>
                               (Logger[F].warn(
                                   s"ANOMALY DETECTED: ${result.anomalyType} — ${result.description} " +
                                   s"(score: ${f"${result.anomalyScore}%.2f"}, cluster: ${cluster.canonicalTitle})"
                                 ) *>
                                 metrics.incCounter("anomalies_detected",
                                   Map("type" -> result.anomalyType.toString))
                               ).whenA(result.isAnomaly)
                             }
                           }
                         }).whenA(corr.isNew)
          yield corr
        }
        end     <- Async[F].monotonic
        elapsed  = (end - start).toMillis.toDouble
        _       <- metrics.recordHistogram("feed_fetch_duration_ms",
                     elapsed, Map("feed" -> source.id))
      yield results
      timed

    private def fetchFeedBody(url: String): F[String] =
      val req = Request[F](Method.GET, Uri.unsafeFromString(url))
        .withHeaders(
          Headers(
            Header.Raw(org.typelevel.ci.CIString("User-Agent"), "PharosEngine/0.5"),
            Header.Raw(org.typelevel.ci.CIString("Accept"), "application/rss+xml, application/xml, text/xml"),
          )
        )
      Retry.withPolicy(
        Retry.Policy(maxRetries = 2, baseDelay = scala.concurrent.duration.FiniteDuration(1, "seconds")),
        s"fetch($url)",
      )(client.expect[String](req))

    private def parseFeed(xml: String, feedId: String): List[RawFeedItem] =
      Try {
        val doc = XML.loadString(xml)
        val items = (doc \\ "item") ++ (doc \\ "entry") // RSS 2.0 + Atom

        items.toList.flatMap { node =>
          val title   = (node \ "title").text.trim
          val link    = {
            val rssLink = (node \ "link").text.trim
            if rssLink.nonEmpty then rssLink
            else (node \ "link").headOption.flatMap(_.attribute("href")).map(_.text).getOrElse("")
          }
          val pubDate = {
            val dateStr = (node \ "pubDate").text.fallbackTo((node \ "published").text).fallbackTo((node \ "updated").text)
            Try(Instant.parse(dateStr)).orElse(Try(parseRfc822(dateStr))).getOrElse(Instant.now())
          }
          val content = (node \ "description").text.take(500).fallbackTo(
            (node \ "summary").text.take(500)
          )
          val creator = (node \ "creator").headOption.map(_.text)
          val categories = (node \ "category").map(_.text).toList
          val imageUrl = (node \ "enclosure").headOption
            .filter(_.attribute("type").exists(_.text.startsWith("image")))
            .flatMap(_.attribute("url").map(_.text))

          if title.nonEmpty && link.nonEmpty then
            Some(RawFeedItem(
              feedId         = feedId,
              title          = title,
              link           = link,
              pubDate        = pubDate,
              contentSnippet = if content.nonEmpty then Some(stripHtml(content)) else None,
              creator        = creator,
              categories     = categories,
              imageUrl       = imageUrl,
            ))
          else None
        }
      }.getOrElse(List.empty)

    /** Strip HTML tags from RSS content snippets. */
    private def stripHtml(html: String): String =
      html
        .replaceAll("<[^>]+>", " ")
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", "\"")
        .replaceAll("&#39;", "'")
        .replaceAll("\\s+", " ")
        .trim

    /** Parse RFC 822 date format used by RSS 2.0. */
    private def parseRfc822(dateStr: String): Instant =
      import java.time.format.DateTimeFormatter
      import java.time.ZonedDateTime
      val formatter = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss Z")
      ZonedDateTime.parse(dateStr.trim, formatter).toInstant

    extension (s: String)
      private def fallbackTo(other: String): String =
        if s.nonEmpty then s else other

end FeedIngester
