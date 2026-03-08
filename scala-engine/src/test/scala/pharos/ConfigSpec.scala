package pharos

import munit.FunSuite
import pharos.domain.EngineConfig

class ConfigSpec extends FunSuite:

  val validConfig: EngineConfig = EngineConfig(
    correlationWindowMinutes = 120,
    similarityThreshold      = 0.35,
    feedPollIntervalSeconds  = 300,
    maxConcurrentFeeds       = 8,
    threatDecayHours         = 24,
  )

  test("valid config produces no errors") {
    assertEquals(validConfig.validate, List.empty)
  }

  test("detects invalid correlation window") {
    val bad = validConfig.copy(correlationWindowMinutes = 0)
    assert(bad.validate.nonEmpty)
    assert(bad.validate.head.contains("correlationWindowMinutes"))
  }

  test("detects invalid similarity threshold") {
    val tooHigh = validConfig.copy(similarityThreshold = 1.5)
    assert(tooHigh.validate.nonEmpty)
    val tooLow = validConfig.copy(similarityThreshold = -0.1)
    assert(tooLow.validate.nonEmpty)
  }

  test("detects invalid poll interval") {
    val bad = validConfig.copy(feedPollIntervalSeconds = 5)
    assert(bad.validate.nonEmpty)
  }

  test("detects invalid concurrent feeds") {
    val bad = validConfig.copy(maxConcurrentFeeds = 100)
    assert(bad.validate.nonEmpty)
  }

  test("detects invalid decay hours") {
    val bad = validConfig.copy(threatDecayHours = 0)
    assert(bad.validate.nonEmpty)
  }

  test("validated throws on invalid config") {
    val bad = validConfig.copy(correlationWindowMinutes = -1, similarityThreshold = 2.0)
    intercept[IllegalArgumentException] {
      EngineConfig.validated(bad)
    }
  }

  test("multiple errors collected") {
    val bad = validConfig.copy(
      correlationWindowMinutes = -1,
      similarityThreshold      = 2.0,
      feedPollIntervalSeconds  = 1,
    )
    assertEquals(bad.validate.size, 3)
  }

end ConfigSpec
