import type { Metadata } from 'next';
import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Pharos OSINT Map',
  description: 'OSINT intelligence map beta',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
