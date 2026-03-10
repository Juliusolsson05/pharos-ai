const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Pharos',
  alternateName: 'Conflicts.app',
  url: 'https://www.conflicts.app',
  description:
    'Open-source intelligence dashboard tracking the Iran conflict in real time. Events, actors, signals, map overlays, and daily briefings.',
  applicationCategory: 'NewsApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  license: 'https://www.gnu.org/licenses/agpl-3.0.html',
  sourceOrganization: {
    '@type': 'Organization',
    name: 'Pharos',
    url: 'https://www.conflicts.app',
  },
} as const;

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
    />
  );
}
