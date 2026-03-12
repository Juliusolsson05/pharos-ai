const STEPS = [
  {
    step: 1,
    title: 'Open conflicts.app/dashboard.',
    description: 'No account needed.',
  },
  {
    step: 2,
    title: 'Pick a conflict day.',
    description:
      'Every day is tracked independently with its own events, briefs, and scores.',
  },
  {
    step: 3,
    title: 'Read the brief or explore the map.',
    description:
      'Start with the situation summary or go straight to the interactive map and dig into individual events.',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="px-5 py-12 max-w-3xl mx-auto">
      <h2 className="section-title mb-6">How it works</h2>

      <div className="flex flex-col gap-6">
        {STEPS.map((s) => (
          <div key={s.step} className="flex gap-4">
            <span className="mono text-sm font-bold text-[var(--t4)] shrink-0">
              {s.step}.
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--t1)]">
                {s.title}
              </p>
              <p className="text-xs text-[var(--t2)] leading-relaxed mt-1">
                {s.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
