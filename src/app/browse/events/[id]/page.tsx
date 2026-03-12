import { notFound } from 'next/navigation';

import type { Metadata } from 'next';

import { EventArticle } from '@/features/browse/components/events/EventArticle';
import { StructuredData } from '@/features/browse/components/seo/StructuredData';
import {
  buildDescription,
  buildDetailMetadata,
} from '@/features/browse/lib/seo';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
} from '@/features/browse/lib/structured-data';
import { getEvent, getXPostsByEvent } from '@/features/browse/queries';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: { absolute: 'Event not found | Conflicts.app | Pharos' } };

  const description = buildDescription(`${event.summary} ${event.location}. ${event.type} event in the Iran conflict.`);
  return buildDetailMetadata({
    title: `${event.title} - Iran Conflict Event`,
    description,
    path: `/browse/events/${id}`,
    image: { alt: `${event.title} on Conflicts.app` },
  });
}

export default async function BrowseEventPage({ params }: Props) {
  const { id } = await params;
  const [event, xPosts] = await Promise.all([getEvent(id), getXPostsByEvent(id)]);
  if (!event) notFound();

  const signals = xPosts.map((p) => ({
    handle: p.handle,
    displayName: p.displayName,
    significance: p.significance,
    timestamp: p.timestamp,
    content: p.content,
    likes: p.likes,
    retweets: p.retweets,
    views: p.views,
    pharosNote: p.pharosNote,
  }));

  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: 'Browse', path: '/browse' },
      { name: 'Events', path: '/browse/events' },
      { name: event.title, path: `/browse/events/${id}` },
    ]),
    buildArticleJsonLd({
      headline: event.title,
      description: buildDescription(event.summary),
      path: `/browse/events/${id}`,
      datePublished: event.timestamp,
      dateModified: event.updatedAt,
      articleSection: 'Events',
      keywords: event.tags,
    }),
  ];

  return (
    <>
      <StructuredData data={jsonLd} />
      <EventArticle event={event} signals={signals} />
    </>
  );
}
