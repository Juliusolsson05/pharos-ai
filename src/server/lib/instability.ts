const HOUR_MS = 3_600_000;
export const SEVEN_DAYS_MS = 7 * 24 * HOUR_MS;
const BUCKET_COUNT = 24;
const BUCKET_MS = SEVEN_DAYS_MS / BUCKET_COUNT;

const EVENT_HL = 36 * HOUR_MS;
const POST_HL = 12 * HOUR_MS;
const ACTION_HL = 48 * HOUR_MS;

const EVENT_SCALE = 120;
const POST_SCALE = 45;
const ACTION_SCALE = 60;
const MOMENTUM_SCALE = 18;

const EVENT_W: Record<string, number> = { CRITICAL: 20, HIGH: 8, STANDARD: 1 };
const ACTION_W: Record<string, number> = { HIGH: 10, MEDIUM: 4, LOW: 1 };
const EVENT_SEVERITY_W: Record<string, number> = { CRITICAL: 1, HIGH: 0.65, STANDARD: 0.2 };
const POST_SEVERITY_W: Record<string, number> = { BREAKING: 0.85, HIGH: 0.45, STANDARD: 0.15 };
const ACTION_SEVERITY_W: Record<string, number> = { HIGH: 0.8, MEDIUM: 0.45, LOW: 0.2 };
const VERIF_MULT: Record<string, number> = {
  VERIFIED: 1.0, PARTIAL: 0.6, UNVERIFIED: 0.4, FAILED: 0.2, SKIPPED: 0.2,
};

type EventRow = {
  timestamp: Date;
  severity: 'CRITICAL' | 'HIGH' | 'STANDARD';
};

type PostRow = {
  timestamp: Date;
  significance: 'BREAKING' | 'HIGH' | 'STANDARD';
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'FAILED' | 'PARTIAL' | 'SKIPPED';
};

type ActionRow = {
  date: string;
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
};

export type InstabilityResult = {
  score: number;
  sparkline: number[];
  trend: 'rising' | 'falling' | 'stable';
};

function decay(ageMs: number, halfLifeMs: number): number {
  return Math.pow(0.5, ageMs / halfLifeMs);
}

function bucketIdx(tsMs: number, cutoffMs: number): number {
  const idx = Math.floor((tsMs - cutoffMs) / BUCKET_MS);
  return Math.max(0, Math.min(BUCKET_COUNT - 1, idx));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function saturating(value: number, scale: number): number {
  return 1 - Math.exp(-value / scale);
}

export function calculateInstability(
  events: EventRow[],
  xPosts: PostRow[],
  actions: ActionRow[],
  now?: Date,
): InstabilityResult {
  const nowMs = now?.getTime() ?? Date.now();
  const cutoffMs = nowMs - SEVEN_DAYS_MS;
  const buckets = new Array<number>(BUCKET_COUNT).fill(0);
  let eventScore = 0;
  let postScore = 0;
  let actionScore = 0;
  let severityNumerator = 0;
  let severityDenominator = 0;

  for (const e of events) {
    const tsMs = e.timestamp.getTime();
    if (tsMs < cutoffMs || tsMs > nowMs) continue;
    const ageMs = nowMs - tsMs;
    const base = EVENT_W[e.severity] ?? 0;
    const contribution = base * decay(ageMs, EVENT_HL);

    eventScore += contribution;
    buckets[bucketIdx(tsMs, cutoffMs)] += contribution;
    severityNumerator += contribution * (EVENT_SEVERITY_W[e.severity] ?? 0.2);
    severityDenominator += contribution;
  }

  for (const p of xPosts) {
    const tsMs = p.timestamp.getTime();
    if (tsMs < cutoffMs || tsMs > nowMs || p.significance === 'STANDARD') continue;
    const ageMs = nowMs - tsMs;
    let base: number;
    if (p.significance === 'BREAKING') {
      base = p.verificationStatus === 'VERIFIED' ? 5 : 3;
    } else {
      base = 1.5 * (VERIF_MULT[p.verificationStatus] ?? 0.4);
    }
    const contribution = base * decay(ageMs, POST_HL);

    postScore += contribution;
    buckets[bucketIdx(tsMs, cutoffMs)] += contribution;
    severityNumerator += contribution * (POST_SEVERITY_W[p.significance] ?? 0.15);
    severityDenominator += contribution;
  }

  for (const a of actions) {
    const ts = new Date(a.date + 'T00:00:00Z');
    const tsMs = ts.getTime();
    if (isNaN(tsMs) || tsMs < cutoffMs || tsMs > nowMs) continue;
    const ageMs = nowMs - tsMs;
    const base = ACTION_W[a.significance] ?? 0;
    const contribution = base * decay(ageMs, ACTION_HL);

    actionScore += contribution;
    buckets[bucketIdx(tsMs, cutoffMs)] += contribution;
    severityNumerator += contribution * (ACTION_SEVERITY_W[a.significance] ?? 0.2);
    severityDenominator += contribution;
  }

  const intensity =
    0.5 * saturating(eventScore, EVENT_SCALE) +
    0.2 * saturating(postScore, POST_SCALE) +
    0.3 * saturating(actionScore, ACTION_SCALE);
  const severityMix = severityDenominator > 0 ? severityNumerator / severityDenominator : 0;
  const half = BUCKET_COUNT / 2;
  const prior = buckets.slice(0, half).reduce((sum, value) => sum + value, 0);
  const recent = buckets.slice(half).reduce((sum, value) => sum + value, 0);
  const momentum = clamp01(0.5 + 0.5 * Math.tanh((recent - prior) / MOMENTUM_SCALE));
  const score = Math.round(100 * (0.55 * intensity + 0.25 * momentum + 0.2 * severityMix));
  const trend: InstabilityResult['trend'] =
    recent - prior > MOMENTUM_SCALE * 0.35
      ? 'rising'
      : recent - prior < -MOMENTUM_SCALE * 0.35
        ? 'falling'
        : 'stable';

  return { score, sparkline: buckets, trend };
}
