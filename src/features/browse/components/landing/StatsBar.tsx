const STATS = [
  { label: 'Escalation score', value: '96 / 100' },
  { label: 'Factions tracked', value: '10+' },
  { label: 'News sources', value: '30+' },
  { label: 'Events logged', value: '120+' },
] as const;

export function StatsBar() {
  return (
    <section className="px-5 py-8 max-w-3xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border border-[var(--bd)] p-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="mono text-lg font-bold text-[var(--t1)]">
              {stat.value}
            </p>
            <p className="label mt-1 text-[var(--t2)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
