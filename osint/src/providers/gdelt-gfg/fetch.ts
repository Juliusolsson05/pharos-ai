import { createGunzip } from 'zlib';
import { Readable } from 'stream';

const LASTUPDATE_URL = 'http://data.gdeltproject.org/gdeltv3/gfg/alpha/lastupdate.txt';
const FETCH_TIMEOUT = 60_000; // GFG files are large (10M+ links)

export type FrontpageLink = {
  date: string;
  fromUrl: string;
  linkId: number;
  linkPercent: number;
  toUrl: string;
  linkText: string;
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

export async function fetchLatestGfgUrl(): Promise<string> {
  const res = await fetch(LASTUPDATE_URL, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`GFG lastupdate ${res.status}`);

  const text = await res.text();
  const firstLine = text.trim().split('\n')[0];
  if (!firstLine) throw new Error('GFG lastupdate empty');

  const parts = firstLine.trim().split(/\s+/);
  return parts[parts.length - 1];
}

/**
 * Download and parse GFG hourly file.
 * 6 columns: DATE, FromFrontPageURL, LinkID, LinkPercentMaxID, ToLinkURL, LinkText
 */
export async function downloadAndParse(gfgUrl: string): Promise<FrontpageLink[]> {
  const res = await fetch(gfgUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!res.ok) throw new Error(`GFG download ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  const text = await decompressGzip(buf);
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  const links: FrontpageLink[] = [];

  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 6) continue;

    links.push({
      date: cols[0] || '',
      fromUrl: cols[1] || '',
      linkId: parseInt(cols[2]) || 0,
      linkPercent: parseFloat(cols[3]) || 0,
      toUrl: cols[4] || '',
      linkText: cols[5] || '',
    });
  }

  return links;
}
