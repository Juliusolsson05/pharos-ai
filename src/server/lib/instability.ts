const SEVEN_DAYS_MS = 7 * 24 * 3_600_000;
const HOUR_MS = 3_600_000;

const EVENT_HL = 36 * HOUR_MS;
const POST_HL = 12 * HOUR_MS;
const ACTION_HL = 48 * HOUR_MS;

const EVENT_W: Record<string, number> = { CRITICAL: 20, HIGH: 8, STANDARD: 1 };
const ACTION_W: Record<string, number> = { HIGH: 10, MEDIUM: 4, LOW: 1 };
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

function bucketIdx(ageMs: number): number {
  const hoursAgo = Math.floor(ageMs / HOUR_MS);
  return Math.max(0, 23 - Math.min(23, hoursAgo));
}

export function calculateInstability(
  events: EventRow[],
  xPosts: PostRow[],
  actions: ActionRow[],
  now?: Date,
): InstabilityResult {
  const nowMs = now?.getTime() ?? Date.now();
  const cutoff = nowMs - SEVEN_DAYS_MS;
  const buckets = new Array<number>(24).fill(0);
  let rawScore = 0;

  for (const e of events) {
    const ageMs = nowMs - e.timestamp.getTime();
    if (e.timestamp.getTime() < cutoff) continue;
    const base = EVENT_W[e.severity] ?? 0;
    rawScore += base * decay(ageMs, EVENT_HL);
    buckets[bucketIdx(ageMs)] += base;
  }

  for (const p of xPosts) {
    if (p.significance === 'STANDARD') continue;
    const ageMs = nowMs - p.timestamp.getTime();
    if (p.timestamp.getTime() < cutoff) continue;
    let base: number;
    if (p.significance === 'BREAKING') {
      base = p.verificationStatus === 'VERIFIED' ? 5 : 3;
    } else {
      base = 1.5 * (VERIF_MULT[p.verificationStatus] ?? 0.4);
    }
    rawScore += base * decay(ageMs, POST_HL);
    buckets[bucketIdx(ageMs)] += base;
  }

  for (const a of actions) {
    const ts = new Date(a.date + 'T00:00:00Z');
    if (isNaN(ts.getTime())) continue;
    const ageMs = nowMs - ts.getTime();
    if (ts.getTime() < cutoff) continue;
    const base = ACTION_W[a.significance] ?? 0;
    rawScore += base * decay(ageMs, ACTION_HL);
    buckets[bucketIdx(ageMs)] += base;
  }

  const score = Math.min(100, Math.max(0, Math.round(rawScore)));
  const recent = buckets.slice(18).reduce((s, v) => s + v, 0);
  const prior = buckets.slice(12, 18).reduce((s, v) => s + v, 0);
  const trend: InstabilityResult['trend'] =
    recent - prior > 3 ? 'rising' : recent - prior < -3 ? 'falling' : 'stable';

  return { score, sparkline: buckets, trend };
}
