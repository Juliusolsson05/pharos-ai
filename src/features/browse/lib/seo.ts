import type { Metadata } from 'next';

import { OG_IMAGE_PATH, SITE_URL } from '@/features/browse/constants';

type RobotsInput = {
  isIndexable: boolean;
};

type ImageInput = {
  alt: string;
  path?: string;
};

type BaseMetadataInput = {
  title: string;
  description: string;
  path: string;
  robots?: RobotsInput;
  image?: ImageInput;
};

const SITE_NAME = 'Conflicts.app';
const BRAND_NAME = 'Pharos';
const DEFAULT_IMAGE_ALT = 'Conflicts.app live intelligence dashboard';

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

export function buildAbsoluteTitle(title: string) {
  return `${title} | ${SITE_NAME} | ${BRAND_NAME}`;
}

export function buildAbsoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function buildDescription(text: string, maxLength = 160) {
  const normalized = normalizeText(text);
  if (normalized.length <= maxLength) return normalized;

  const truncated = normalized.slice(0, maxLength - 1);
  const boundary = truncated.lastIndexOf(' ');
  return `${truncated.slice(0, Math.max(0, boundary))}…`;
}

export function buildRobots({ isIndexable }: RobotsInput): Metadata['robots'] {
  return {
    index: isIndexable,
    follow: true,
    googleBot: {
      index: isIndexable,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  };
}

export function buildBrowseMetadata({
  title,
  description,
  path,
  robots = { isIndexable: true },
  image = { alt: DEFAULT_IMAGE_ALT },
}: BaseMetadataInput): Metadata {
  const canonical = buildAbsoluteUrl(path);
  const fullTitle = buildAbsoluteTitle(title);

  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical },
    robots: buildRobots(robots),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url: canonical,
      images: [
        {
          url: image.path ?? OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          alt: image.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image.path ?? OG_IMAGE_PATH],
    },
  };
}

export function buildDetailMetadata(input: BaseMetadataInput): Metadata {
  return buildBrowseMetadata(input);
}

export function isPageIndexable(page: number) {
  return page >= 1;
}

export function hasActiveFilters(filters: Array<string | undefined | null | string[]>) {
  return filters.some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  );
}

export function getCanonicalListPath(path: string, page: number) {
  if (page <= 1) return path;
  const params = new URLSearchParams({ page: String(page) });
  return `${path}?${params.toString()}`;
}
