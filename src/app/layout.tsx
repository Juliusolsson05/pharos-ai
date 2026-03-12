import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';

import { Toaster } from '@/components/ui/sonner';

import { SITE_URL } from '@/features/browse/constants';

import { PostHogPageView } from '@/shared/lib/posthog-provider';
import { QueryProvider } from '@/shared/lib/query-provider';
import { ReduxProvider } from '@/shared/state/redux-provider';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'Conflicts.app',
  title: {
    default: 'Conflicts.app - Live Geopolitical Intelligence Dashboard',
    template: '%s | Conflicts.app',
  },
  description: 'Pharos is a live geopolitical intelligence dashboard for conflict tracking across events, actors, signals, briefs, and map-based analysis.',
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Conflicts.app',
    title: 'Conflicts.app - Live Geopolitical Intelligence Dashboard',
    description: 'Pharos is a live geopolitical intelligence dashboard for conflict tracking across events, actors, signals, briefs, and map-based analysis.',
    images: [
      {
        url: '/og-image-1200x630.jpg',
        width: 1200,
        height: 630,
        alt: 'Conflicts.app live intelligence dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conflicts.app - Live Geopolitical Intelligence Dashboard',
    description: 'Pharos is a live geopolitical intelligence dashboard for conflict tracking across events, actors, signals, briefs, and map-based analysis.',
    images: ['/og-image-1200x630.jpg'],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PostHogPageView />
        <ReduxProvider>
          <QueryProvider>
            {children}
            <Toaster theme="dark" position="bottom-right" />
          </QueryProvider>
        </ReduxProvider>
        <Analytics />
      </body>
    </html>
  );
}
