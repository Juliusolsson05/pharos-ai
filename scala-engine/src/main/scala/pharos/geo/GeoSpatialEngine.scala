package pharos.geo

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import pharos.domain.*
import java.time.{Duration, Instant}

/** Geospatial analysis engine for conflict zone intelligence.
  *
  * Provides:
  *   - Haversine distance computation between geographic points
  *   - Proximity clustering of events by location
  *   - Geographic hotspot detection using density estimation
  *   - Corridor analysis (movement patterns between locations)
  *   - Theater-of-operations bounding box computation
  *
  * All coordinates use [longitude, latitude] (GeoJSON convention)
  * matching the Pharos frontend map system.
  */
trait GeoSpatialEngine[F[_]]:
  /** Record an event at a geographic location. */
  def recordEvent(event: GeoEvent): F[Unit]

  /** Find all events within radius km of a point. */
  def eventsNear(lon: Double, lat: Double, radiusKm: Double): F[List[GeoEvent]]

  /** Detect geographic hotspots — areas with abnormal event density. */
  def detectHotspots(minEvents: Int, radiusKm: Double): F[List[Hotspot]]

  /** Analyze corridors — pairs of locations with frequent event flow. */
  def analyzeCorridors(windowHours: Int): F[List[Corridor]]

  /** Get the current theater overview. */
  def theaterOverview: F[TheaterOverview]

object GeoSpatialEngine:

  /** Earth radius in km. */
  private val EarthRadiusKm = 6371.0

  /** Haversine distance between two points in km. */
  def haversine(lon1: Double, lat1: Double, lon2: Double, lat2: Double): Double =
    val dLat = math.toRadians(lat2 - lat1)
    val dLon = math.toRadians(lon2 - lon1)
    val a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(math.toRadians(lat1)) * math.cos(math.toRadians(lat2)) *
      math.sin(dLon / 2) * math.sin(dLon / 2)
    val c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    EarthRadiusKm * c

  def make[F[_]: Async]: F[GeoSpatialEngine[F]] =
    AtomicCell[F].of(GeoState.empty).map(new GeoSpatialEngineImpl[F](_))

  private case class GeoState(
    events:    Vector[GeoEvent],
    maxEvents: Int,
  ):
    def add(e: GeoEvent): GeoState =
      val updated = if events.size >= maxEvents then events.tail :+ e else events :+ e
      copy(events = updated)

  private object GeoState:
    def empty: GeoState = GeoState(Vector.empty, maxEvents = 5000)

  private class GeoSpatialEngineImpl[F[_]: Async](
    state: AtomicCell[F, GeoState],
  ) extends GeoSpatialEngine[F]:

    override def recordEvent(event: GeoEvent): F[Unit] =
      state.update(_.add(event))

    override def eventsNear(lon: Double, lat: Double, radiusKm: Double): F[List[GeoEvent]] =
      state.get.map { s =>
        s.events.filter { e =>
          haversine(lon, lat, e.lon, e.lat) <= radiusKm
        }.toList
      }

    override def detectHotspots(minEvents: Int, radiusKm: Double): F[List[Hotspot]] =
      state.get.map { s =>
        val events = s.events
        if events.size < minEvents then List.empty
        else
          // Grid-based density estimation
          // Discretize coordinates to ~10km grid cells
          val cellSize = radiusKm / EarthRadiusKm * (180.0 / math.Pi)
          val cells = events.groupBy { e =>
            val cellLon = math.round(e.lon / cellSize) * cellSize
            val cellLat = math.round(e.lat / cellSize) * cellSize
            (cellLon, cellLat)
          }

          cells.toList
            .filter(_._2.size >= minEvents)
            .map { case ((cLon, cLat), cellEvents) =>
              val severityScore = cellEvents.map {
                case e if e.severity == Severity.CRITICAL => 3.0
                case e if e.severity == Severity.HIGH     => 2.0
                case _                                     => 1.0
              }.sum / cellEvents.size

              val perspectives = cellEvents.flatMap(_.perspectives).toSet
              val eventTypes   = cellEvents.map(_.eventType).toSet
              val timeSpan     = if cellEvents.size > 1 then
                val sorted = cellEvents.sortBy(_.timestamp)
                Duration.between(sorted.head.timestamp, sorted.last.timestamp).toHours
              else 0L

              // Intensity: events × severity × recency weight
              val recencyWeight = cellEvents.map { e =>
                val hoursAgo = Duration.between(e.timestamp, Instant.now()).toHours.toDouble.max(1.0)
                1.0 / math.log(hoursAgo + 1)
              }.sum
              val intensity = cellEvents.size * severityScore * recencyWeight / cellEvents.size

              Hotspot(
                centroidLon     = cLon,
                centroidLat     = cLat,
                eventCount      = cellEvents.size,
                intensity       = intensity,
                avgSeverity     = severityScore,
                perspectives    = perspectives,
                eventTypes      = eventTypes,
                timeSpanHours   = timeSpan,
                topEventTitles  = cellEvents.sortBy(e => -e.severity.ordinal).take(3).map(_.title).toList,
              )
            }
            .sortBy(-_.intensity)
            .take(20)
      }

    override def analyzeCorridors(windowHours: Int): F[List[Corridor]] =
      state.get.map { s =>
        val cutoff = Instant.now().minus(Duration.ofHours(windowHours))
        val recent = s.events.filter(_.timestamp.isAfter(cutoff))

        if recent.size < 4 then List.empty
        else
          // Find pairs of named locations with events in both
          val byLocation = recent
            .filter(_.locationName.isDefined)
            .groupBy(_.locationName.get)

          val locationPairs = for
            (loc1, events1) <- byLocation.toList
            (loc2, events2) <- byLocation.toList
            if loc1 < loc2 // avoid duplicates
            // Check for temporal correlation — events close in time
            pairs = for
              e1 <- events1
              e2 <- events2
              gap = math.abs(Duration.between(e1.timestamp, e2.timestamp).toHours)
              if gap <= 6 // events within 6 hours
            yield (e1, e2)
            if pairs.nonEmpty
          yield
            val avgLon1 = events1.map(_.lon).sum / events1.size
            val avgLat1 = events1.map(_.lat).sum / events1.size
            val avgLon2 = events2.map(_.lon).sum / events2.size
            val avgLat2 = events2.map(_.lat).sum / events2.size
            val distance = haversine(avgLon1, avgLat1, avgLon2, avgLat2)

            Corridor(
              locationA  = loc1,
              locationB  = loc2,
              distance   = distance,
              eventPairs = pairs.size,
              avgGapHours = pairs.map { case (e1, e2) =>
                math.abs(Duration.between(e1.timestamp, e2.timestamp).toHours).toDouble
              }.sum / pairs.size,
              eventTypes = (events1 ++ events2).map(_.eventType).toSet,
            )

          locationPairs.sortBy(-_.eventPairs).take(10)
      }

    override def theaterOverview: F[TheaterOverview] =
      state.get.map { s =>
        if s.events.isEmpty then TheaterOverview.empty
        else
          val events = s.events
          val now    = Instant.now()
          val last24 = events.filter(e =>
            Duration.between(e.timestamp, now).toHours <= 24)

          TheaterOverview(
            totalEvents     = events.size,
            last24Hours     = last24.size,
            boundingBox     = BoundingBox(
              minLon = events.map(_.lon).min,
              minLat = events.map(_.lat).min,
              maxLon = events.map(_.lon).max,
              maxLat = events.map(_.lat).max,
            ),
            severityBreakdown = events.groupBy(_.severity).view.mapValues(_.size).toMap,
            typeBreakdown     = events.groupBy(_.eventType).view.mapValues(_.size).toMap,
            activePerspectives = events.flatMap(_.perspectives).toSet,
            centroid          = (events.map(_.lon).sum / events.size, events.map(_.lat).sum / events.size),
          )
      }

  end GeoSpatialEngineImpl

