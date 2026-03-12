const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Conflicts.app',
  alternateName: 'Pharos',
  url: 'https://www.conflicts.app',
  description:
    'Free open-source dashboard tracking the Iran conflict in real time. Interactive strike map, AI intelligence briefs, escalation scoring, and actor tracking across 10+ factions.',
  applicationCategory: 'NewsApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  license: 'https://www.gnu.org/licenses/agpl-3.0.html',
  featureList: [
    'Interactive conflict map',
    'AI intelligence briefs',
    'Escalation scoring',
    'Actor intelligence profiles',
    'OSINT signal feed',
    'RSS monitor (30+ sources)',
    'Economic indicators',
    'Event timeline',
  ],
  author: {
    '@type': 'Person',
    name: 'Julius Olsson',
  },
  sourceOrganization: {
    '@type': 'Organization',
    name: 'Pharos',
    url: 'https://www.conflicts.app',
  },
} as const;

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Conflicts.app?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Conflicts.app is a free, open-source intelligence dashboard for tracking the Iran conflict in real time. Built under the project name Pharos, it combines an interactive strike map, AI-generated situation briefs, escalation scoring, actor tracking, and an OSINT signal feed into one interface.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is it free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. No paywall, no signup, no ads. The project is open source under AGPL-3.0.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where does the data come from?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Conflicts.app monitors 30+ RSS feeds spanning Western, Iranian, Israeli, Arab, Russian, and Chinese media outlets. An AI agent pipeline processes incoming articles, extracts structured events, scores severity, identifies actors, and generates intelligence briefs. It's not just raw feeds, it's processed intelligence.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is the escalation score?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The escalation score is a 0\u2013100 metric calculated by AI based on event severity, attack frequency, actor behavior changes, and diplomatic signals. A score above 90 indicates active military conflict with high risk of further escalation.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often is it updated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Events are logged as they happen. Intelligence briefs and escalation scores are updated continuously throughout the day as new information comes in.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who built this?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Conflicts.app was built by Julius Olsson as an open-source project. The goal was to make conflict intelligence accessible to everyone, not just people with access to expensive OSINT platforms.',
      },
    },
  ],
} as const;

export function JsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
    </>
  );
}
