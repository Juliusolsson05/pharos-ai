import { SITE_URL } from '@/features/browse/constants';
import { PAGE_SIZE, STORY_PAGE_SIZE } from '@/features/browse/queries/page-size';

export type SitemapUrl = {
  url: string;
  lastModified?: Date | string;
};

export type SitemapIndexUrl = {
  url: string;
  lastModified?: Date | string;
};

export const BROWSE_STATIC_ROUTES = [
  '/browse',
  '/browse/events',
  '/browse/actors',
  '/browse/brief',
  '/browse/stories',
] as const;

export const DASHBOARD_ROUTES = [
  '/dashboard',
  '/dashboard/map',
  '/dashboard/signals',
] as const;

export const SITEMAP_PATHS = {
  index: '/sitemap.xml',
  browse: '/sitemaps/browse.xml',
  dashboard: '/sitemaps/dashboard.xml',
  events: '/sitemaps/events.xml',
  actors: '/sitemaps/actors.xml',
  briefs: '/sitemaps/briefs.xml',
  stories: '/sitemaps/stories.xml',
} as const;

export const BROWSE_PAGE_SIZES = {
  events: PAGE_SIZE,
  actors: PAGE_SIZE,
  briefs: PAGE_SIZE,
  stories: STORY_PAGE_SIZE,
} as const;

export function toAbsoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function buildPaginatedUrls(
  basePath: string,
  total: number,
  pageSize: number,
): SitemapUrl[] {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) {
    return [];
  }

  return Array.from({ length: totalPages - 1 }, (_, index) => ({
    url: toAbsoluteUrl(`${basePath}?page=${index + 2}`),
  }));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatLastModified(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function renderSitemap(entries: SitemapUrl[]): string {
  const urls = entries
    .map(({ url, lastModified }) => {
      const parts = [`<loc>${escapeXml(url)}</loc>`];

      if (lastModified) {
        parts.push(`<lastmod>${escapeXml(formatLastModified(lastModified))}</lastmod>`);
      }

      return `<url>${parts.join('')}</url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function renderSitemapIndex(entries: SitemapIndexUrl[]): string {
  const sitemaps = entries
    .map(({ url, lastModified }) => {
      const parts = [`<loc>${escapeXml(url)}</loc>`];

      if (lastModified) {
        parts.push(`<lastmod>${escapeXml(formatLastModified(lastModified))}</lastmod>`);
      }

      return `<sitemap>${parts.join('')}</sitemap>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps}</sitemapindex>`;
}

export function createXmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
