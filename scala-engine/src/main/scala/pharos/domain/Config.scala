package pharos.domain

import pureconfig.*
import pureconfig.generic.derivation.default.*

/** Application configuration — loaded from application.conf or env vars. */
final case class AppConfig(
  server: ServerConfig,
  db:     DbConfig,
  engine: EngineConfig,
) derives ConfigReader

final case class ServerConfig(
  host: String,
  port: Int,
) derives ConfigReader

final case class DbConfig(
  host:     String,
  port:     Int,
  name:     String,
  user:     String,
  password: String,
) derives ConfigReader:
  def jdbcUrl: String = s"jdbc:postgresql://$host:$port/$name"

final case class EngineConfig(
  correlationWindowMinutes: Int,
  similarityThreshold:      Double,
  feedPollIntervalSeconds:  Int,
  maxConcurrentFeeds:       Int,
  threatDecayHours:         Int,
) derives ConfigReader:
  /** Validate all config values are within reasonable bounds. Returns list of violations. */
  def validate: List[String] =
    val errors = List.newBuilder[String]
    if correlationWindowMinutes < 1 || correlationWindowMinutes > 1440 then
      errors += s"correlationWindowMinutes=$correlationWindowMinutes must be 1–1440"
    if similarityThreshold < 0.0 || similarityThreshold > 1.0 then
      errors += s"similarityThreshold=$similarityThreshold must be 0.0–1.0"
    if feedPollIntervalSeconds < 10 then
      errors += s"feedPollIntervalSeconds=$feedPollIntervalSeconds must be >= 10"
    if maxConcurrentFeeds < 1 || maxConcurrentFeeds > 64 then
      errors += s"maxConcurrentFeeds=$maxConcurrentFeeds must be 1–64"
    if threatDecayHours < 1 || threatDecayHours > 168 then
      errors += s"threatDecayHours=$threatDecayHours must be 1–168"
    errors.result()

object EngineConfig:
  /** Validate and throw on invalid config. */
  def validated(config: EngineConfig): EngineConfig =
    val errors = config.validate
    if errors.nonEmpty then
      throw new IllegalArgumentException(
        s"Invalid engine config:\n${errors.map("  - " + _).mkString("\n")}"
      )
    config
