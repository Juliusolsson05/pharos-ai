import { notFound } from 'next/navigation';

import type { Metadata } from 'next';

import { BriefArticle } from '@/features/browse/components/BriefArticle';
import { getBrief } from '@/features/browse/queries';

type Props = {
  params: Promise<{ day: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { day } = await params;
  const brief = await getBrief(day);
  if (!brief) return { title: 'Brief not found' };

  return {
    title: `${brief.dayLabel} — Daily Brief`,
    description: brief.summary.slice(0, 160),
    openGraph: {
      title: `${brief.dayLabel} — PHAROS Daily Brief`,
      description: brief.summary.slice(0, 160),
      url: `https://www.conflicts.app/browse/brief/${day}`,
    },
    alternates: { canonical: `https://www.conflicts.app/browse/brief/${day}` },
  };
}

export default async function BrowseBriefDayPage({ params }: Props) {
  const { day } = await params;
  const brief = await getBrief(day);

  if (!brief) notFound();

  return <BriefArticle brief={brief} />;
}
