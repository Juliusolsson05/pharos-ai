import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Signals',
};

export default function SignalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
