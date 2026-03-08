package pharos.strategy

import cats.effect.*
import cats.effect.std.AtomicCell
import cats.syntax.all.*
import pharos.correlation.CorrelationEngine
import pharos.domain.*
import pharos.prediction.{EscalationForecast, EscalationPredictor, EscalationTrend}
import pharos.scoring.{CompositeThreat, ThreatScorer}
import pharos.temporal.{TemporalAnalyzer, TemporalPattern}
import java.time.{Duration, Instant}

/** Multi-actor strategic game model for conflict scenario analysis.
  *
  * Models the conflict as a multi-player game with:
  *   - Actor state: objectives, capabilities, constraints, posture
  *   - Action space: what each actor can do given current state
  *   - Consequence propagation: how actions cascade through the system
  *   - Scenario branching: top-N most likely escalation paths
  *   - Equilibrium detection: stable states where no actor benefits from changing strategy
  *
  * This is the "why/what-if" layer on top of the "what/when" observation layer.
  */
trait StrategicGameModel[F[_]]:
  /** Get the current conflict state with all actor positions. */
  def conflictState: F[ConflictState]

  /** Evaluate the N most likely scenarios from current state. */
  def scenarios(depth: Int = 3, breadth: Int = 5): F[List[Scenario]]

  /** Evaluate consequences of a specific actor taking a specific action. */
  def whatIf(actor: Actor, action: StrategicAction): F[ScenarioOutcome]

  /** Get the escalation ladder — ordered thresholds with current position. */
  def escalationLadder: F[EscalationLadder]

  /** Get strategic assessment — synthesized from all analytical outputs. */
  def strategicAssessment: F[StrategicAssessment]

