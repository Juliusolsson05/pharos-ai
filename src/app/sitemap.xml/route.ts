import { createXmlResponse, renderSitemapIndex, SITEMAP_PATHS, toAbsoluteUrl } from '@/features/browse/lib/sitemap';

export function GET() {
  return createXmlResponse(
    renderSitemapIndex([
      { url: toAbsoluteUrl(SITEMAP_PATHS.browse) },
      { url: toAbsoluteUrl(SITEMAP_PATHS.dashboard) },
      { url: toAbsoluteUrl(SITEMAP_PATHS.events) },
      { url: toAbsoluteUrl(SITEMAP_PATHS.actors) },
      { url: toAbsoluteUrl(SITEMAP_PATHS.briefs) },
      { url: toAbsoluteUrl(SITEMAP_PATHS.stories) },
    ]),
  );
}
