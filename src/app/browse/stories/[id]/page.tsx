import { notFound } from 'next/navigation';

import type { Metadata } from 'next';

import { StructuredData } from '@/features/browse/components/seo/StructuredData';
import { StoryArticle } from '@/features/browse/components/stories/StoryArticle';
import {
  buildDescription,
  buildDetailMetadata,
} from '@/features/browse/lib/seo';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
} from '@/features/browse/lib/structured-data';
import { getStory } from '@/features/browse/queries';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) return { title: { absolute: 'Story not found | Conflicts.app | Pharos' } };

  const description = buildDescription(`${story.tagline} ${story.narrative}`);
  return buildDetailMetadata({
    title: `${story.title} - Iran Conflict Story`,
    description,
    path: `/browse/stories/${id}`,
    image: { alt: `${story.title} story on Conflicts.app` },
  });
}

export default async function BrowseStoryPage({ params }: Props) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) notFound();

  const description = buildDescription(`${story.tagline} ${story.narrative}`);
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: 'Browse', path: '/browse' },
      { name: 'Stories', path: '/browse/stories' },
      { name: story.title, path: `/browse/stories/${id}` },
    ]),
    buildArticleJsonLd({
      headline: story.title,
      description,
      path: `/browse/stories/${id}`,
      datePublished: story.timestamp,
      dateModified: story.updatedAt,
      articleSection: 'Stories',
      keywords: story.keyFacts,
    }),
  ];

  return (
    <>
      <StructuredData data={jsonLd} />
      <StoryArticle story={story} />
    </>
  );
}