end GeoSpatialEngine

// ── Domain types ─────────────────────────────────────────────────

final case class GeoEvent(
  id:           String,
  lon:          Double,
  lat:          Double,
  timestamp:    Instant,
  severity:     Severity,
  eventType:    EventType,
  title:        String,
  locationName: Option[String],
  perspectives: Set[Perspective],
  clusterId:    Option[String],
)

final case class Hotspot(
  centroidLon:    Double,
  centroidLat:    Double,
  eventCount:     Int,
  intensity:      Double,
  avgSeverity:    Double,
  perspectives:   Set[Perspective],
  eventTypes:     Set[EventType],
  timeSpanHours:  Long,
  topEventTitles: List[String],
)

final case class Corridor(
  locationA:   String,
  locationB:   String,
  distance:    Double,
  eventPairs:  Int,
  avgGapHours: Double,
  eventTypes:  Set[EventType],
)

final case class BoundingBox(
  minLon: Double,
  minLat: Double,
  maxLon: Double,
  maxLat: Double,
)

final case class TheaterOverview(
  totalEvents:        Int,
  last24Hours:        Int,
  boundingBox:        BoundingBox,
  severityBreakdown:  Map[Severity, Int],
  typeBreakdown:      Map[EventType, Int],
  activePerspectives: Set[Perspective],
  centroid:           (Double, Double),
)

object TheaterOverview:
  val empty: TheaterOverview = TheaterOverview(
    0, 0, BoundingBox(0, 0, 0, 0), Map.empty, Map.empty, Set.empty, (0.0, 0.0),
  )
