import './globals.css';

import { Analytics } from '@vercel/analytics/next';
import { Header } from '@/shared/components/layout/Header';
import { ViewportHeightSync } from '@/shared/components/layout/ViewportHeightSync';
import { Toaster } from '@/components/ui/sonner';
import { ReduxProvider } from '@/shared/state/redux-provider';
import { QueryProvider } from '@/shared/lib/query-provider';

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.conflicts.today'),
  applicationName: 'Conflicts.app',
  title: {
    default: 'Conflicts.app - Live Geopolitical Intelligence Dashboard',
    template: '%s | Conflicts.app',
  },
  description: 'Pharos is a live geopolitical intelligence dashboard for conflict tracking across events, actors, signals, briefs, and map-based analysis.',
  openGraph: {
    type: 'website',
    url: 'https://www.conflicts.today',
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
        <ReduxProvider>
          <QueryProvider>
            <ViewportHeightSync />
            <div className="flex flex-col min-h-0 overflow-hidden" style={{ height: 'var(--app-height)' }}>
              <Header />
              <div className="flex flex-1 min-h-0 overflow-hidden pb-[var(--safe-bottom)]">
                {children}
              </div>
            </div>
            <Toaster theme="dark" position="bottom-right" />
          </QueryProvider>
        </ReduxProvider>
        <Analytics />
      </body>
    </html>
  );
}
