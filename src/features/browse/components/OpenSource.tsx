import { Button } from '@/components/ui/button';

import { GITHUB_URL } from '@/features/browse/constants';

const TECH_STACK = [
  'Next.js App Router',
  'TypeScript',
  'Supabase (PostgreSQL)',
  'Prisma 7',
  'Redux Toolkit',
  'TanStack Query v5',
  'DeckGL / MapLibre',
  'Tailwind CSS',
] as const;

export function OpenSource() {
  return (
    <section className="px-5 py-12 max-w-3xl mx-auto">
      <p className="label mb-6">Open source</p>

      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--t2)] leading-relaxed">
          Pharos is licensed under AGPL-3.0. The entire codebase — dashboard,
          API routes, data pipelines — is public on GitHub. Contributions
          welcome.
        </p>

        <Button variant="outline" size="sm" className="self-start" asChild>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            github.com/Juliusolsson05/pharos-ai
          </a>
        </Button>

        <div className="mt-4">
          <p className="label mb-3">Tech stack</p>
          <div className="flex flex-wrap gap-2">
            {TECH_STACK.map((tech) => (
              <span
                key={tech}
                className="mono text-[11px] px-2 py-1 border border-[var(--bd-s)] text-[var(--t3)]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
