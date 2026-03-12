import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brief',
};

export default function BriefLayout({ children }: { children: React.ReactNode }) {
  return children;
}
