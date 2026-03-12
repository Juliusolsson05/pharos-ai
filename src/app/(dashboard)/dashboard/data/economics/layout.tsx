import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Economic Indicators',
};

export default function EconomicsDataLayout({ children }: { children: React.ReactNode }) {
  return children;
}
