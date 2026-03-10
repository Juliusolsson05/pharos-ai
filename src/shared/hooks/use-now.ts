import { useEffect, useState } from 'react';

type Props = {
  intervalMs?: number;
};

export function useNow({ intervalMs = 1000 }: Props = {}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [intervalMs]);

  return now;
}