object StrategicGameModel:

  def make[F[_]: Async](
    engine:    CorrelationEngine[F],
    predictor: EscalationPredictor[F],
    scorer:    ThreatScorer[F],
    temporal:  TemporalAnalyzer[F],
  ): F[StrategicGameModel[F]] =
    AtomicCell[F].of(GameState.empty).map { state =>
      new StrategicGameModelImpl[F](engine, predictor, scorer, temporal, state)
    }

  // ── Iran conflict actor definitions ──────────────────────────────

  private val actors: List[ActorProfile] = List(
    ActorProfile(
      actor       = Actor.Iran,
      objectives  = List("Nuclear program continuity", "Regional influence via proxies", "Sanctions relief", "Regime survival"),
      capabilities = List("Ballistic missiles", "Proxy networks (Hezbollah, Houthis, PMF)", "Cyber operations", "Strait of Hormuz leverage", "Nuclear enrichment"),
      constraints  = List("Economic isolation", "Internal dissent", "Air defense gaps", "Limited conventional navy"),
      posture     = Posture.Defensive,
    ),
    ActorProfile(
      actor       = Actor.Israel,
      objectives  = List("Prevent Iranian nuclear weapon", "Neutralize proxy threats", "Regional normalization", "Deterrence credibility"),
      capabilities = List("Precision air strikes", "Intelligence (Mossad/8200)", "Iron Dome / Arrow", "Nuclear ambiguity", "Cyber (Unit 8200)"),
      constraints  = List("International legitimacy pressure", "Multi-front threat", "Hostage situations", "US relationship management"),
      posture     = Posture.Offensive,
    ),
    ActorProfile(
      actor       = Actor.UnitedStates,
      objectives  = List("Prevent regional war", "Non-proliferation", "Protect allies", "Energy stability"),
      capabilities = List("Carrier groups", "Diplomatic leverage", "Sanctions enforcement", "Intelligence sharing", "Air refueling for Israel"),
      constraints  = List("Domestic politics", "War fatigue", "China/Russia diversion", "Iraq/Afghanistan legacy"),
      posture     = Posture.Deterrent,
    ),
    ActorProfile(
      actor       = Actor.Russia,
      objectives  = List("Maintain Iran alliance", "Counter US influence", "Arms sales", "Energy market leverage"),
      capabilities = List("UNSC veto", "S-400 sales potential", "Diplomatic cover", "Syria presence"),
      constraints  = List("Ukraine conflict drain", "Limited expeditionary capacity", "Sanctions vulnerability"),
      posture     = Posture.Opportunistic,
    ),
    ActorProfile(
      actor       = Actor.Proxies,
      objectives  = List("Territorial control", "Iranian alliance maintenance", "Deterrence against Israel"),
      capabilities = List("Rocket arsenals (150k+ Hezbollah)", "Tunnel networks", "Maritime disruption (Houthis)", "Asymmetric warfare"),
      constraints  = List("Supply chain vulnerability", "Civilian infrastructure colocation", "Limited air defense"),
      posture     = Posture.Defensive,
    ),
  )

  // ── Escalation ladder rungs ──────────────────────────────────────

  private val ladderRungs: List[LadderRung] = List(
    LadderRung(1, "Diplomatic Tensions",     "Hostile rhetoric, diplomatic recalls, UN disputes",                    0.0,  0.15),
    LadderRung(2, "Economic Warfare",        "Sanctions escalation, trade embargoes, asset freezes",                 0.15, 0.25),
    LadderRung(3, "Proxy Activation",        "Proxy forces increase operations, cross-border incidents",             0.25, 0.40),
    LadderRung(4, "Covert Operations",       "Cyber attacks, sabotage, targeted assassinations",                     0.40, 0.55),
    LadderRung(5, "Limited Strikes",         "Targeted military strikes on specific facilities or positions",        0.55, 0.70),
    LadderRung(6, "Regional Escalation",     "Multi-front conflict, sustained air campaigns, naval confrontation",   0.70, 0.85),
    LadderRung(7, "Full-Scale Conflict",     "Major military operations, potential WMD use, mass mobilization",      0.85, 1.00),
  )

  // ── Action definitions per actor ─────────────────────────────────

  private def actionsFor(actor: Actor, currentRung: Int): List[StrategicAction] =
    val baseActions = actor match
      case Actor.Iran => List(
        StrategicAction("Accelerate enrichment",           ActionType.Escalatory,    0.12, "Push enrichment toward weapons-grade (>60%)"),
        StrategicAction("Activate proxy operations",       ActionType.Escalatory,    0.15, "Direct Hezbollah/Houthis to increase attacks"),
        StrategicAction("Strait of Hormuz disruption",     ActionType.Escalatory,    0.20, "Mine or blockade the Strait to leverage oil markets"),
        StrategicAction("Cyber retaliation",               ActionType.Escalatory,    0.08, "Launch cyber attacks on Israeli/US infrastructure"),
        StrategicAction("Diplomatic engagement",           ActionType.DeEscalatory, -0.10, "Return to JCPOA-style negotiations"),
        StrategicAction("Reduce enrichment",               ActionType.DeEscalatory, -0.15, "Cap enrichment at 20% as confidence-building measure"),
        StrategicAction("Maintain status quo",             ActionType.Neutral,       0.02, "Continue current trajectory without major changes"),
      )
      case Actor.Israel => List(
        StrategicAction("Strike nuclear facilities",       ActionType.Escalatory,    0.25, "Air strikes on Natanz/Fordow/Isfahan enrichment sites"),
        StrategicAction("Targeted assassination",          ActionType.Escalatory,    0.10, "Eliminate key Iranian nuclear/military figures"),
        StrategicAction("Expand Lebanon operations",       ActionType.Escalatory,    0.18, "Major ground/air operation against Hezbollah"),
        StrategicAction("Cyber operation on centrifuges",  ActionType.Escalatory,    0.07, "Stuxnet-style sabotage of enrichment facilities"),
        StrategicAction("Accept deterrence framework",     ActionType.DeEscalatory, -0.12, "Accept containment strategy with US guarantee"),
        StrategicAction("Diplomatic normalization push",   ActionType.DeEscalatory, -0.08, "Pursue Abraham Accords expansion as alternative"),
        StrategicAction("Maintain ambiguity",              ActionType.Neutral,       0.03, "Continue covert operations without major escalation"),
      )
      case Actor.UnitedStates => List(
        StrategicAction("Deploy carrier group",            ActionType.Escalatory,    0.10, "Forward deploy additional naval assets to Persian Gulf"),
        StrategicAction("Tighten sanctions",               ActionType.Escalatory,    0.06, "Close sanctions loopholes, secondary sanctions enforcement"),
        StrategicAction("Green-light Israeli strikes",     ActionType.Escalatory,    0.22, "Provide tanker/intel support for Israeli strike on Iran"),
        StrategicAction("Propose new nuclear deal",        ActionType.DeEscalatory, -0.15, "Offer sanctions relief for enrichment limits"),
        StrategicAction("Backchannel de-escalation",       ActionType.DeEscalatory, -0.08, "Quiet diplomacy through Oman/Qatar intermediaries"),
        StrategicAction("Strategic patience",              ActionType.Neutral,       0.01, "Maintain current posture without major changes"),
      )
      case Actor.Russia => List(
        StrategicAction("Provide S-400 to Iran",           ActionType.Escalatory,    0.12, "Sell advanced air defense to complicate Israeli strikes"),
        StrategicAction("UNSC veto threats",               ActionType.Escalatory,    0.05, "Block UN action against Iran"),
        StrategicAction("Mediation offer",                 ActionType.DeEscalatory, -0.06, "Propose Russia-mediated de-escalation framework"),
        StrategicAction("Maintain distance",               ActionType.Neutral,       0.01, "Focus on Ukraine, minimal Iran involvement"),
      )
      case Actor.Proxies => List(
        StrategicAction("Mass rocket barrage",             ActionType.Escalatory,    0.20, "Hezbollah launches 1000+ rockets at northern Israel"),
        StrategicAction("Maritime escalation",             ActionType.Escalatory,    0.12, "Houthis intensify Red Sea shipping attacks"),
        StrategicAction("Ceasefire offer",                 ActionType.DeEscalatory, -0.10, "Conditional ceasefire with prisoner exchange"),
        StrategicAction("Low-intensity operations",        ActionType.Neutral,       0.04, "Continue sporadic attacks below escalation threshold"),
      )

    // Filter out actions that would jump more than 2 rungs
    baseActions.filter { action =>
      val effectiveRung = ladderRungs.indexWhere(r => r.thresholdLow <= (currentRung.toDouble / 7.0 + action.escalationDelta).max(0.0).min(1.0) &&
        r.thresholdHigh > (currentRung.toDouble / 7.0 + action.escalationDelta).max(0.0).min(1.0))
      math.abs(effectiveRung - currentRung) <= 2 || action.escalationDelta < 0
    }

  // ── Implementation ───────────────────────────────────────────────

  private case class GameState(
    lastAssessment: Option[StrategicAssessment],
    scenarioCache:  List[Scenario],
    lastComputed:   Instant,
  )

  private object GameState:
    val empty: GameState = GameState(None, List.empty, Instant.EPOCH)

  private class StrategicGameModelImpl[F[_]: Async](
    engine:    CorrelationEngine[F],
    predictor: EscalationPredictor[F],
    scorer:    ThreatScorer[F],
    temporal:  TemporalAnalyzer[F],
    state:     AtomicCell[F, GameState],
  ) extends StrategicGameModel[F]:

    override def conflictState: F[ConflictState] =
      for
        clusters  <- engine.activeClusters
        composite <- scorer.compositeThreat
        forecast  <- predictor.forecast
        patterns  <- temporal.detectPatterns
      yield buildConflictState(clusters, composite, forecast, patterns)

    override def scenarios(depth: Int, breadth: Int): F[List[Scenario]] =
      conflictState.map { cs =>
        val currentRung = currentLadderRung(cs.compositeScore)
        generateScenarios(cs, currentRung, depth, breadth)
      }

    override def whatIf(actor: Actor, action: StrategicAction): F[ScenarioOutcome] =
      conflictState.map { cs =>
        evaluateAction(cs, actor, action)
      }

    override def escalationLadder: F[EscalationLadder] =
      for
        composite <- scorer.compositeThreat
        forecast  <- predictor.forecast
      yield
        val score = composite.compositeScore
        val currentRung = currentLadderRung(score)
        val annotated = ladderRungs.map { rung =>
          val isCurrent = rung.level == currentRung
          val momentum = if forecast.trend == EscalationTrend.Accelerating then "RISING"
            else if forecast.trend == EscalationTrend.Escalating then "RISING_SLOW"
            else if forecast.trend == EscalationTrend.DeEscalating then "FALLING"
            else if forecast.trend == EscalationTrend.Cooling then "FALLING_SLOW"
            else "STABLE"
          AnnotatedRung(rung, isCurrent, if isCurrent then Some(momentum) else None)
        }
        EscalationLadder(
          currentRung   = currentRung,
          currentScore  = score,
          momentum      = forecast.trend.toString,
          rungs         = annotated,
          nextThreshold = ladderRungs.find(_.level == currentRung + 1).map(_.thresholdLow),
          prevThreshold = ladderRungs.find(_.level == currentRung).map(_.thresholdLow),
        )

    override def strategicAssessment: F[StrategicAssessment] =
      for
        cs       <- conflictState
        ladder   <- escalationLadder
        scns     <- scenarios(depth = 3, breadth = 5)
        forecast <- predictor.forecast
      yield
        val rung = ladder.currentRung
        val rungInfo = ladderRungs.lift(rung - 1)

        // Key indicators to watch
        val indicators = buildIndicators(cs, forecast)

        // Strategic windows (time-sensitive opportunities)
        val windows = buildWindows(cs, forecast, rung)

        // Actor assessments
        val actorStates = actors.map { profile =>
          val relevantClusters = cs.activeClusters.filter(c =>
            actorRelevance(c, profile.actor)
          )
          ActorState(
            actor         = profile.actor,
            posture       = inferPosture(profile, cs),
            recentActions = relevantClusters.take(3).map(_.canonicalTitle),
            capabilities  = profile.capabilities,
            constraints   = profile.constraints,
            threatTo      = actorThreats(profile.actor, cs),
          )
        }

        StrategicAssessment(
          timestamp         = Instant.now(),
          currentRung       = rung,
          rungName          = rungInfo.map(_.name).getOrElse("Unknown"),
          compositeScore    = cs.compositeScore,
          momentum          = forecast.trend.toString,
          keyIndicators     = indicators,
          strategicWindows  = windows,
          actorStates       = actorStates,
          topScenarios      = scns.take(5),
          overallAssessment = buildOverallAssessment(cs, rung, forecast),
        )

    // ── Scenario generation ────────────────────────────────────────

    private def generateScenarios(cs: ConflictState, currentRung: Int, depth: Int, breadth: Int): List[Scenario] =
      // For each actor, generate most likely actions and their consequences
      val allMoves = actors.flatMap { profile =>
        val actions = actionsFor(profile.actor, currentRung)
        actions.map { action =>
          val outcome = evaluateAction(cs, profile.actor, action)
          (profile.actor, action, outcome)
        }
      }

      // Score and rank scenarios by probability × impact
      val ranked = allMoves
        .sortBy { case (_, action, outcome) =>
          -(outcome.probability * math.abs(outcome.escalationDelta))
        }
        .take(breadth)

      // Build scenario chains (depth > 1 means counter-responses)
      ranked.zipWithIndex.map { case ((actor, action, outcome), idx) =>
        val counterMoves = if depth > 1 then
          // Who would respond to this action?
          val responders = actors.filter(_.actor != actor).take(2)
          responders.flatMap { responder =>
            val counterActions = actionsFor(responder.actor, currentRung)
            // Pick most likely counter-action
            counterActions
              .sortBy(a => -math.abs(a.escalationDelta))
              .headOption
              .map { counter =>
                CounterMove(responder.actor, counter, evaluateAction(cs, responder.actor, counter))
              }
          }
        else List.empty

        Scenario(
          id             = s"scenario-${idx + 1}",
          initiator      = actor,
          action         = action,
          outcome        = outcome,
          counterMoves   = counterMoves,
          netEscalation  = outcome.escalationDelta + counterMoves.map(_.outcome.escalationDelta).sum,
          timeHorizon    = if action.actionType == ActionType.Escalatory then "24-72h" else "1-2 weeks",
          historicalNote = historicalPrecedent(actor, action),
        )
      }

    private def evaluateAction(cs: ConflictState, actor: Actor, action: StrategicAction): ScenarioOutcome =
      val baseScore = cs.compositeScore
      val newScore  = (baseScore + action.escalationDelta).max(0.0).min(1.0)
      val newRung   = currentLadderRung(newScore)
      val oldRung   = currentLadderRung(baseScore)

      // Probability estimation based on actor posture and action type
      val posture = actors.find(_.actor == actor).map(_.posture).getOrElse(Posture.Neutral)
      val baseProbability = (posture, action.actionType) match
        case (Posture.Offensive, ActionType.Escalatory)     => 0.65
        case (Posture.Offensive, ActionType.DeEscalatory)   => 0.15
        case (Posture.Defensive, ActionType.Escalatory)     => 0.30
        case (Posture.Defensive, ActionType.DeEscalatory)   => 0.40
        case (Posture.Deterrent, ActionType.Escalatory)     => 0.35
        case (Posture.Deterrent, ActionType.DeEscalatory)   => 0.30
        case (Posture.Opportunistic, ActionType.Escalatory) => 0.45
        case (_, ActionType.Neutral)                        => 0.50
        case _                                              => 0.30

      // Adjust probability based on current escalation level
      val levelAdjust = if action.actionType == ActionType.Escalatory then
        baseScore * 0.2 // higher escalation = higher probability of further escalation
      else
        (1.0 - baseScore) * 0.15 // lower escalation = easier to de-escalate

      val probability = (baseProbability + levelAdjust).min(0.95).max(0.05)

      // Consequences
      val consequences = buildConsequences(actor, action, oldRung, newRung)

      ScenarioOutcome(
        newCompositeScore = newScore,
        newRung           = newRung,
        escalationDelta   = action.escalationDelta,
        probability       = probability,
        consequences      = consequences,
        strategicImpact   = assessStrategicImpact(actor, action, newRung - oldRung),
      )

    private def buildConsequences(actor: Actor, action: StrategicAction, oldRung: Int, newRung: Int): List[Consequence] =
      val cs = List.newBuilder[Consequence]

      if newRung > oldRung then
        cs += Consequence("Escalation", s"Conflict escalates from rung $oldRung to $newRung", ConsequenceType.Security, "HIGH")
        if newRung >= 5 then
          cs += Consequence("Civilian risk", "Significant risk of civilian casualties in affected zones", ConsequenceType.Humanitarian, "CRITICAL")
        if newRung >= 6 then
          cs += Consequence("Oil price spike", "Expected 15-30% oil price increase from regional instability", ConsequenceType.Economic, "HIGH")
          cs += Consequence("Refugee flows", "Potential mass displacement from conflict zones", ConsequenceType.Humanitarian, "HIGH")
      else if newRung < oldRung then
        cs += Consequence("De-escalation", s"Tension reduction from rung $oldRung to $newRung", ConsequenceType.Security, "POSITIVE")
        cs += Consequence("Market stabilization", "Reduced risk premium on energy markets", ConsequenceType.Economic, "POSITIVE")

      actor match
        case Actor.Iran if action.actionType == ActionType.Escalatory =>
          cs += Consequence("Sanctions response", "Likely additional US/EU sanctions within days", ConsequenceType.Economic, "MEDIUM")
          cs += Consequence("Proxy activation", "Hezbollah/Houthi operations may intensify within 48h", ConsequenceType.Security, "HIGH")
        case Actor.Israel if action.actionType == ActionType.Escalatory =>
          cs += Consequence("Retaliation risk", "Iran/proxies highly likely to retaliate within 24-72h", ConsequenceType.Security, "CRITICAL")
          cs += Consequence("International reaction", "UNSC emergency session, calls for restraint", ConsequenceType.Diplomatic, "MEDIUM")
        case Actor.UnitedStates if action.actionType == ActionType.Escalatory =>
          cs += Consequence("Alliance signal", "Strong deterrence signal to adversaries", ConsequenceType.Diplomatic, "MEDIUM")
          cs += Consequence("Overextension risk", "Military commitment diversion from Indo-Pacific", ConsequenceType.Security, "MEDIUM")
        case _ => ()

      cs.result()

    private def assessStrategicImpact(actor: Actor, action: StrategicAction, rungDelta: Int): String =
      if rungDelta >= 2 then
        s"CRITICAL: ${actor} action '${action.name}' risks major escalation jump. Immediate international intervention likely."
      else if rungDelta == 1 then
        s"HIGH: ${actor} action moves conflict to next escalation level. Counter-responses expected within 24-72h."
      else if rungDelta == 0 then
        s"MODERATE: ${actor} action maintains current escalation level with localized effects."
      else if rungDelta == -1 then
        s"POSITIVE: ${actor} action reduces tension by one level. Creates window for diplomatic engagement."
      else
        s"SIGNIFICANT DE-ESCALATION: ${actor} action could break escalation cycle. Requires reciprocal response to sustain."

    // ── Helper functions ───────────────────────────────────────────

    private def currentLadderRung(score: Double): Int =
      ladderRungs.findLast(r => score >= r.thresholdLow).map(_.level).getOrElse(1)

    private def buildConflictState(
      clusters:  List[EventCluster],
      composite: CompositeThreat,
      forecast:  EscalationForecast,
      patterns:  List[TemporalPattern],
    ): ConflictState =
      val militaryCount    = clusters.count(_.eventType == EventType.MILITARY)
      val diplomaticCount  = clusters.count(_.eventType == EventType.DIPLOMATIC)
      val criticalCount    = clusters.count(_.severity == Severity.CRITICAL)

      ConflictState(
        timestamp       = Instant.now(),
        compositeScore  = composite.compositeScore,
        threatLevel     = composite.threatLevel,
        activeClusters  = clusters,
        clusterCount    = clusters.size,
        militaryEvents  = militaryCount,
        diplomaticEvents = diplomaticCount,
        criticalEvents  = criticalCount,
        escalationTrend = forecast.trend.toString,
        rateOfChange    = forecast.rateOfChange,
        activePatterns  = patterns.map(_.name),
      )

    private def inferPosture(profile: ActorProfile, cs: ConflictState): Posture =
      // Infer posture from current events related to actor
      val relevantCritical = cs.activeClusters.count(c =>
        c.severity == Severity.CRITICAL && actorRelevance(c, profile.actor)
      )
      if relevantCritical >= 2 && profile.posture == Posture.Defensive then Posture.Reactive
      else if cs.compositeScore > 0.7 && profile.posture == Posture.Opportunistic then Posture.Escalatory
      else profile.posture

    private def actorRelevance(cluster: EventCluster, actor: Actor): Boolean =
      val title = cluster.canonicalTitle.toLowerCase
      actor match
        case Actor.Iran         => title.contains("iran") || title.contains("tehran") || title.contains("irgc")
        case Actor.Israel       => title.contains("israel") || title.contains("idf") || title.contains("tel aviv")
        case Actor.UnitedStates => title.contains("us ") || title.contains("united states") || title.contains("pentagon") || title.contains("washington")
        case Actor.Russia       => title.contains("russia") || title.contains("moscow") || title.contains("kremlin")
        case Actor.Proxies      => title.contains("hezbollah") || title.contains("houthi") || title.contains("hamas") || title.contains("militia")

    private def actorThreats(actor: Actor, cs: ConflictState): List[String] =
      actor match
        case Actor.Iran         => List("Israeli strikes on nuclear facilities", "Expanded sanctions", "Internal unrest")
        case Actor.Israel       => List("Iranian retaliation", "Multi-front proxy attacks", "International isolation")
        case Actor.UnitedStates => List("Entanglement in regional war", "Energy price shock", "Alliance credibility")
        case Actor.Russia       => List("Loss of Iranian partnership", "Secondary sanctions", "Strategic irrelevance")
        case Actor.Proxies      => List("Israeli military operations", "Supply chain disruption", "Internal fragmentation")

    private def buildIndicators(cs: ConflictState, forecast: EscalationForecast): List[KeyIndicator] =
      val indicators = List.newBuilder[KeyIndicator]

      indicators += KeyIndicator(
        name      = "Military Event Ratio",
        value     = if cs.clusterCount > 0 then f"${cs.militaryEvents.toDouble / cs.clusterCount * 100}%.0f%%" else "0%",
        trend     = if cs.militaryEvents > cs.diplomaticEvents * 2 then "WARNING" else "NORMAL",
        threshold = "Military events >70% of total indicates pre-strike posture",
      )

      indicators += KeyIndicator(
        name      = "Escalation Velocity",
        value     = f"${forecast.rateOfChange}%.2f/tick",
        trend     = if forecast.rateOfChange > 0.5 then "CRITICAL" else if forecast.rateOfChange > 0.2 then "WARNING" else "NORMAL",
        threshold = "Rate >0.5 indicates rapid escalation trajectory",
      )

      indicators += KeyIndicator(
        name      = "Critical Event Count",
        value     = cs.criticalEvents.toString,
        trend     = if cs.criticalEvents >= 3 then "CRITICAL" else if cs.criticalEvents >= 1 then "WARNING" else "NORMAL",
        threshold = "3+ critical events = immediate escalation risk",
      )

      indicators += KeyIndicator(
        name      = "Active Patterns",
        value     = cs.activePatterns.size.toString,
        trend     = if cs.activePatterns.size >= 3 then "WARNING" else "NORMAL",
        threshold = "Multiple concurrent patterns suggest complex escalation dynamics",
      )

      indicators += KeyIndicator(
        name      = "Diplomatic Activity",
        value     = cs.diplomaticEvents.toString,
        trend     = if cs.diplomaticEvents == 0 && cs.militaryEvents > 3 then "CRITICAL" else "NORMAL",
        threshold = "Zero diplomatic events during military escalation = communication breakdown",
      )

      indicators.result()

    private def buildWindows(cs: ConflictState, forecast: EscalationForecast, rung: Int): List[StrategicWindow] =
      val windows = List.newBuilder[StrategicWindow]

      if forecast.trend == EscalationTrend.Stable || forecast.trend == EscalationTrend.Cooling then
        windows += StrategicWindow(
          name       = "Diplomatic Window",
          timeframe  = "Next 24-48h",
          action     = "Pursue backchannel de-escalation while momentum is neutral/positive",
          urgency    = if rung >= 4 then "HIGH" else "MEDIUM",
          expiresIf  = "Military event or proxy activation",
        )

      if rung >= 5 then
        windows += StrategicWindow(
          name       = "Escalation Prevention",
          timeframe  = "Immediate (0-6h)",
          action     = "Direct communication between parties to establish red lines",
          urgency    = "CRITICAL",
          expiresIf  = "Any major military action by either side",
        )

      if cs.militaryEvents == 0 && rung <= 3 then
        windows += StrategicWindow(
          name       = "Normalization Opportunity",
          timeframe  = "1-2 weeks",
          action     = "Low military activity creates space for confidence-building measures",
          urgency    = "LOW",
          expiresIf  = "Military escalation or major proxy attack",
        )

      if forecast.rateOfChange < -0.3 then
        windows += StrategicWindow(
          name       = "De-escalation Momentum",
          timeframe  = "Next 12-24h",
          action     = "Build on declining tension with concrete de-escalation steps",
          urgency    = "MEDIUM",
          expiresIf  = "External shock event or provocation",
        )

      windows.result()

    private def buildOverallAssessment(cs: ConflictState, rung: Int, forecast: EscalationForecast): String =
      val rungName = ladderRungs.lift(rung - 1).map(_.name).getOrElse("Unknown")
      val momentum = forecast.trend match
        case EscalationTrend.Accelerating => "rapidly escalating"
        case EscalationTrend.Escalating   => "gradually escalating"
        case EscalationTrend.Stable       => "stable"
        case EscalationTrend.Cooling      => "showing signs of cooling"
        case EscalationTrend.DeEscalating => "actively de-escalating"

      val riskStatement = rung match
        case r if r >= 6 => "CRITICAL RISK: Conflict at or near full-scale engagement. Immediate international intervention required."
        case r if r >= 5 => "HIGH RISK: Limited military strikes occurring or imminent. Escalation to regional war possible within days."
        case r if r >= 4 => "ELEVATED RISK: Covert operations and proxy warfare active. Risk of miscalculation leading to open conflict."
        case r if r >= 3 => "MODERATE RISK: Proxy forces actively engaged. Situation volatile but contained."
        case _           => "MANAGEABLE RISK: Tensions elevated but within diplomatic resolution range."

      s"STRATEGIC ASSESSMENT: Conflict at Rung $rung ($rungName), $momentum. " +
      s"Composite threat score ${f"${cs.compositeScore}%.2f"} with ${cs.clusterCount} active events " +
      s"(${cs.militaryEvents} military, ${cs.diplomaticEvents} diplomatic, ${cs.criticalEvents} critical). " +
      riskStatement

    private def historicalPrecedent(actor: Actor, action: StrategicAction): Option[String] =
      (actor, action.name) match
        case (Actor.Israel, "Strike nuclear facilities") =>
          Some("Precedent: Operation Opera (1981, Iraq Osirak), Operation Outside the Box (2007, Syria Al Kibar)")
        case (Actor.Iran, "Strait of Hormuz disruption") =>
          Some("Precedent: Tanker War (1984-88), 2019 tanker attacks in Gulf of Oman")
        case (Actor.Iran, "Activate proxy operations") =>
          Some("Precedent: 2006 Lebanon War (Hezbollah), 2023 Red Sea crisis (Houthis)")
        case (Actor.UnitedStates, "Deploy carrier group") =>
          Some("Precedent: 2019 USS Lincoln deployment, 2023 USS Ford/Eisenhower dual deployment")
        case (Actor.Israel, "Targeted assassination") =>
          Some("Precedent: Mohsen Fakhrizadeh (2020), Qasem Soleimani (2020, joint US)")
        case _ => None

  end StrategicGameModelImpl

