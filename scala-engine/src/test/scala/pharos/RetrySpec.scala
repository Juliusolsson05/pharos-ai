package pharos

import cats.effect.*
import munit.CatsEffectSuite
import pharos.feeds.Retry
import org.typelevel.log4cats.Logger
import org.typelevel.log4cats.noop.NoOpLogger
import scala.concurrent.duration.*

class RetrySpec extends CatsEffectSuite:

  given Logger[IO] = NoOpLogger[IO]

  test("succeeds on first attempt without retry") {
    var attempts = 0
    val result = Retry.withPolicy(
      Retry.Policy(maxRetries = 3),
      "test",
    ) {
      IO { attempts += 1; "ok" }
    }
    result.map { r =>
      assertEquals(r, "ok")
      assertEquals(attempts, 1)
    }
  }

  test("retries on failure and succeeds") {
    var attempts = 0
    val result = Retry.withPolicy(
      Retry.Policy(maxRetries = 3, baseDelay = 10.millis, jitter = false),
      "test",
    ) {
      IO {
        attempts += 1
        if attempts < 3 then throw new RuntimeException("fail")
        else "recovered"
      }
    }
    result.map { r =>
      assertEquals(r, "recovered")
      assertEquals(attempts, 3)
    }
  }

  test("exhausts retries and raises last error") {
    val result = Retry.withPolicy(
      Retry.Policy(maxRetries = 2, baseDelay = 10.millis, jitter = false),
      "test",
    ) {
      IO.raiseError[String](new RuntimeException("always fails"))
    }
    result.attempt.map { r =>
      assert(r.isLeft)
      assertEquals(r.left.toOption.get.getMessage, "always fails")
    }
  }

  test("respects max delay cap") {
    var attempts = 0
    val start = System.currentTimeMillis()
    val result = Retry.withPolicy(
      Retry.Policy(maxRetries = 3, baseDelay = 10.millis, maxDelay = 50.millis, jitter = false),
      "test",
    ) {
      IO {
        attempts += 1
        if attempts < 4 then throw new RuntimeException("fail")
        else "done"
      }
    }
    result.map { r =>
      assertEquals(r, "done")
      val elapsed = System.currentTimeMillis() - start
      // Should not take more than ~200ms (3 retries with max 50ms delay each)
      assert(elapsed < 1000, s"Took too long: ${elapsed}ms")
    }
  }

  test("zero retries means no retry") {
    var attempts = 0
    val result = Retry.withPolicy(
      Retry.Policy(maxRetries = 0),
      "test",
    ) {
      IO {
        attempts += 1
        throw new RuntimeException("fail")
      }
    }
    result.attempt.map { r =>
      assert(r.isLeft)
      assertEquals(attempts, 1)
    }
  }

end RetrySpec
