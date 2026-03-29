import AdmZip from 'adm-zip';

import { config } from '../../config.js';

const FETCH_TIMEOUT = 20_000;

export type MentionRow = {
  globalEventId: string;
  eventTimeDate: string;
  mentionTimeDate: string;
  mentionType: number;
  mentionSourceName: string;
  mentionIdentifier: string;
  sentenceId: number;
  actor1CharOffset: number;
  actor2CharOffset: number;
  actionCharOffset: number;
  inRawText: boolean;
  confidence: number;
  mentionDocLen: number;
  mentionDocTone: number;
  mentionDocTranslationInfo: string;
};

export async function fetchLatestMentionsUrl(): Promise<string> {
  const res = await fetch(config.gdelt.lastUpdateUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  });
  if (!res.ok) throw new Error(`lastupdate.txt ${res.status}`);

  const text = await res.text();
  for (const line of text.trim().split('\n')) {
    if (line.includes('.mentions.CSV.zip')) {
      const parts = line.trim().split(/\s+/);
      return parts[parts.length - 1];
    }
  }
  throw new Error('No mentions URL in lastupdate.txt');
}

export async function downloadAndParse(zipUrl: string): Promise<{
  rows: MentionRow[];
  rawZip: Buffer;
}> {
  const res = await fetch(zipUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!res.ok) throw new Error(`Mentions download ${res.status}`);

  const rawZip = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(rawZip);
  const entries = zip.getEntries();
  if (entries.length === 0) throw new Error('Mentions ZIP empty');

  const csv = entries[0].getData().toString('utf-8');
  const lines = csv.split('\n').filter((l) => l.trim().length > 0);
  const rows: MentionRow[] = [];

  for (const line of lines) {
    const c = line.split('\t');
    if (c.length < 15) continue;

    rows.push({
      globalEventId: c[0],
      eventTimeDate: c[1],
      mentionTimeDate: c[2],
      mentionType: parseInt(c[3]) || 1,
      mentionSourceName: c[4] || '',
      mentionIdentifier: c[5] || '',
      sentenceId: parseInt(c[6]) || 0,
      actor1CharOffset: parseInt(c[7]) || -1,
      actor2CharOffset: parseInt(c[8]) || -1,
      actionCharOffset: parseInt(c[9]) || -1,
      inRawText: c[10] === '1',
      confidence: parseInt(c[11]) || 0,
      mentionDocLen: parseInt(c[12]) || 0,
      mentionDocTone: parseFloat(c[13]) || 0,
      mentionDocTranslationInfo: c[14] || '',
    });
  }

  return { rows, rawZip };
}
