import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Map',
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
