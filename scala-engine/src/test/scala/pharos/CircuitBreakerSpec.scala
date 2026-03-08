package pharos

import cats.effect.*
import cats.effect.unsafe.implicits.global
import munit.CatsEffectSuite
import pharos.feeds.{CircuitBreaker, CircuitOpenException, CircuitState}

class CircuitBreakerSpec extends CatsEffectSuite:

  test("allows calls when circuit is closed"):
    for
      cb     <- CircuitBreaker.make[IO](maxFailures = 3, cooldownMillis = 1000)
      result <- cb.protect("feed-1")(IO.pure(42))
    yield assertEquals(result, 42)

  test("opens circuit after max failures"):
    for
      cb <- CircuitBreaker.make[IO](maxFailures = 3, cooldownMillis = 60000)
      // Trigger 3 failures
      _ <- (1 to 3).toList.traverse_ { _ =>
        cb.protect("feed-1")(IO.raiseError(new RuntimeException("fail")))
          .handleError(_ => ())
      }
      // Next call should be rejected
      result <- cb.protect[Int]("feed-1")(IO.pure(42)).attempt
    yield
      assert(result.isLeft)
      assert(result.left.exists(_.isInstanceOf[CircuitOpenException]))

  test("different feeds have independent circuits"):
    for
      cb <- CircuitBreaker.make[IO](maxFailures = 2, cooldownMillis = 60000)
      // Break feed-1
      _ <- (1 to 2).toList.traverse_ { _ =>
        cb.protect("feed-1")(IO.raiseError(new RuntimeException("fail")))
          .handleError(_ => ())
      }
      // feed-2 should still work
      result <- cb.protect("feed-2")(IO.pure(99))
    yield assertEquals(result, 99)

  test("resets circuit on success"):
    for
      cb <- CircuitBreaker.make[IO](maxFailures = 3, cooldownMillis = 1000)
      // 2 failures (not enough to open)
      _ <- (1 to 2).toList.traverse_ { _ =>
        cb.protect("feed-1")(IO.raiseError(new RuntimeException("fail")))
          .handleError(_ => ())
      }
      // Success resets counter
      _ <- cb.protect("feed-1")(IO.pure(()))
      // 2 more failures should not open circuit (counter was reset)
      _ <- (1 to 2).toList.traverse_ { _ =>
        cb.protect("feed-1")(IO.raiseError(new RuntimeException("fail")))
          .handleError(_ => ())
      }
      result <- cb.protect("feed-1")(IO.pure(42))
    yield assertEquals(result, 42)

  test("reports circuit states"):
    for
      cb     <- CircuitBreaker.make[IO](maxFailures = 2, cooldownMillis = 60000)
      // Break feed-1
      _ <- (1 to 2).toList.traverse_ { _ =>
        cb.protect("feed-1")(IO.raiseError(new RuntimeException("fail")))
          .handleError(_ => ())
      }
      states <- cb.states
    yield
      assert(states.contains("feed-1"))
      assertEquals(states("feed-1"), CircuitState.Open)

  test("transitions to half-open after cooldown"):
    for
      cb <- CircuitBreaker.make[IO](maxFailures = 2, cooldownMillis = 1) // 1ms cooldown
      // Break circuit
      _ <- (1 to 2).toList.traverse_ { _ =>
        cb.protect("feed-1")(IO.raiseError(new RuntimeException("fail")))
          .handleError(_ => ())
      }
      // Wait for cooldown
      _ <- IO.sleep(scala.concurrent.duration.FiniteDuration(10, "millis"))
      states <- cb.states
    yield
      assertEquals(states("feed-1"), CircuitState.HalfOpen)

end CircuitBreakerSpec
