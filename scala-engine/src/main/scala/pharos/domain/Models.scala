package pharos.domain

import io.circe.*
import io.circe.generic.semiauto.*
import java.time.Instant

// ── Enums mirroring Prisma schema ──────────────────────────────────

enum ThreatLevel derives CanEqual:
  case CRITICAL, HIGH, ELEVATED, MONITORING

enum Severity derives CanEqual:
  case CRITICAL, HIGH, STANDARD

enum EventType derives CanEqual:
  case MILITARY, DIPLOMATIC, INTELLIGENCE, ECONOMIC, HUMANITARIAN, POLITICAL

enum Perspective derives CanEqual:
  case WESTERN, US_GOV, ISRAELI, IRANIAN, ARAB, RUSSIAN, CHINESE, INDEPENDENT, INTL_ORG

enum SignificanceLevel derives CanEqual:
  case BREAKING, HIGH, STANDARD

enum VerificationStatus derives CanEqual:
  case UNVERIFIED, VERIFIED, FAILED, PARTIAL, SKIPPED

// ── Core domain models ─────────────────────────────────────────────

/** A raw feed item ingested from an RSS source. */
final case class RawFeedItem(
  feedId:         String,
  title:          String,
  link:           String,
  pubDate:        Instant,
  contentSnippet: Option[String],
  creator:        Option[String],
  categories:     List[String],
  imageUrl:       Option[String],
)

/** An RSS feed source configuration. */
final case class FeedSource(
  id:          String,
  name:        String,
  url:         String,
  perspective: Perspective,
  country:     String,
  tags:        List[String],
  stateFunded: Boolean,
  tier:        Int,
)

/** A correlated event cluster — multiple signals referring to the same real-world event. */
final case class EventCluster(
  id:              String,
  canonicalTitle:   String,
  severity:        Severity,
  eventType:       EventType,
  location:        Option[String],
  firstSeen:       Instant,
  lastUpdated:     Instant,
  sourceCount:     Int,
  perspectives:    Set[Perspective],
  feedItemLinks:   List[String],
  confidenceScore: Double,        // 0.0 – 1.0
  threatDelta:     Double,        // escalation signal: positive = escalating
  keywords:        Set[String],
  summary:         Option[String],
)

/** Threat assessment for a time window. */
final case class ThreatAssessment(
  timestamp:         Instant,
  overallLevel:      ThreatLevel,
  escalationScore:   Double,       // –1.0 (de-escalating) to +1.0 (escalating)
  activeClusterCount: Int,
  topClusters:       List[EventCluster],
  perspectiveBias:   Map[Perspective, Double], // how much each perspective is represented
  recommendation:    String,
)

/** Correlation result returned by the engine. */
final case class CorrelationResult(
  clusterId:    String,
  isNew:        Boolean,
  confidence:   Double,
  matchedOn:    List[String],  // which features triggered the match
)

// ── JSON codecs ────────────────────────────────────────────────────

object Codecs:
  // Enum codecs
  given Encoder[ThreatLevel]        = Encoder.encodeString.contramap(_.toString)
  given Decoder[ThreatLevel]        = Decoder.decodeString.emap(s =>
    ThreatLevel.values.find(_.toString == s).toRight(s"Invalid ThreatLevel: $s"))

  given Encoder[Severity]           = Encoder.encodeString.contramap(_.toString)
  given Decoder[Severity]           = Decoder.decodeString.emap(s =>
    Severity.values.find(_.toString == s).toRight(s"Invalid Severity: $s"))

  given Encoder[EventType]          = Encoder.encodeString.contramap(_.toString)
  given Decoder[EventType]          = Decoder.decodeString.emap(s =>
    EventType.values.find(_.toString == s).toRight(s"Invalid EventType: $s"))

  given Encoder[Perspective]        = Encoder.encodeString.contramap(_.toString)
  given Decoder[Perspective]        = Decoder.decodeString.emap(s =>
    Perspective.values.find(_.toString == s).toRight(s"Invalid Perspective: $s"))

  given Encoder[SignificanceLevel]  = Encoder.encodeString.contramap(_.toString)
  given Decoder[SignificanceLevel]  = Decoder.decodeString.emap(s =>
    SignificanceLevel.values.find(_.toString == s).toRight(s"Invalid SignificanceLevel: $s"))

  given Encoder[VerificationStatus] = Encoder.encodeString.contramap(_.toString)
  given Decoder[VerificationStatus] = Decoder.decodeString.emap(s =>
    VerificationStatus.values.find(_.toString == s).toRight(s"Invalid VerificationStatus: $s"))

  given Encoder[Instant] = Encoder.encodeString.contramap(_.toString)
  given Decoder[Instant] = Decoder.decodeString.emap(s =>
    try Right(Instant.parse(s)) catch case _: Exception => Left(s"Invalid instant: $s"))

  // Model codecs
  given Encoder[RawFeedItem]        = deriveEncoder
  given Decoder[RawFeedItem]        = deriveDecoder
  given Encoder[FeedSource]         = deriveEncoder
  given Decoder[FeedSource]         = deriveDecoder
  given Encoder[EventCluster]       = deriveEncoder
  given Decoder[EventCluster]       = deriveDecoder
  given Encoder[Map[Perspective, Double]] = Encoder.instance { m =>
    io.circe.Json.obj(m.map { case (k, v) => k.toString -> io.circe.Json.fromDoubleOrNull(v) }.toSeq*)
  }
  given Decoder[Map[Perspective, Double]] = Decoder.decodeMap[String, Double].map { raw =>
    raw.flatMap { case (k, v) => Perspective.values.find(_.toString == k).map(_ -> v) }
  }
  given Encoder[ThreatAssessment]   = deriveEncoder
  given Decoder[ThreatAssessment]   = deriveDecoder
  given Encoder[CorrelationResult]  = deriveEncoder
  given Decoder[CorrelationResult]  = deriveDecoder
end Codecs
