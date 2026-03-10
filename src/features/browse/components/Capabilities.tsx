const CAPABILITIES = [
  {
    title: 'Conflict map',
    description:
      'DeckGL-powered map with live event markers, actor positions, strike zones, and military infrastructure layers. Filter by day, severity, or actor.',
  },
  {
    title: 'Events timeline',
    description:
      'Tracks every airstrike, missile launch, diplomatic response, and field report. Each event tagged with severity, actors involved, and source links.',
  },
  {
    title: 'Actor dossiers',
    description:
      'Profiles for state and non-state actors — Iran, Israel, Hezbollah, Houthis, US CENTCOM, and more. Capabilities, alliances, and recent activity.',
  },
  {
    title: 'Intel signals',
    description:
      'Curated posts from X/Twitter by OSINT analysts, journalists, and official accounts. Scored by significance and grouped by day.',
  },
  {
    title: 'RSS monitor',
    description:
      '30 RSS feeds from Reuters to Press TV. Western, Iranian, Israeli, Arab, Russian, Chinese outlets. Searchable, sortable, always current.',
  },
  {
    title: 'Daily briefings',
    description:
      'AI-generated situation reports summarizing each day\'s key developments, escalation risks, and notable shifts in the conflict.',
  },
  {
    title: 'Economic data',
    description:
      'Currency rates, oil prices, and market indicators relevant to the conflict. Tracks sanctions impact and regional economic disruption.',
  },
] as const;

function CapabilityCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 border border-[var(--bd)] bg-[var(--bg-1)]">
      <h3 className="text-xs font-bold text-[var(--t1)] tracking-wide mb-2">
        {title}
      </h3>
      <p className="text-xs text-[var(--t3)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export function Capabilities() {
  return (
    <section className="px-5 py-12 max-w-3xl mx-auto">
      <p className="label mb-6">What it does</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CAPABILITIES.map((cap) => (
          <CapabilityCard
            key={cap.title}
            title={cap.title}
            description={cap.description}
          />
        ))}
      </div>
    </section>
  );
}
