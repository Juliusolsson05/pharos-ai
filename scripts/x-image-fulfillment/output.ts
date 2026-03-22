import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { GrokAsset, GrokResult, IntelEvent } from './types';

export async function writeOutputs(options: {
  event: IntelEvent;
  outDir: string;
  payload: Record<string, unknown>;
  response: Record<string, unknown>;
  result: GrokResult & { assets: Array<GrokAsset & { url_check: string }> };
}) {
  const slug = `${options.event.timestamp.slice(0, 10)}-${options.event.id}`;
  const targetDir = path.join(options.outDir, slug);

  await mkdir(targetDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(targetDir, 'event.json'), JSON.stringify(options.event, null, 2)),
    writeFile(path.join(targetDir, 'request.json'), JSON.stringify(options.payload, null, 2)),
    writeFile(path.join(targetDir, 'response.json'), JSON.stringify(options.response, null, 2)),
    writeFile(path.join(targetDir, 'result.json'), JSON.stringify(options.result, null, 2)),
    writeFile(path.join(targetDir, 'preview.html'), renderHtml(options.result)),
  ]);

  return targetDir;
}

function renderHtml(result: GrokResult & { assets: Array<GrokAsset & { url_check: string }> }) {
  const article = result.selected_article;
  const cards = result.assets.length > 0
    ? result.assets.map(asset => `
      <div class="card">
        <p><strong>Image URL:</strong> <a href="${escapeHtml(asset.image_url ?? '')}">${escapeHtml(asset.image_url ?? '')}</a></p>
        <img src="${escapeHtml(asset.image_url ?? '')}" alt="event image">
        <p><strong>Caption:</strong> ${escapeHtml(asset.caption ?? '')}</p>
        <p><strong>Credit:</strong> ${escapeHtml(asset.credit ?? '')}</p>
        <p><strong>Source page:</strong> <a href="${escapeHtml(asset.source_page ?? '')}">${escapeHtml(asset.source_page ?? '')}</a></p>
        <p><strong>Why relevant:</strong> ${escapeHtml(asset.why_relevant ?? '')}</p>
        <p><strong>Evidence:</strong> ${escapeHtml(asset.evidence ?? '')}</p>
        <p><strong>Confidence:</strong> ${escapeHtml(asset.confidence ?? '')}</p>
        <p><strong>URL check:</strong> ${escapeHtml(asset.url_check ?? '')}</p>
      </div>
    `).join('')
    : '<div class="card"><p>No assets returned.</p></div>';

  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<title>xAI Image Fulfillment</title>',
    '<style>',
    'body { font-family: Arial, sans-serif; background: #111; color: #eee; margin: 24px; }',
    'a { color: #8ec5ff; }',
    'img { max-width: 100%; height: auto; border: 1px solid #333; border-radius: 8px; }',
    '.card { background: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 16px; margin: 16px 0; }',
    'pre { background: #151515; padding: 16px; border-radius: 8px; overflow: auto; }',
    '</style>',
    '</head>',
    '<body>',
    '<h1>xAI Image Fulfillment</h1>',
    `<div class="card"><p><strong>Event:</strong> ${escapeHtml(result.event.title)}<br><strong>Date:</strong> ${escapeHtml(result.event.date)}<br><strong>Event ID:</strong> ${escapeHtml(result.event.id)}</p></div>`,
    article
      ? `<div class="card"><p><strong>Publisher:</strong> ${escapeHtml(article.publisher)}<br><strong>Headline:</strong> ${escapeHtml(article.headline)}<br><strong>URL:</strong> <a href="${escapeHtml(article.url)}">${escapeHtml(article.url)}</a><br><strong>Reason:</strong> ${escapeHtml(article.reason)}</p></div>`
      : '<div class="card"><p>No selected article returned.</p></div>',
    cards,
    `<div class="card"><pre>${escapeHtml(JSON.stringify(result, null, 2))}</pre></div>`,
    '</body>',
    '</html>',
  ].join('');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
