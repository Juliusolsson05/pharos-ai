'use client';

import {
  useStrategicAssessment,
  useEscalationLadder,
  useStrategicScenarios,
  type KeyIndicator,
  type GameScenario,
  type AnnotatedRung,
} from '@/features/dashboard/queries/engine';

const RUNG_COLORS: Record<number, string> = {
  1: 'var(--t3)',
  2: 'var(--info)',
  3: 'var(--info)',
  4: 'var(--warning)',
  5: 'var(--warning)',
  6: 'var(--danger)',
  7: 'var(--danger)',
};

const TREND_COLORS: Record<string, string> = {
  CRITICAL: 'var(--danger)',
  WARNING:  'var(--warning)',
  NORMAL:   'var(--t3)',
  POSITIVE: 'var(--success)',
};

const ACTION_COLORS: Record<string, string> = {
  Escalatory:    'var(--danger)',
  DeEscalatory:  'var(--success)',
  Neutral:       'var(--t3)',
};

function IndicatorRow({ indicator }: { indicator: KeyIndicator }) {
  const color = TREND_COLORS[indicator.trend] ?? 'var(--t3)';
  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-2)] border border-[var(--bd)]">
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="mono text-[9px] text-[var(--t2)] w-28 truncate">{indicator.name}</span>
      <span className="mono text-[10px] font-bold flex-1" style={{ color }}>
        {indicator.value}
      </span>
      <span className="mono text-[8px] text-[var(--t4)]">{indicator.trend}</span>
    </div>
  );
}