end StrategicGameModel

// ── Public types ──────────────────────────────────────────────────

enum Actor:
  case Iran, Israel, UnitedStates, Russia, Proxies

enum Posture:
  case Offensive, Defensive, Deterrent, Opportunistic, Neutral, Reactive, Escalatory

enum ActionType:
  case Escalatory, DeEscalatory, Neutral

enum ConsequenceType:
  case Security, Economic, Humanitarian, Diplomatic

final case class ActorProfile(
  actor:        Actor,
  objectives:   List[String],
  capabilities: List[String],
  constraints:  List[String],
  posture:      Posture,
)

final case class StrategicAction(
  name:            String,
  actionType:      ActionType,
  escalationDelta: Double,
  description:     String,
)

final case class ConflictState(
  timestamp:        Instant,
  compositeScore:   Double,
  threatLevel:      ThreatLevel,
  activeClusters:   List[EventCluster],
  clusterCount:     Int,
  militaryEvents:   Int,
  diplomaticEvents: Int,
  criticalEvents:   Int,
  escalationTrend:  String,
  rateOfChange:     Double,
  activePatterns:   List[String],
)

final case class Consequence(
  name:        String,
  description: String,
  category:    ConsequenceType,
  severity:    String,
)

final case class ScenarioOutcome(
  newCompositeScore: Double,
  newRung:           Int,
  escalationDelta:   Double,
  probability:       Double,
  consequences:      List[Consequence],
  strategicImpact:   String,
)

