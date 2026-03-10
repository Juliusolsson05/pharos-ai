import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prediction Markets',
};

export default function PredictionsDataLayout({ children }: { children: React.ReactNode }) {
  return children;
}
