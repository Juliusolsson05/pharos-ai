import type { Metadata } from 'next';

import { BrowsePageHeader } from '@/features/browse/components/layout/BrowsePageHeader';
import { BrowsePagination } from '@/features/browse/components/layout/BrowsePagination';
import { StructuredData } from '@/features/browse/components/seo/StructuredData';
import { StoryList } from '@/features/browse/components/stories/StoryList';
import {
  buildBrowseMetadata,
  buildDescription,
  getCanonicalListPath,
} from '@/features/browse/lib/seo';
import {
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
} from '@/features/browse/lib/structured-data';
import { getStories, STORY_PAGE_SIZE } from '@/features/browse/queries';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const path = getCanonicalListPath('/browse/stories', page);
  const title = page > 1 ? `Iran Conflict Stories - Page ${page}` : 'Iran Conflict Stories';
  const description = buildDescription('Explore Iran conflict stories covering retaliations, naval incidents, intelligence operations, and strategic developments with mapped timelines and key facts.');

  return buildBrowseMetadata({
    title,
    description,
    path,
    image: { alt: 'Iran conflict stories and mapped narratives on Conflicts.app' },
  });
}

export default async function BrowseStoriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { stories, total } = await getStories(page);
  const totalPages = Math.max(1, Math.ceil(total / STORY_PAGE_SIZE));
  const from = (page - 1) * STORY_PAGE_SIZE + 1;
  const to = Math.min(page * STORY_PAGE_SIZE, total);
  const canonicalPath = getCanonicalListPath('/browse/stories', page);

  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: 'Browse', path: '/browse' },
      { name: 'Stories', path: '/browse/stories' },
    ]),
    buildCollectionPageJsonLd({
      name: 'Iran Conflict Stories',
      description: 'Strategic Iran conflict narratives with mapped timelines, key facts, and conflict context.',
      path: canonicalPath,
    }),
    buildItemListJsonLd({
      name: 'Iran Conflict Stories',
      path: canonicalPath,
      items: stories.map((story) => ({
        name: story.title,
        url: `/browse/stories/${story.id}`,
        description: story.tagline,
      })),
    }),
  ];

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <StructuredData data={jsonLd} />
      <BrowsePageHeader crumbs={[{ label: 'Stories' }]} hasAutoRefresh />
      <header className="mt-6 mb-8">
        <p className="label mb-2">Conflict narratives</p>
        <h1 className="text-lg font-bold text-[var(--t1)] mb-1">Stories</h1>
        <p className="text-xs text-[var(--t3)]">
          {total > STORY_PAGE_SIZE ? `Showing ${from}–${to} of ${total} narratives` : `${total} narratives mapping the Iran conflict`}
        </p>
      </header>
      <StoryList stories={stories} />
      {totalPages > 1 && (
        <div className="mt-10">
          <BrowsePagination page={page} totalPages={totalPages} basePath="/browse/stories" />
        </div>
      )}
    </div>
  );
}
