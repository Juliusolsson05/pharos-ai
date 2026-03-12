import { CasualtyTable } from '@/features/browse/components/briefs/CasualtyTable';
import { EconomicChipGrid } from '@/features/browse/components/briefs/EconomicChipGrid';
import { EscalationBar } from '@/features/browse/components/briefs/EscalationBar';
import { ScenarioCard } from '@/features/browse/components/briefs/ScenarioCard';
import { BrowsePageHeader } from '@/features/browse/components/layout/BrowsePageHeader';

import type { BrowseCasualty, BrowseEconChip, BrowseScenario } from '@/types/domain';

type Brief = {
  day: string;
  dayLabel: string;
  summary: string;
  escalation: number;
  keyFacts: string[];
  economicNarrative: string;
  casualties: BrowseCasualty[];
  economicChips: BrowseEconChip[];
  scenarios: BrowseScenario[];
};

type Props = {
  brief: Brief;
};

export function BriefArticle({ brief }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <BrowsePageHeader
        crumbs={[
          { label: 'Briefs', href: '/browse/brief' },
          { label: brief.dayLabel },
        ]}
      />

      <header className="mt-6 mb-8">
        <p className="label mb-2">Daily brief</p>
        <h1 className="text-lg font-bold text-[var(--t1)] mb-1">{brief.dayLabel}</h1>
        <p className="mono text-[10px] text-[var(--t4)] mb-4">{brief.day}</p>
        <div className="max-w-xs">
          <EscalationBar escalation={brief.escalation} />
        </div>
      </header>

      <section className="mb-8">
        <p className="text-[15px] text-[var(--t1)] leading-[1.7]">{brief.summary}</p>
      </section>

      {brief.keyFacts.length > 0 && (
        <section className="mb-8">
          <h2 className="label mb-3">Key facts</h2>
          <ul className="flex flex-col gap-2">
            {brief.keyFacts.map((fact, i) => (
              <li key={i} className="flex gap-2 text-xs text-[var(--t2)] leading-relaxed">
                <span className="text-[var(--t4)] shrink-0">&bull;</span>
                {fact}
              </li>
            ))}
          </ul>
        </section>
      )}

      {brief.casualties.length > 0 && (
        <section className="mb-8">
          <h2 className="label mb-3">Casualties</h2>
          <CasualtyTable casualties={brief.casualties} />
        </section>
      )}

      {brief.economicChips.length > 0 && (
        <section className="mb-8">
          <h2 className="label mb-3">Economic impact</h2>
          <EconomicChipGrid chips={brief.economicChips} />
          {brief.economicNarrative && (
            <p className="text-xs text-[var(--t2)] leading-relaxed mt-4">
              {brief.economicNarrative}
            </p>
          )}
        </section>
      )}

      {brief.scenarios.length > 0 && (
        <section className="mb-8">
          <h2 className="label mb-3">Scenarios</h2>
          <div className="flex flex-col gap-3">
            {brief.scenarios.map((scenario) => (
              <ScenarioCard key={scenario.label} {...scenario} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
