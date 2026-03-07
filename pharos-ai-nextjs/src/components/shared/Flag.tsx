'use client';
import 'flag-icons/css/flag-icons.min.css';

type FlagProps = {
  code: string;          // ISO 3166-1 alpha-2, lowercase  e.g. 'us', 'il'
  size?: number;         // height in px, width auto (flags are 4:3)
  style?: React.CSSProperties;
};

export default function Flag({ code, size = 20, style }: FlagProps) {
  return (
    <span
      className={`fi fi-${code.toLowerCase()} inline-block rounded-sm shrink-0 leading-none`}
      style={{ fontSize: size, ...style }}
    />
  );
}
