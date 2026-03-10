import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Actors',
};

export default function ActorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
