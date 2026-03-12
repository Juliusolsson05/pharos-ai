const FAQ_ITEMS = [
  {
    q: 'What is Conflicts.app?',
    a: 'Conflicts.app is a free, open-source intelligence dashboard for tracking the Iran conflict in real time. Built under the project name Pharos, it combines an interactive strike map, AI-generated situation briefs, escalation scoring, actor tracking, and an OSINT signal feed into one interface.',
  },
  {
    q: 'Is it free?',
    a: 'Yes. No paywall, no signup, no ads. The project is open source under AGPL-3.0.',
  },
  {
    q: 'Where does the data come from?',
    a: "Conflicts.app monitors 30+ RSS feeds spanning Western, Iranian, Israeli, Arab, Russian, and Chinese media outlets. An AI agent pipeline processes incoming articles, extracts structured events, scores severity, identifies actors, and generates intelligence briefs. It's not just raw feeds, it's processed intelligence.",
  },
  {
    q: 'What is the escalation score?',
    a: 'The escalation score is a 0\u2013100 metric calculated by AI based on event severity, attack frequency, actor behavior changes, and diplomatic signals. A score above 90 indicates active military conflict with high risk of further escalation.',
  },
  {
    q: 'How often is it updated?',
    a: 'Events are logged as they happen. Intelligence briefs and escalation scores are updated continuously throughout the day as new information comes in.',
  },
  {
    q: 'Who built this?',
    a: 'Conflicts.app was built by Julius Olsson as an open-source project. The goal was to make conflict intelligence accessible to everyone, not just people with access to expensive OSINT platforms.',
  },
  {
    q: 'What tech stack is it built with?',
    a: 'Next.js 16 with the App Router, TypeScript, DeckGL v9 and MapLibre for maps, Prisma 7 with Supabase (PostgreSQL), Redux Toolkit for state management, and deployed on Vercel.',
  },
] as const;

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-[var(--bd-s)] py-5">
      <h3 className="text-sm font-semibold text-[var(--t1)] mb-2">{q}</h3>
      <p className="text-xs text-[var(--t2)] leading-relaxed">{a}</p>
    </div>
  );
}

export function Faq() {
  return (
    <section className="px-5 py-12 max-w-3xl mx-auto">
      <h2 className="section-title mb-6">Frequently asked questions</h2>

      <div>
        {FAQ_ITEMS.map((item) => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </section>
  );
}
