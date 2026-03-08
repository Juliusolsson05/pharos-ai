package pharos.api

import cats.effect.*
import io.circe.*
import io.circe.syntax.*
import org.http4s.*
import org.http4s.circe.*
import org.http4s.dsl.Http4sDsl

/** Lightweight API documentation endpoint.
  *
  * Serves a machine-readable JSON catalog of all engine API endpoints
  * with descriptions, methods, and parameter specs. Useful for frontend
  * developers and integration testing.
  */
object ApiDocs:

  private val endpoints: List[EndpointDoc] = List(
    // Health
    EndpointDoc("GET", "/health", "Engine health check with DB status, cluster count, and threat level"),

    // Core
    EndpointDoc("GET",  "/api/v1/engine/clusters",       "Active event clusters (paginated: ?limit=N&offset=M)"),
    EndpointDoc("GET",  "/api/v1/engine/clusters/:id",   "Single cluster detail by ID"),
    EndpointDoc("GET",  "/api/v1/engine/threat",         "Current threat assessment with escalation score and recommendation"),
    EndpointDoc("GET",  "/api/v1/engine/anomalies",      "Active anomalies with baseline statistics"),
    EndpointDoc("GET",  "/api/v1/engine/circuits",       "Circuit breaker states for all feeds"),
    EndpointDoc("GET",  "/api/v1/engine/metrics",        "Engine metrics snapshot (JSON)"),
    EndpointDoc("GET",  "/metrics",                       "Prometheus-format metrics export"),
    EndpointDoc("GET",  "/api/v1/engine/feeds",          "Configured feed sources from database"),
    EndpointDoc("POST", "/api/v1/engine/ingest",         "Trigger one-shot feed ingestion and correlation"),
    EndpointDoc("POST", "/api/v1/engine/expire",         "Expire stale clusters beyond decay window"),

    // Geospatial
    EndpointDoc("GET",  "/api/v1/engine/geo/hotspots",   "Detected geospatial hotspots"),
    EndpointDoc("GET",  "/api/v1/engine/geo/corridors",  "Activity corridors between locations"),
    EndpointDoc("GET",  "/api/v1/engine/geo/theater",    "Theater overview with bounding box and centroid"),
    EndpointDoc("GET",  "/api/v1/engine/geo/near",       "Proximity search: ?lon=N&lat=N&radius=N"),

    // Credibility
    EndpointDoc("GET",  "/api/v1/engine/credibility",    "All source credibility scores"),
    EndpointDoc("GET",  "/api/v1/engine/credibility/:id", "Credibility score for a specific feed"),

    // Escalation
    EndpointDoc("GET",  "/api/v1/engine/escalation/forecast", "EWMA-based escalation forecast with patterns"),
    EndpointDoc("GET",  "/api/v1/engine/escalation/series",   "Escalation time series (paginated)"),

    // Narrative
    EndpointDoc("POST", "/api/v1/engine/sitrep/generate", "Generate a full SITREP from current engine state"),
    EndpointDoc("GET",  "/api/v1/engine/sitrep/history",  "Previous SITREP summaries"),
    EndpointDoc("POST", "/api/v1/engine/flash/:clusterId", "Generate a flash report for a critical cluster"),

    // Analysis
    EndpointDoc("GET",  "/api/v1/engine/contradictions",  "Active cross-source contradictions (paginated)"),
    EndpointDoc("GET",  "/api/v1/engine/chains",          "Detected causal event chains (paginated)"),
    EndpointDoc("GET",  "/api/v1/engine/chains/graph",    "Event graph (nodes + edges) for visualization"),
    EndpointDoc("GET",  "/api/v1/engine/chains/event/:id", "Chains involving a specific event"),

    // Alerts
    EndpointDoc("GET",  "/api/v1/engine/alerts",           "Active (unacknowledged) alerts"),
    EndpointDoc("GET",  "/api/v1/engine/alerts/history",   "Alert history (paginated)"),
    EndpointDoc("POST", "/api/v1/engine/alerts/:id/ack",   "Acknowledge an alert"),

    // Composite Threat
    EndpointDoc("GET",  "/api/v1/engine/threat/composite",  "Multi-factor composite threat score with factor decomposition and confidence intervals"),

    // Temporal
    EndpointDoc("GET",  "/api/v1/engine/temporal/profile",  "Temporal activity profile with burst detection and type distribution"),
    EndpointDoc("GET",  "/api/v1/engine/temporal/patterns", "Active temporal patterns (surges, night ops, rapid response, escalation)"),
    EndpointDoc("GET",  "/api/v1/engine/temporal/hourly",   "24-hour activity distribution by hour (UTC)"),

    // Source Network
    EndpointDoc("GET",  "/api/v1/engine/network/graph",         "Source relationship graph (nodes + edges with co-reporting weights)"),
    EndpointDoc("GET",  "/api/v1/engine/network/echo-chambers", "Detected echo chambers — correlated source groups by perspective"),
    EndpointDoc("GET",  "/api/v1/engine/network/coverage",      "Coverage analysis with independence score and perspective gaps"),
    EndpointDoc("GET",  "/api/v1/engine/network/pairs",         "Top co-reporting source pairs with Jaccard similarity"),

    // Phase History
    EndpointDoc("GET",  "/api/v1/engine/phases",               "Escalation phase transition history with rung changes and triggers"),

    // Strategic Game Model
    EndpointDoc("GET",  "/api/v1/engine/strategy/state",      "Current conflict state with actor positions and event counts"),
    EndpointDoc("GET",  "/api/v1/engine/strategy/scenarios",   "Top-N most likely scenarios with consequences and counter-moves"),
    EndpointDoc("GET",  "/api/v1/engine/strategy/ladder",      "Escalation ladder with 7 rungs and current position"),
    EndpointDoc("GET",  "/api/v1/engine/strategy/assessment",  "Full strategic assessment with actors, indicators, windows, and scenarios"),

    // Streaming
    EndpointDoc("GET",  "/api/v1/engine/stream",          "SSE event stream (text/event-stream)"),
    EndpointDoc("GET",  "/api/v1/engine/stream/recent",   "Recent SSE events for catch-up"),
  )

  def make[F[_]: Async]: HttpRoutes[F] =
    val dsl = Http4sDsl[F]
    import dsl.*

    HttpRoutes.of[F] {
      case GET -> Root / "docs" =>
        Ok(Json.obj(
          "service"    -> "pharos-engine".asJson,
          "version"    -> "0.8.0".asJson,
          "apiVersion" -> "v1".asJson,
          "endpoints"  -> endpoints.size.asJson,
          "catalog"    -> endpoints.map { ep =>
            Json.obj(
              "method"      -> ep.method.asJson,
              "path"        -> ep.path.asJson,
              "description" -> ep.description.asJson,
            )
          }.asJson,
        ))
    }

  private case class EndpointDoc(method: String, path: String, description: String)

end ApiDocs
