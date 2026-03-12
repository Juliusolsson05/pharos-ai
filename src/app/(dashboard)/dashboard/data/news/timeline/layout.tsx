import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'News Timeline',
};

export default function NewsTimelineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
