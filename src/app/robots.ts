import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/features/browse/constants';
import { SITEMAP_PATHS } from '@/features/browse/lib/sitemap';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}${SITEMAP_PATHS.index}`,
  };
}
