import type { ActivityLevel, Stance } from '@/types/domain';

import { ActorCard } from './ActorCard';

type ActorItem = {
  id: string;
  name: string;
  fullName: string;
  countryCode: string | null;
  type: string;
  affiliation: string | null;
  activityLevel: ActivityLevel;
  activityScore: number;
  stance: Stance;
  saying: string;
  assessment: string;
};

type Props = {
  actors: ActorItem[];
};

export function ActorGrid({ actors }: Props) {
  if (actors.length === 0) {
    return <p className="text-sm text-[var(--t3)]">No actors found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {actors.map((actor) => (
        <ActorCard key={actor.id} {...actor} />
      ))}
    </div>
  );
}
