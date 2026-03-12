import type { Metadata } from 'next';

import { Capabilities } from '@/features/browse/components/landing/Capabilities';
import { Faq } from '@/features/browse/components/landing/Faq';
import { FooterCta } from '@/features/browse/components/landing/FooterCta';
import { Hero } from '@/features/browse/components/landing/Hero';
import { HowItWorks } from '@/features/browse/components/landing/HowItWorks';
import { JsonLd } from '@/features/browse/components/landing/JsonLd';
import { OpenSource } from '@/features/browse/components/landing/OpenSource';
import { Screenshot } from '@/features/browse/components/landing/Screenshot';
import { StatsBar } from '@/features/browse/components/landing/StatsBar';
import { WhoItsFor } from '@/features/browse/components/landing/WhoItsFor';

export const metadata: Metadata = {
  title: 'Conflicts.app — Free Open-Source Iran Conflict Dashboard | Pharos',
  description:
    'Free open-source dashboard tracking the Iran conflict in real time. Interactive strike map, AI intelligence briefs, escalation scoring, and actor tracking across 10+ factions. No signup required.',
  openGraph: {
    title: 'Conflicts.app — Free Open-Source Iran Conflict Dashboard',
    description:
      'Track the Iran conflict in real time. Interactive strike map, AI briefs, escalation scoring, actor intelligence. Free and open source.',
    url: 'https://www.conflicts.app/browse',
    images: [{ url: '/og-image-1200x630.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conflicts.app — Free Open-Source Iran Conflict Dashboard',
    description:
      'Track the Iran conflict in real time. Interactive strike map, AI briefs, escalation scoring, actor intelligence. Free and open source.',
    images: ['/og-image-1200x630.jpg'],
  },
  alternates: {
    canonical: 'https://www.conflicts.app/browse',
  },
};

export default function BrowsePage() {
  return (
    <>
      <JsonLd />
      <Hero />
      <Screenshot />
      <StatsBar />
      <Capabilities />
      <HowItWorks />
      <WhoItsFor />
      <OpenSource />
      <Faq />
      <FooterCta />
    </>
  );
}
