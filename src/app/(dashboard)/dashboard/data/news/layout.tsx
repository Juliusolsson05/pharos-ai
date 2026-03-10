import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'News Monitor',
};

export default function NewsDataLayout({ children }: { children: React.ReactNode }) {
  return children;
}
