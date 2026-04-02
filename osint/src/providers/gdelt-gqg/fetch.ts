import { createGunzip } from 'zlib';
import { Readable } from 'stream';

const BASE_URL = 'http://data.gdeltproject.org/gdeltv3/gqg';
const FETCH_TIMEOUT = 15_000;

export type GqgArticle = {
  date: string;
  url: string;
  title: string;
  lang: string;
  quotes: GqgQuote[];
};

export type GqgQuote = {
  pre: string;
  quote: string;
  post: string;
};

async function decompressGzip(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const gunzip = createGunzip();
    const stream = Readable.from(buffer);
    stream.pipe(gunzip);
    gunzip.on('data', (chunk) => chunks.push(chunk));
    gunzip.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    gunzip.on('error', reject);
  });
}

function formatTimestamp(d: Date): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

/**
 * Fetch GQG data. Files appear on a 15-minute heartbeat with seconds = 01.
 * We try multiple timestamps to find an available file.
 */
export async function fetchGqg(): Promise<GqgArticle[]> {
  const now = new Date();

  // Generate candidate timestamps: try every minute from 5 to 20 minutes ago, with seconds 00 and 01
  const candidates: string[] = [];
  for (let minAgo = 5; minAgo <= 20; minAgo++) {
    const d = new Date(now.getTime() - minAgo * 60_000);
    d.setUTCSeconds(1);
    candidates.push(formatTimestamp(d));
    d.setUTCSeconds(0);
    candidates.push(formatTimestamp(d));
  }

  for (const ts of candidates) {
    const url = `${BASE_URL}/${ts}.gqg.json.gz`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
      if (res.status === 404) continue;
      if (!res.ok) continue;

      const buf = Buffer.from(await res.arrayBuffer());
      const text = await decompressGzip(buf);
      const lines = text.split('\n').filter((l) => l.trim().length > 0);

      const articles: GqgArticle[] = [];
      for (const line of lines) {
        try {
          const d = JSON.parse(line) as Record<string, unknown>;
          const quotes = (d.quotes as GqgQuote[]) || [];
          if (quotes.length === 0) continue;

          articles.push({
            date: String(d.date || ''),
            url: String(d.url || ''),
            title: String(d.title || ''),
            lang: String(d.lang || ''),
            quotes,
          });
        } catch { /* skip malformed */ }
      }

      if (articles.length > 0) return articles;
    } catch {
      continue;
    }
  }

  return [];
}
