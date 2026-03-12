# Post-Feature Code Review

> Run this checklist against every file you created or modified.
> Fix violations before considering the task done.
> Full rules live in **CODEX.md** — this is the quick verification pass.

---

## File Structure

- [ ] New components are in `src/features/{feature}/components/`
- [ ] New query hooks are in `src/features/{feature}/queries/`
- [ ] No component definitions inside page files (pages are orchestrators only, ~80 lines max)
- [ ] No file exceeds ~150 lines — split into sub-components or hooks if it does

## Types & Props

- [ ] Props typed with `type Props = { ... }` — never `interface`
- [ ] Shared domain types imported from `src/types/domain.ts`, not redefined locally
- [ ] New domain-level types added to `domain.ts`, not scattered in component files

## Styling

- [ ] Zero hex color literals — use `var(--token)` from `globals.css` (e.g. `var(--t2)`, `var(--bg-2)`)
- [ ] `className` (Tailwind) for static layout; `style={{}}` only for data-driven values
- [ ] Reuse built-in CSS classes before inventing new ones: `.card`, `.label`, `.section-title`, `.panel-header`, `.panel-body`, `.mono`, `.sev-*`, `.dot-*`
- [ ] Tailwind color values reference tokens: `text-[var(--t2)]`, not `text-gray-400`

## Data Fetching

- [ ] All fetches use TanStack Query hooks — no raw `fetch()` in components
- [ ] Uses `api.get/post/put/delete` from `@/shared/lib/query/client`
- [ ] Uses `queryKeys.{domain}.{operation}()` from `@/shared/lib/query/keys`
- [ ] Appropriate `STALE` constant chosen: `SHORT` (1m), `MEDIUM` (5m), `LONG` (1h), `DAY` (24h)

## API Routes

- [ ] Success: `return ok(data)`
- [ ] Error: `return err('CODE', 'message', status)`
- [ ] Route path lives under `/api/v1/`
- [ ] Helpers imported from `@/server/lib/api-utils`

## Imports

- [ ] 8-group order enforced (React → Next → third-party → shadcn UI → local components → lib/hooks/state → data/types → relative)
- [ ] No unused imports
- [ ] Run `npx eslint --fix {file}` if unsure about order

## Components

- [ ] Interactive components (hooks, event handlers, state) have `'use client'` at line 1
- [ ] Uses shadcn `<Button>` — no raw `<button>` elements
- [ ] Comments explain non-obvious *why*, never restate *what* the code does

## Naming

- [ ] Component files: **PascalCase** (`ActorList.tsx`)
- [ ] Hook files: **use-kebab-case** (`use-conflict-day.ts`)
- [ ] Utility/data files: **kebab-case** (`day-filter.ts`)
- [ ] Handler props: `on*` (`onSelect`); implementations: `handle*` (`handleSelect`)
- [ ] Boolean props/state: `is*` / `has*` prefix (`isExpanded`, `hasError`)
- [ ] Module constants: `SCREAMING_SNAKE` (`SORT_OPTS`, `CATEGORY_COLORS`)
