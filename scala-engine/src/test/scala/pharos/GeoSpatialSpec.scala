package pharos

import cats.effect.*
import cats.effect.unsafe.implicits.global
import munit.CatsEffectSuite
import pharos.geo.{GeoEvent, GeoSpatialEngine}
import pharos.domain.*
import java.time.Instant

class GeoSpatialSpec extends CatsEffectSuite:

  private def event(
    id: String, lon: Double, lat: Double,
    location: Option[String] = None,
    severity: Severity = Severity.STANDARD,
  ): GeoEvent =
    GeoEvent(id, lon, lat, Instant.now(), severity, EventType.MILITARY,
      s"Event $id", location, Set(Perspective.WESTERN), None)

  test("haversine: Tehran to Tel Aviv is ~1600km"):
    val dist = GeoSpatialEngine.haversine(51.389, 35.689, 34.782, 32.085)
    assert(dist > 1500 && dist < 1700, s"Expected ~1600km, got $dist")

  test("haversine: same point is 0km"):
    assertEqualsDouble(GeoSpatialEngine.haversine(0, 0, 0, 0), 0.0, 0.001)

  test("haversine: Natanz to Isfahan is ~120km"):
    val dist = GeoSpatialEngine.haversine(51.7267, 33.5103, 51.6776, 32.6546)
    assert(dist > 80 && dist < 150, s"Expected ~120km, got $dist")

  test("eventsNear finds events within radius"):
    for
      geo <- GeoSpatialEngine.make[IO]
      _   <- geo.recordEvent(event("e1", 51.389, 35.689))   // Tehran
      _   <- geo.recordEvent(event("e2", 51.677, 32.655))   // Isfahan
      _   <- geo.recordEvent(event("e3", 34.782, 32.085))   // Tel Aviv (far)
      near <- geo.eventsNear(51.389, 35.689, 200.0) // 200km from Tehran
    yield
      assertEquals(near.size, 1) // only Tehran — Isfahan is ~950km away
      assertEquals(near.head.id, "e1")

  test("detectHotspots identifies areas with event concentration"):
    for
      geo <- GeoSpatialEngine.make[IO]
      // Cluster of events near Tehran
      _ <- (1 to 5).toList.traverse_ { i =>
        geo.recordEvent(event(s"t$i", 51.389 + i * 0.01, 35.689 + i * 0.01))
      }
      // Single event in Tel Aviv
      _ <- geo.recordEvent(event("ta1", 34.782, 32.085))
      hotspots <- geo.detectHotspots(minEvents = 3, radiusKm = 50.0)
    yield
      assert(hotspots.nonEmpty, "Should detect at least one hotspot near Tehran")
      assert(hotspots.head.eventCount >= 3)

  test("theaterOverview computes bounding box"):
    for
      geo <- GeoSpatialEngine.make[IO]
      _   <- geo.recordEvent(event("e1", 34.0, 31.0))
      _   <- geo.recordEvent(event("e2", 52.0, 36.0))
      overview <- geo.theaterOverview
    yield
      assertEquals(overview.totalEvents, 2)
      assertEqualsDouble(overview.boundingBox.minLon, 34.0, 0.001)
      assertEqualsDouble(overview.boundingBox.maxLon, 52.0, 0.001)

  test("analyzeCorridors finds connected locations"):
    for
      geo <- GeoSpatialEngine.make[IO]
      _ <- geo.recordEvent(event("a1", 51.389, 35.689, Some("Tehran")))
      _ <- geo.recordEvent(event("a2", 51.677, 32.655, Some("Isfahan")))
      _ <- geo.recordEvent(event("a3", 51.389, 35.689, Some("Tehran")))
      _ <- geo.recordEvent(event("a4", 51.677, 32.655, Some("Isfahan")))
      corridors <- geo.analyzeCorridors(windowHours = 48)
    yield
      assert(corridors.nonEmpty, "Should find Tehran-Isfahan corridor")

end GeoSpatialSpec
