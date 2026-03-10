import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Predictions',
};

export default function PredictionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
