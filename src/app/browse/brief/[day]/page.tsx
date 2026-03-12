import { notFound } from 'next/navigation';

import type { Metadata } from 'next';

import { BriefArticle } from '@/features/browse/components/briefs/BriefArticle';
import { StructuredData } from '@/features/browse/components/seo/StructuredData';
import {
  buildDescription,
  buildDetailMetadata,
} from '@/features/browse/lib/seo';
import {
  buildBreadcrumbJsonLd,
  buildReportJsonLd,
} from '@/features/browse/lib/structured-data';
import { getBrief } from '@/features/browse/queries';

type Props = {
  params: Promise<{ day: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { day } = await params;
  const brief = await getBrief(day);
  if (!brief) return { title: { absolute: 'Brief not found | Conflicts.app | Pharos' } };

  const description = buildDescription(`${brief.dayLabel}. ${brief.summary} Escalation score ${brief.escalation}/100.`);
  return buildDetailMetadata({
    title: `${brief.dayLabel} - Iran Conflict Daily Brief`,
    description,
    path: `/browse/brief/${day}`,
    image: { alt: `${brief.dayLabel} daily brief on Conflicts.app` },
  });
}

export default async function BrowseBriefDayPage({ params }: Props) {
  const { day } = await params;
  const brief = await getBrief(day);
  if (!brief) notFound();

  const description = buildDescription(`${brief.dayLabel}. ${brief.summary} Escalation score ${brief.escalation}/100.`);
  const publishedAt = `${brief.day}T00:00:00.000Z`;
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: 'Browse', path: '/browse' },
      { name: 'Briefs', path: '/browse/brief' },
      { name: brief.dayLabel, path: `/browse/brief/${day}` },
    ]),
    buildReportJsonLd({
      headline: `${brief.dayLabel} - Iran Conflict Daily Brief`,
      description,
      path: `/browse/brief/${day}`,
      datePublished: publishedAt,
      dateModified: brief.updatedAt,
    }),
  ];

  return (
    <>
      <StructuredData data={jsonLd} />
      <BriefArticle brief={brief} />
    </>
  );
}
