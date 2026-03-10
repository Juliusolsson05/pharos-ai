import { SITE_URL } from '@/features/browse/constants';

type JsonLd = Record<string, unknown>;

type BreadcrumbItem = {
  name: string;
  path: string;
};

type ListItem = {
  name: string;
  url: string;
  description?: string;
};

const ORG_NAME = 'Pharos';
const SITE_NAME = 'Conflicts.app';

function abs(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export function buildCollectionPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url: abs(input.path),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function buildItemListJsonLd(input: {
  name: string;
  path: string;
  items: ListItem[];
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: input.name,
    url: abs(input.path),
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: abs(item.url),
      name: item.name,
      description: item.description,
    })),
  };
}

export function buildArticleJsonLd(input: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified: string;
  articleSection?: string;
  keywords?: string[];
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url: abs(input.path),
    mainEntityOfPage: abs(input.path),
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    articleSection: input.articleSection,
    keywords: input.keywords,
    author: {
      '@type': 'Organization',
      name: ORG_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: ORG_NAME,
      url: SITE_URL,
    },
  };
}

export function buildProfileJsonLd(input: {
  name: string;
  description: string;
  path: string;
  type: string;
  affiliation?: string | null;
}): JsonLd[] {
  const page = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: input.name,
    description: input.description,
    url: abs(input.path),
    mainEntity: abs(input.path),
  };

  const entity = {
    '@context': 'https://schema.org',
    '@type': input.type === 'INDIVIDUAL' ? 'Person' : 'Organization',
    name: input.name,
    description: input.description,
    url: abs(input.path),
    memberOf: input.affiliation
      ? {
          '@type': 'Organization',
          name: input.affiliation,
        }
      : undefined,
  };

  return [page, entity];
}

export function buildReportJsonLd(input: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Report',
    headline: input.headline,
    description: input.description,
    url: abs(input.path),
    mainEntityOfPage: abs(input.path),
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: {
      '@type': 'Organization',
      name: ORG_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: ORG_NAME,
      url: SITE_URL,
    },
  };
}
