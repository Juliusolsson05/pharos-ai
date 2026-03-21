'use client';

import { resolveFlag } from '@/shared/lib/flags';

import 'flag-icons/css/flag-icons.min.css';

type FlagProps = {
  code?: string | null;      // ISO 3166-1 alpha-2, lowercase e.g. 'us', 'il'
  actorId?: string | null;
  size?: number;             // height in px, width auto (flags are 4:3)
  style?: React.CSSProperties;
};

export function Flag({ code, actorId, size = 20, style }: FlagProps) {
  const resolved = resolveFlag({ actorId, countryCode: code });

  if (resolved.kind === 'actor') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolved.src} alt="actor flag" className="inline-block shrink-0 rounded-sm" style={{ height: size, width: size * 4 / 3, ...style }} />;
  }

  if (resolved.kind === 'country') {
    return (
      <span
        className={`fi fi-${resolved.code} inline-block rounded-sm shrink-0 leading-none`}
        style={{ fontSize: size, ...style }}
      />
    );
  }

  return null;
}
