import { BrowsePageHeader } from '@/features/browse/components/layout/BrowsePageHeader';

import { fmtDate, fmtTimeZ } from '@/shared/lib/format';

import type { BrowseStoryEvent } from '@/types/domain';

import { CategoryBadge } from './CategoryBadge';

type Story = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  narrative: string;
  keyFacts: string[];
  timestamp: string;
  events: BrowseStoryEvent[];
};

type Props = {
  story: Story;
};

const EVENT_COLOR: Record<string, string> = {
  STRIKE:      'var(--danger)',
  RETALIATION: 'var(--warning)',
  INTEL:       'var(--cyber)',
  NAVAL:       'var(--info)',
  POLITICAL:   'var(--success)',
};

export function StoryArticle({ story }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <BrowsePageHeader
        crumbs={[
          { label: 'Stories', href: '/browse/stories' },
          { label: story.title },
        ]}
      />

      <header className="mt-6 mb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <CategoryBadge category={story.category} />
          <span className="mono text-[10px] text-[var(--t4)]">
            {fmtDate(story.timestamp)}
          </span>
        </div>

        <h1 className="text-xl font-bold text-[var(--t1)] leading-snug mb-2">
          {story.title}
        </h1>
        <p className="text-sm text-[var(--t3)]">{story.tagline}</p>
      </header>

      <section className="mb-8">
        <p className="text-[15px] text-[var(--t2)] leading-[1.8]">
          {story.narrative}
        </p>
      </section>

      {story.keyFacts.length > 0 && (
        <section className="mb-8">
          <h2 className="label mb-3">Key facts</h2>
          <ul className="flex flex-col gap-2">
            {story.keyFacts.map((fact, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-[13px] text-[var(--t2)] leading-relaxed"
              >
                <span className="text-[var(--t4)] shrink-0 mt-0.5">&bull;</span>
                {fact}
              </li>
            ))}
          </ul>
        </section>
      )}

      {story.events.length > 0 && (
        <section>
          <h2 className="label mb-4">Timeline</h2>
          <div className="relative ml-3">
            <div className="absolute left-0 top-1 bottom-1 w-px bg-[var(--bd-s)]" />

            <div className="flex flex-col gap-4">
              {story.events.map((ev) => {
                const color = EVENT_COLOR[ev.type] ?? 'var(--t4)';
                return (
                  <div key={ev.id} className="relative pl-6">
                    <div
                      className="absolute left-[-4px] top-[6px] size-[9px] rounded-full border-2 border-[var(--bg-1)]"
                      style={{ background: color }}
                    />
                    <div className="mono text-[11px] font-medium mb-0.5" style={{ color }}>
                      {fmtTimeZ(ev.time)}
                    </div>
                    <p className="text-[13px] text-[var(--t2)] leading-relaxed">
                      {ev.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
