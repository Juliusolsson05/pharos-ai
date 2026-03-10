import type { Metadata } from 'next';

import { BrowseBreadcrumb } from '@/features/browse/components/BrowseBreadcrumb';
import { StoryList } from '@/features/browse/components/StoryList';
import { getStories } from '@/features/browse/queries';

export const metadata: Metadata = {
  title: 'Map Stories — Iran Conflict Narratives',
  description:
    'Strategic narratives of the Iran conflict. Strike operations, retaliations, naval engagements, intelligence operations, and diplomatic developments mapped with key facts and event timelines.',
  alternates: { canonical: 'https://www.conflicts.app/browse/stories' },
};

export default async function BrowseStoriesPage() {
  const stories = await getStories();

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <BrowseBreadcrumb crumbs={[{ label: 'Stories' }]} />

      <header className="mt-6 mb-8">
        <p className="label mb-2">Conflict narratives</p>
        <h1 className="text-lg font-bold text-[var(--t1)] mb-1">Stories</h1>
        <p className="text-xs text-[var(--t3)]">
          {stories.length} narratives mapping the Iran conflict
        </p>
      </header>

      <StoryList stories={stories} />
    </div>
  );
}