function LadderViz({ rungs, currentRung }: { rungs: AnnotatedRung[]; currentRung: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      {[...rungs].reverse().map((r) => {
        const isCurrent = r.isCurrent;
        const color = RUNG_COLORS[r.rung.level] ?? 'var(--t3)';
        const fillPercent = isCurrent ? 100 : r.rung.level < currentRung ? 100 : 0;

        return (
          <div key={r.rung.level} className="flex items-center gap-2">
            <span className="mono text-[8px] text-[var(--t4)] w-3 text-right">{r.rung.level}</span>
            <div className="flex-1 h-2 bg-[var(--bg-2)] border border-[var(--bd)] rounded-sm overflow-hidden relative">
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${fillPercent}%`,
                  backgroundColor: color,
                  opacity: isCurrent ? 1 : 0.4,
                }}
              />
              {isCurrent && (
                <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: color, opacity: 0.15 }} />
              )}
            </div>
            <span
              className="mono text-[8px] w-32 truncate"
              style={{ color: isCurrent ? color : 'var(--t4)' }}
            >
              {r.rung.name}
            </span>
            {r.momentum && (
              <span className="mono text-[7px] px-1 rounded" style={{ backgroundColor: color, color: 'var(--bg-1)' }}>
                {r.momentum}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: GameScenario }) {
  const actionColor = ACTION_COLORS[scenario.action.actionType] ?? 'var(--t3)';
  const prob = (scenario.outcome.probability * 100).toFixed(0);

  return (
    <div className="px-2.5 py-2 bg-[var(--bg-2)] border border-[var(--bd)]" style={{ borderLeft: `3px solid ${actionColor}` }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="mono text-[9px] font-bold text-[var(--t1)]">{scenario.initiator}</span>
          <span className="mono text-[8px]" style={{ color: actionColor }}>
            {scenario.action.actionType.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="mono text-[8px] text-[var(--t4)]">{scenario.timeHorizon}</span>
          <span className="mono text-[9px] font-bold" style={{ color: actionColor }}>
            {prob}%
          </span>
        </div>
      </div>
      <div className="text-[10px] text-[var(--t1)] mb-0.5">{scenario.action.name}</div>
      <div className="text-[9px] text-[var(--t3)] mb-1">{scenario.action.description}</div>

      {/* Consequences */}
      {scenario.outcome.consequences.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {scenario.outcome.consequences.slice(0, 3).map((c, i) => (
            <span
              key={i}
              className="mono text-[7px] px-1 py-0.5 rounded bg-[var(--bg-1)] border border-[var(--bd)]"
              style={{ color: c.severity === 'CRITICAL' ? 'var(--danger)' : c.severity === 'HIGH' ? 'var(--warning)' : c.severity === 'POSITIVE' ? 'var(--success)' : 'var(--t3)' }}
            >
              {c.name}
            </span>
          ))}
        </div>
      )}

      {/* Counter-moves */}
      {scenario.counterMoves.length > 0 && (
        <div className="border-t border-[var(--bd)] pt-1 mt-1">
          <span className="mono text-[7px] text-[var(--t4)]">COUNTER-RESPONSES:</span>
          {scenario.counterMoves.map((cm, i) => (
            <div key={i} className="flex items-center gap-1.5 mt-0.5">
              <span className="mono text-[8px] text-[var(--t3)]">{cm.actor}:</span>
              <span className="text-[8px] text-[var(--t2)]">{cm.action.name}</span>
            </div>
          ))}
        </div>
      )}

      {scenario.historicalNote && (
        <div className="mono text-[7px] text-[var(--t4)] mt-1 italic">{scenario.historicalNote}</div>
      )}
    </div>
  );
}

export function StrategyWidget() {
  const { data: assessment, isLoading: aLoading } = useStrategicAssessment();
  const { data: ladder } = useEscalationLadder();
  const { data: scenarioData } = useStrategicScenarios();

  if (aLoading || !assessment) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[10px] text-[var(--t4)]">COMPUTING STRATEGIC ASSESSMENT...</span>
      </div>
    );
  }

  const rungColor = RUNG_COLORS[assessment.currentRung] ?? 'var(--t3)';
  const scenarios = scenarioData?.scenarios ?? assessment.topScenarios ?? [];

  return (
    <div className="h-full overflow-y-auto px-4 py-3 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="label text-[8px] text-[var(--t4)]">PHAROS ENGINE // STRATEGIC GAME MODEL</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: rungColor }} />
            <span className="mono text-[14px] font-bold" style={{ color: rungColor }}>
              RUNG {assessment.currentRung}: {assessment.rungName.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="label text-[8px] text-[var(--t4)]">MOMENTUM</div>
          <span className="mono text-[11px] text-[var(--t2)]">{assessment.momentum}</span>
        </div>
      </div>

      {/* Escalation Ladder */}
      {ladder && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1">ESCALATION LADDER</div>
          <LadderViz rungs={ladder.rungs} currentRung={ladder.currentRung} />
        </div>
      )}

      {/* Key Indicators */}
      {assessment.keyIndicators.length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1">KEY INDICATORS</div>
          <div className="flex flex-col gap-0.5">
            {assessment.keyIndicators.map((ind) => (
              <IndicatorRow key={ind.name} indicator={ind} />
            ))}
          </div>
        </div>
      )}

      {/* Strategic Windows */}
      {assessment.strategicWindows.length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1">STRATEGIC WINDOWS</div>
          {assessment.strategicWindows.map((w, i) => (
            <div key={i} className="px-2.5 py-1.5 bg-[var(--bg-2)] border border-[var(--bd)] mb-0.5"
                 style={{ borderLeft: `3px solid ${w.urgency === 'CRITICAL' ? 'var(--danger)' : w.urgency === 'HIGH' ? 'var(--warning)' : 'var(--info)'}` }}>
              <div className="flex items-center justify-between">
                <span className="mono text-[9px] font-bold text-[var(--t1)]">{w.name}</span>
                <span className="mono text-[8px] text-[var(--t4)]">{w.timeframe}</span>
              </div>
              <div className="text-[9px] text-[var(--t2)] mt-0.5">{w.action}</div>
              <div className="mono text-[7px] text-[var(--t4)] mt-0.5">EXPIRES IF: {w.expiresIf}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actor States */}
      {assessment.actorStates.length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1">ACTOR POSTURES</div>
          <div className="flex flex-wrap gap-1.5">
            {assessment.actorStates.map((a) => (
              <div key={a.actor} className="px-2 py-1 bg-[var(--bg-2)] border border-[var(--bd)] min-w-[120px]">
                <div className="mono text-[9px] font-bold text-[var(--t1)]">{a.actor}</div>
                <div className="mono text-[8px] text-[var(--warning)]">{a.posture}</div>
                {a.recentActions.length > 0 && (
                  <div className="text-[7px] text-[var(--t4)] mt-0.5 truncate">
                    {a.recentActions[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Scenarios */}
      {scenarios.length > 0 && (
        <div>
          <div className="label text-[8px] text-[var(--t4)] mb-1">
            TOP SCENARIOS ({scenarios.length})
          </div>
          <div className="flex flex-col gap-1">
            {scenarios.slice(0, 5).map((s) => (
              <ScenarioCard key={s.id} scenario={s} />
            ))}
          </div>
        </div>
      )}

      {/* Overall Assessment */}
      <div className="px-3 py-2 bg-[var(--bg-2)] border border-[var(--bd)] mt-auto"
           style={{ borderLeft: `3px solid ${rungColor}` }}>
        <div className="label text-[8px] mb-0.5 text-[var(--t4)]">STRATEGIC ASSESSMENT</div>
        <p className="text-[10px] text-[var(--t2)] leading-snug">
          {assessment.overallAssessment}
        </p>
      </div>
    </div>
  );
}
