import { fmt,fmtDate, fmtTimeZ } from '@/shared/lib/format';

const SIG_STYLE: Record<string, string> = {
  BREAKING: 'text-[var(--danger)] border-[var(--danger-bd)] bg-[var(--danger-dim)]',
  HIGH: 'text-[var(--warning)] border-[var(--warning-bd)] bg-[var(--warning-dim)]',
  STANDARD: 'text-[var(--info)] border-[var(--info-bd)] bg-[var(--info-dim)]',
};

type Props = {
  handle: string;
  displayName: string;
  significance: string;
  timestamp: string;
  content: string;
  likes: number;
  retweets: number;
  views: number;
  pharosNote?: string | null;
};

export function SignalCard({
  handle,
  displayName,
  significance,
  timestamp,
  content,
  likes,
  retweets,
  views,
  pharosNote,
}: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="mono text-[11px] font-bold text-[var(--t1)]">
          {displayName}
        </span>
        <span className="mono text-[10px] text-[var(--t4)]">@{handle}</span>
        <span className={`sev ml-auto ${SIG_STYLE[significance] ?? ''}`}>
          {significance}
        </span>
      </div>

      <div className="card-body">
        <p className="text-xs text-[var(--t2)] leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </div>

      <div className="card-footer">
        <span className="mono text-[10px] text-[var(--t4)]">
          {fmtDate(timestamp)} {fmtTimeZ(timestamp)}
        </span>
        <div className="flex items-center gap-3 ml-auto">
          <span className="mono text-[10px] text-[var(--t4)]">{fmt(likes)} likes</span>
          <span className="mono text-[10px] text-[var(--t4)]">{fmt(retweets)} RT</span>
          <span className="mono text-[10px] text-[var(--t4)]">{fmt(views)} views</span>
        </div>
      </div>

      {pharosNote && (
        <div className="px-3 py-2 border-t border-[var(--bd-s)] bg-[var(--blue-dim)]">
          <span className="label text-[var(--blue-l)] mr-2">PHAROS NOTE</span>
          <span className="text-xs text-[var(--t2)]">{pharosNote}</span>
        </div>
      )}
    </div>
  );
}
