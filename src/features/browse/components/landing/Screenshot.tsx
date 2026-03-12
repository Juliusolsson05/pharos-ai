import Image from 'next/image';

export function Screenshot() {
  return (
    <section className="px-5 py-12 max-w-4xl mx-auto">
      <div className="border border-[var(--bd)] overflow-hidden">
        <Image
          src="/app_screenshot.png"
          alt="Pharos intelligence dashboard showing the conflict map, events timeline, and actor panels"
          width={1920}
          height={1080}
          className="w-full h-auto"
          priority
        />
      </div>
      <p className="text-xs text-[var(--t2)] mt-3 text-center">
        The Pharos dashboard on conflicts.app showing live conflict map, event
        timeline, and actor intelligence panels.
      </p>
    </section>
  );
}
