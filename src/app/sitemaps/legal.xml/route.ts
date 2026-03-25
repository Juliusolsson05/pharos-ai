import { createXmlResponse, LEGAL_ROUTES, renderSitemap, toAbsoluteUrl } from '@/features/browse/lib/sitemap';

export function GET() {
  return createXmlResponse(
    renderSitemap(LEGAL_ROUTES.map((path) => ({ url: toAbsoluteUrl(path) }))),
  );
}
