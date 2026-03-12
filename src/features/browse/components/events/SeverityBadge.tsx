const SEV_CLASS: Record<string, string> = {
  CRITICAL: 'sev sev-crit',
  HIGH: 'sev sev-high',
  STANDARD: 'sev sev-std',
};

type Props = {
  severity: string;
};

export function SeverityBadge({ severity }: Props) {
  return (
    <span className={SEV_CLASS[severity] ?? 'sev sev-std'}>
      {severity}
    </span>
  );
}
