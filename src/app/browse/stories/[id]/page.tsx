import { notFound } from 'next/navigation';

import type { Metadata } from 'next';

import { StoryArticle } from '@/features/browse/components/StoryArticle';
import { getStory } from '@/features/browse/queries';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) return { title: 'Story not found' };

  return {
    title: `${story.title} — Conflict Narrative`,
    description: story.narrative.slice(0, 160),
    openGraph: {
      title: `${story.title} — PHAROS Conflict Narrative`,
      description: story.narrative.slice(0, 160),
      url: `https://www.conflicts.app/browse/stories/${id}`,
    },
    alternates: { canonical: `https://www.conflicts.app/browse/stories/${id}` },
  };
}

export default async function BrowseStoryPage({ params }: Props) {
  const { id } = await params;
  const story = await getStory(id);

  if (!story) notFound();

  return <StoryArticle story={story} />;
}
