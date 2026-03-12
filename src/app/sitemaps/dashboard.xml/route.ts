import { createXmlResponse, DASHBOARD_ROUTES, renderSitemap, toAbsoluteUrl } from '@/features/browse/lib/sitemap';

export function GET() {
  return createXmlResponse(
    renderSitemap(DASHBOARD_ROUTES.map((path) => ({ url: toAbsoluteUrl(path) }))),
  );
}
