import type { Metadata } from 'next';

import { Capabilities } from '@/features/browse/components/Capabilities';
import { FooterCta } from '@/features/browse/components/FooterCta';
import { Hero } from '@/features/browse/components/Hero';
import { JsonLd } from '@/features/browse/components/JsonLd';
import { OpenSource } from '@/features/browse/components/OpenSource';
import { Screenshot } from '@/features/browse/components/Screenshot';

export const metadata: Metadata = {
  title: 'Pharos — Open-Source Iran Conflict Intelligence Dashboard',
  description:
    'Track the Iran conflict in real time. Open-source intelligence dashboard with events, actors, signals, map overlays, RSS feeds, and daily briefings.',
  openGraph: {
    title: 'Pharos — Open-Source Iran Conflict Intelligence Dashboard',
    description:
      'Track the Iran conflict in real time. Events, actors, signals, map overlays, and daily briefings — all open source.',
    url: 'https://www.conflicts.app/browse',
    images: [{ url: '/og-image-1200x630.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pharos — Open-Source Iran Conflict Intelligence Dashboard',
    description:
      'Track the Iran conflict in real time. Events, actors, signals, map overlays, and daily briefings.',
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
      <Capabilities />
      <OpenSource />
      <FooterCta />
    </>
  );
}
