import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Perspectives',
};

export default function PerspectivesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
