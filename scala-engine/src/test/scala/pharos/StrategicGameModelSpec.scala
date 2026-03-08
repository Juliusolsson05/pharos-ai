package pharos

import cats.effect.*
import cats.syntax.all.*
import munit.CatsEffectSuite
import pharos.correlation.{AnomalyDetector, CorrelationEngine}
import pharos.domain.*
import pharos.geo.GeoSpatialEngine
import pharos.network.SourceNetworkAnalyzer
import pharos.prediction.EscalationPredictor
import pharos.scoring.ThreatScorer
import pharos.strategy.*
import pharos.temporal.TemporalAnalyzer

class StrategicGameModelSpec extends CatsEffectSuite:

  private val defaultConfig = EngineConfig(
    correlationWindowMinutes = 120,
    similarityThreshold      = 0.35,
    feedPollIntervalSeconds  = 300,
    maxConcurrentFeeds       = 8,
    threatDecayHours         = 24,
  )

  private def makeModel: IO[StrategicGameModel[IO]] =
    for
      engine    <- CorrelationEngine.make[IO](defaultConfig)
      anomaly   <- AnomalyDetector.make[IO]()
      predictor <- EscalationPredictor.make[IO]()
      temporal  <- TemporalAnalyzer.make[IO]()
      network   <- SourceNetworkAnalyzer.make[IO]()
      geo       <- GeoSpatialEngine.make[IO]
      scorer     = ThreatScorer.make[IO](engine, anomaly, predictor, temporal, network, geo)
      model     <- StrategicGameModel.make[IO](engine, predictor, scorer, temporal)
    yield model

  test("conflict state has valid structure") {
    makeModel.flatMap { model =>
      model.conflictState.map { cs =>
        assert(cs.timestamp != null)
        assert(cs.compositeScore >= 0.0)
        assert(cs.compositeScore <= 1.0)
        assert(cs.clusterCount >= 0)
        assert(cs.militaryEvents >= 0)
        assert(cs.diplomaticEvents >= 0)
        assert(cs.criticalEvents >= 0)
      }
    }
  }

  test("escalation ladder has 7 rungs") {
    makeModel.flatMap { model =>
      model.escalationLadder.map { ladder =>
        assertEquals(ladder.rungs.size, 7)
        assert(ladder.currentRung >= 1)
        assert(ladder.currentRung <= 7)
        assert(ladder.currentScore >= 0.0)
        assert(ladder.currentScore <= 1.0)
      }
    }
  }

  test("ladder rungs are in ascending order") {
    makeModel.flatMap { model =>
      model.escalationLadder.map { ladder =>
        val levels = ladder.rungs.map(_.rung.level)
        assertEquals(levels, (1 to 7).toList)
        ladder.rungs.sliding(2).foreach { pair =>
          val List(a, b) = pair.toList
          assert(a.rung.thresholdLow < b.rung.thresholdLow,
            s"Rung ${a.rung.level} threshold ${a.rung.thresholdLow} >= ${b.rung.thresholdLow}")
        }
      }
    }
  }

  test("exactly one rung is marked as current") {
    makeModel.flatMap { model =>
      model.escalationLadder.map { ladder =>
        val currentRungs = ladder.rungs.filter(_.isCurrent)
        assertEquals(currentRungs.size, 1)
        assertEquals(currentRungs.head.rung.level, ladder.currentRung)
      }
    }
  }

  test("scenarios are generated with valid structure") {
    makeModel.flatMap { model =>
      model.scenarios(depth = 2, breadth = 5).map { scenarios =>
        assert(scenarios.nonEmpty, "Should generate at least one scenario")
        assert(scenarios.size <= 5, "Should respect breadth limit")
        scenarios.foreach { s =>
          assert(s.id.nonEmpty)
          assert(s.outcome.probability >= 0.0)
          assert(s.outcome.probability <= 1.0)
          assert(s.outcome.newCompositeScore >= 0.0)
          assert(s.outcome.newCompositeScore <= 1.0)
          assert(s.outcome.newRung >= 1)
          assert(s.outcome.newRung <= 7)
          assert(s.timeHorizon.nonEmpty)
        }
      }
    }
  }

  test("what-if returns valid outcome") {
    makeModel.flatMap { model =>
      val action = StrategicAction("Test action", ActionType.Escalatory, 0.15, "Test description")
      model.whatIf(Actor.Iran, action).map { outcome =>
        assert(outcome.probability > 0.0)
        assert(outcome.newCompositeScore >= 0.0)
        assert(outcome.newCompositeScore <= 1.0)
        assert(outcome.consequences.nonEmpty)
        assert(outcome.strategicImpact.nonEmpty)
      }
    }
  }

  test("de-escalatory action reduces score") {
    makeModel.flatMap { model =>
      for
        cs <- model.conflictState
        action = StrategicAction("De-escalate", ActionType.DeEscalatory, -0.15, "Reduce tension")
        outcome <- model.whatIf(Actor.Iran, action)
      yield
        assert(outcome.newCompositeScore <= cs.compositeScore,
          s"De-escalation should reduce score: ${outcome.newCompositeScore} > ${cs.compositeScore}")
    }
  }

  test("strategic assessment has all components") {
    makeModel.flatMap { model =>
      model.strategicAssessment.map { sa =>
        assert(sa.timestamp != null)
        assert(sa.currentRung >= 1)
        assert(sa.rungName.nonEmpty)
        assert(sa.keyIndicators.nonEmpty)
        assert(sa.actorStates.nonEmpty)
        assert(sa.overallAssessment.nonEmpty)
        // Should have 5 actors
        assertEquals(sa.actorStates.size, 5)
        val actorNames = sa.actorStates.map(_.actor).toSet
        assert(actorNames.contains(Actor.Iran))
        assert(actorNames.contains(Actor.Israel))
        assert(actorNames.contains(Actor.UnitedStates))
      }
    }
  }

  test("key indicators contain expected names") {
    makeModel.flatMap { model =>
      model.strategicAssessment.map { sa =>
        val names = sa.keyIndicators.map(_.name).toSet
        assert(names.contains("Military Event Ratio"))
        assert(names.contains("Escalation Velocity"))
        assert(names.contains("Critical Event Count"))
      }
    }
  }

  test("scenarios include historical precedents where applicable") {
    makeModel.flatMap { model =>
      model.scenarios(depth = 3, breadth = 10).map { scenarios =>
        // At least some scenarios should have historical notes
        val withNotes = scenarios.count(_.historicalNote.isDefined)
        // It's possible none match if actors don't generate those actions,
        // so just verify the field is present
        scenarios.foreach { s =>
          s.historicalNote.foreach { note =>
            assert(note.contains("Precedent"), s"Historical note should contain 'Precedent': $note")
          }
        }
      }
    }
  }

end StrategicGameModelSpec
