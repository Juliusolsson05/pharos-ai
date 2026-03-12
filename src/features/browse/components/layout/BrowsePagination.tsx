import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  /** Current search params string (without `page`) */
  searchParams?: string;
};

function pageHref(p: number, basePath: string, searchParams?: string) {
  const params = new URLSearchParams(searchParams ?? '');
  if (p <= 1) {
    params.delete('page');
  } else {
    params.set('page', String(p));
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function getPageWindow(page: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | null)[] = [];
  pages.push(1);
  if (page > 3) pages.push(null);

  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (page < total - 2) pages.push(null);
  pages.push(total);

  return pages;
}

export function BrowsePagination({ page, totalPages, basePath, searchParams }: Props) {
  const window = getPageWindow(page, totalPages);

  return (
    <Pagination className="text-[var(--t1)] [--border:var(--bd)] [--background:var(--bg-1)] [--accent:var(--bg-3)] [--accent-foreground:var(--t1)] [--input:var(--bd)]">
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious href={pageHref(page - 1, basePath, searchParams)} />
          </PaginationItem>
        )}

        {window.map((p, i) =>
          p === null ? (
            <PaginationItem key={`e-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink href={pageHref(p, basePath, searchParams)} isActive={p === page}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        {page < totalPages && (
          <PaginationItem>
            <PaginationNext href={pageHref(page + 1, basePath, searchParams)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
