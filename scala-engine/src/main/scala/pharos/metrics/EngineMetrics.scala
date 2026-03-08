package pharos.metrics

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import io.circe.*
import io.circe.syntax.*
import java.time.Instant
import java.util.concurrent.atomic.{AtomicLong, LongAdder}

/** Lightweight metrics collection for the Pharos engine.
  *
  * Tracks counters, gauges, and histograms without external dependencies.
  * Exposes both JSON (for the frontend) and Prometheus text format.
  */
trait EngineMetrics[F[_]]:
  def incCounter(name: String, labels: Map[String, String] = Map.empty): F[Unit]
  def setGauge(name: String, value: Double, labels: Map[String, String] = Map.empty): F[Unit]
  def recordHistogram(name: String, value: Double, labels: Map[String, String] = Map.empty): F[Unit]
  def snapshot: F[MetricsSnapshot]
  def prometheusText: F[String]

object EngineMetrics:

  def make[F[_]: Async]: F[EngineMetrics[F]] =
    AtomicCell[F].of(MetricsState.empty).map(new EngineMetricsImpl[F](_))

  private class EngineMetricsImpl[F[_]: Async](
    state: AtomicCell[F, MetricsState],
  ) extends EngineMetrics[F]:

    override def incCounter(name: String, labels: Map[String, String]): F[Unit] =
      state.update { s =>
        val key = MetricKey(name, labels)
        val current = s.counters.getOrElse(key, 0L)
        s.copy(counters = s.counters.updated(key, current + 1))
      }

    override def setGauge(name: String, value: Double, labels: Map[String, String]): F[Unit] =
      state.update { s =>
        val key = MetricKey(name, labels)
        s.copy(gauges = s.gauges.updated(key, value))
      }

    override def recordHistogram(name: String, value: Double, labels: Map[String, String]): F[Unit] =
      state.update { s =>
        val key = MetricKey(name, labels)
        val hist = s.histograms.getOrElse(key, HistogramData.empty)
        s.copy(histograms = s.histograms.updated(key, hist.record(value)))
      }

    override def snapshot: F[MetricsSnapshot] =
      state.get.map { s =>
        MetricsSnapshot(
          timestamp  = Instant.now(),
          counters   = s.counters.map { case (k, v) => MetricEntry(k.name, k.labels, v.toDouble) }.toList,
          gauges     = s.gauges.map { case (k, v) => MetricEntry(k.name, k.labels, v) }.toList,
          histograms = s.histograms.map { case (k, v) =>
            HistogramEntry(k.name, k.labels, v.count, v.sum, v.min, v.max, v.mean)
          }.toList,
        )
      }

    override def prometheusText: F[String] =
      state.get.map { s =>
        val sb = new StringBuilder

        // Counters
        s.counters.groupBy(_._1.name).foreach { case (name, entries) =>
          sb.append(s"# TYPE pharos_$name counter\n")
          entries.foreach { case (key, value) =>
            val lbls = formatLabels(key.labels)
            sb.append(s"pharos_$name$lbls $value\n")
          }
        }

        // Gauges
        s.gauges.groupBy(_._1.name).foreach { case (name, entries) =>
          sb.append(s"# TYPE pharos_$name gauge\n")
          entries.foreach { case (key, value) =>
            val lbls = formatLabels(key.labels)
            sb.append(s"pharos_$name$lbls $value\n")
          }
        }

        // Histograms (summary-style)
        s.histograms.groupBy(_._1.name).foreach { case (name, entries) =>
          sb.append(s"# TYPE pharos_$name summary\n")
          entries.foreach { case (key, hist) =>
            val lbls = formatLabels(key.labels)
            sb.append(s"pharos_${name}_count$lbls ${hist.count}\n")
            sb.append(s"pharos_${name}_sum$lbls ${hist.sum}\n")
          }
        }

        sb.toString
      }

    private def formatLabels(labels: Map[String, String]): String =
      if labels.isEmpty then ""
      else labels.map { case (k, v) => s"""$k="$v"""" }.mkString("{", ",", "}")

  end EngineMetricsImpl

  // ── Internal state ─────────────────────────────────────────────

  private case class MetricKey(name: String, labels: Map[String, String])

  private case class HistogramData(
    count: Long,
    sum:   Double,
    min:   Double,
    max:   Double,
  ):
    def mean: Double = if count == 0 then 0.0 else sum / count
    def record(value: Double): HistogramData =
      HistogramData(
        count = count + 1,
        sum   = sum + value,
        min   = math.min(min, value),
        max   = math.max(max, value),
      )

  private object HistogramData:
    val empty: HistogramData = HistogramData(0, 0.0, Double.MaxValue, Double.MinValue)

  private case class MetricsState(
    counters:   Map[MetricKey, Long],
    gauges:     Map[MetricKey, Double],
    histograms: Map[MetricKey, HistogramData],
  )

  private object MetricsState:
    val empty: MetricsState = MetricsState(Map.empty, Map.empty, Map.empty)

end EngineMetrics

// ── Public types ─────────────────────────────────────────────────

final case class MetricEntry(name: String, labels: Map[String, String], value: Double)
final case class HistogramEntry(
  name: String, labels: Map[String, String],
  count: Long, sum: Double, min: Double, max: Double, mean: Double,
)
final case class MetricsSnapshot(
  timestamp:  Instant,
  counters:   List[MetricEntry],
  gauges:     List[MetricEntry],
  histograms: List[HistogramEntry],
)

// JSON codecs
object MetricsCodecs:
  import pharos.domain.Codecs.given

  given Encoder[MetricEntry]    = io.circe.generic.semiauto.deriveEncoder
  given Encoder[HistogramEntry] = io.circe.generic.semiauto.deriveEncoder
  given Encoder[MetricsSnapshot] = io.circe.generic.semiauto.deriveEncoder
