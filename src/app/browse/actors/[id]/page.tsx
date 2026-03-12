import { notFound } from 'next/navigation';

import type { Metadata } from 'next';

import { ActorProfile } from '@/features/browse/components/actors/ActorProfile';
import { StructuredData } from '@/features/browse/components/seo/StructuredData';
import {
  buildDescription,
  buildDetailMetadata,
} from '@/features/browse/lib/seo';
import {
  buildBreadcrumbJsonLd,
  buildProfileJsonLd,
} from '@/features/browse/lib/structured-data';
import { getActor } from '@/features/browse/queries';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const actor = await getActor(id);
  if (!actor) return { title: { absolute: 'Actor not found | Conflicts.app | Pharos' } };

  const description = buildDescription(`${actor.name}. ${actor.type} actor in the Iran conflict. ${actor.assessment}`);
  return buildDetailMetadata({
    title: `${actor.name} - Iran Conflict Actor Profile`,
    description,
    path: `/browse/actors/${id}`,
    image: { alt: `${actor.name} actor profile on Conflicts.app` },
  });
}

export default async function BrowseActorPage({ params }: Props) {
  const { id } = await params;
  const actor = await getActor(id);
  if (!actor) notFound();

  const description = buildDescription(`${actor.name}. ${actor.type} actor in the Iran conflict. ${actor.assessment}`);
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: 'Browse', path: '/browse' },
      { name: 'Actors', path: '/browse/actors' },
      { name: actor.name, path: `/browse/actors/${id}` },
    ]),
    ...buildProfileJsonLd({
      name: actor.name,
      description,
      path: `/browse/actors/${id}`,
      type: actor.type,
      affiliation: actor.affiliation,
    }),
  ];

  return (
    <>
      <StructuredData data={jsonLd} />
      <ActorProfile actor={actor} />
    </>
  );
}
