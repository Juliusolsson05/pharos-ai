import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-1 min-h-0 items-center justify-center bg-[var(--bg-1)] p-6">
      <div className="w-full max-w-xl border border-[var(--bd)] bg-[var(--bg-2)] p-6">
        <p className="label mb-3">404 // NOT FOUND</p>
        <h1 className="mono text-xl font-bold text-[var(--t1)] mb-2">PAGE NOT FOUND</h1>
        <p className="text-xs text-[var(--t3)] mb-5">
          This route does not exist in the current intelligence workspace.
        </p>
        <Link href="/dashboard" className="no-underline">
          <span className="mono text-[length:var(--text-body-sm)] font-bold text-[var(--blue-l)]">Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
