import type { Job } from 'bullmq';

import { prisma } from '../../../db.js';
import { toJson } from '../../../lib/json.js';
import { fetchGqg } from '../../../providers/gdelt-gqg/index.js';

const SOURCE = 'gdelt-gqg';

// Keywords for conflict-relevant filtering
const CONFLICT_KEYWORDS = [
  'iran', 'israel', 'houthi', 'hezbollah', 'gaza', 'lebanon', 'missile',
  'strike', 'military', 'war', 'bomb', 'attack', 'troops', 'navy',
  'drone', 'ceasefire', 'nuclear', 'sanctions', 'irgc', 'idf',
  'pentagon', 'centcom', 'strait of hormuz', 'red sea', 'yemen',
];

function isConflictRelevant(article: { title: string; url: string }): boolean {
  const text = (article.title + ' ' + article.url).toLowerCase();
  return CONFLICT_KEYWORDS.some((kw) => text.includes(kw));
}

export async function processGqgIngest(job: Job) {
  const start = Date.now();

  await job.log('Fetching GDELT Quotation Graph (last minute)');
  const articles = await fetchGqg();
  await job.log(`Fetched ${articles.length} articles with quotes`);
  await job.updateProgress(30);

  const relevant = articles.filter(isConflictRelevant);
  await job.log(`${relevant.length} conflict-relevant articles`);
  await job.updateProgress(50);

  // Store each quote as a separate row
  let stored = 0;
  for (const article of relevant) {
    for (const q of article.quotes) {
      try {
        await prisma.gdeltQuote.create({
          data: {
            articleUrl: article.url,
            title: article.title,
            lang: article.lang || null,
            date: article.date,
            quote: q.quote,
            pre: q.pre || null,
            post: q.post || null,
            raw: toJson({ ...article, currentQuote: q }),
          },
        });
        stored++;
      } catch { /* skip */ }
    }
  }
  await job.updateProgress(90);

  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastRunAt: new Date(), lastRunStatus: 'ok', lastRunCount: stored, totalEvents: { increment: stored } },
  });

  await job.updateProgress(100);
  await job.log(`Done: ${stored} quotes from ${relevant.length} articles in ${Date.now() - start}ms`);
  return { status: 'ok', totalArticles: articles.length, relevant: relevant.length, quotesStored: stored, durationMs: Date.now() - start };
}
