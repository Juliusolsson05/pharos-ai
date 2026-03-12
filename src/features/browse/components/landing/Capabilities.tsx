const CAPABILITIES = [
  {
    title: 'Interactive conflict map',
    description:
      'Every airstrike, missile launch, and troop movement plotted on a map. Filter by day, severity, or actor. Built with DeckGL and MapLibre.',
  },
  {
    title: 'Event timeline',
    description:
      'Airstrikes, diplomatic moves, field reports. Each event scored by severity with actors involved and source links. Browse by day or search across the full conflict.',
  },
  {
    title: 'AI intelligence briefs',
    description:
      'An AI pipeline continuously processes incoming events and generates situation reports. Key developments, escalation risks, and scenario analysis updated throughout the day.',
  },
  {
    title: 'Actor intelligence',
    description:
      'Profiles for every major faction. Iran, Israel, Hezbollah, Houthis, US CENTCOM, NATO, and more. Capabilities, alliances, recent actions, and current stance.',
  },
  {
    title: 'OSINT signals',
    description:
      'Curated posts from analysts, journalists, and official accounts on X. Scored by significance and grouped by day so you see what matters, not everything.',
  },
  {
    title: 'RSS monitor',
    description:
      '30 feeds from Reuters to Press TV. Western, Iranian, Israeli, Arab, Russian, and Chinese outlets. One place instead of 30 tabs.',
  },
  {
    title: 'Escalation scoring',
    description:
      'AI calculates a daily escalation score from 0 to 100 based on event severity, frequency, and actor behavior. Currently at 96.',
  },
  {
    title: 'Economic indicators',
    description:
      'Oil prices, currency rates, and market data tied to the conflict. Tracks sanctions impact and regional disruption.',
  },
] as const;

function CapabilityCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 border border-[var(--bd)] bg-[var(--bg-1)]">
      <h3 className="text-xs font-bold text-[var(--t1)] tracking-wide mb-2">
        {title}
      </h3>
      <p className="text-xs text-[var(--t2)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export function Capabilities() {
  return (
    <section className="px-5 py-12 max-w-3xl mx-auto">
      <h2 className="section-title mb-6">What you can track</h2>

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