final case class CounterMove(
  actor:   Actor,
  action:  StrategicAction,
  outcome: ScenarioOutcome,
)

final case class Scenario(
  id:             String,
  initiator:      Actor,
  action:         StrategicAction,
  outcome:        ScenarioOutcome,
  counterMoves:   List[CounterMove],
  netEscalation:  Double,
  timeHorizon:    String,
  historicalNote: Option[String],
)

final case class LadderRung(
  level:        Int,
  name:         String,
  description:  String,
  thresholdLow: Double,
  thresholdHigh: Double,
)

final case class AnnotatedRung(
  rung:     LadderRung,
  isCurrent: Boolean,
  momentum:  Option[String],
)

final case class EscalationLadder(
  currentRung:   Int,
  currentScore:  Double,
  momentum:      String,
  rungs:         List[AnnotatedRung],
  nextThreshold: Option[Double],
  prevThreshold: Option[Double],
)

final case class KeyIndicator(
  name:      String,
  value:     String,
  trend:     String,
  threshold: String,
)

final case class StrategicWindow(
  name:      String,
  timeframe: String,
  action:    String,
  urgency:   String,
  expiresIf: String,
)

final case class ActorState(
  actor:         Actor,
  posture:       Posture,
  recentActions: List[String],
  capabilities:  List[String],
  constraints:   List[String],
  threatTo:      List[String],
)

final case class StrategicAssessment(
  timestamp:         Instant,
  currentRung:       Int,
  rungName:          String,
  compositeScore:    Double,
  momentum:          String,
  keyIndicators:     List[KeyIndicator],
  strategicWindows:  List[StrategicWindow],
  actorStates:       List[ActorState],
  topScenarios:      List[Scenario],
  overallAssessment: String,
)
