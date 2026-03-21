import type { Actor } from '@/types/domain';

type ActorMatcher = {
  actorId?: string;
  countryCode?: string;
  aliases?: string[];
};

const LEADERSHIP_ACTOR_MATCHERS: ActorMatcher[] = [
  { actorId: 'iran', countryCode: 'IR', aliases: ['iran'] },
  { actorId: 'us', countryCode: 'US', aliases: ['united states', 'america'] },
  { actorId: 'idf', countryCode: 'IL', aliases: ['israel'] },
  { actorId: 'hezbollah', aliases: ['hezbollah'] },
  { actorId: 'irgc', aliases: ['irgc', 'islamic revolutionary guard corps'] },
];

function normalizeActorText(actor: Actor): string {
  return `${actor.name} ${actor.fullName}`.toLowerCase();
}

export function isLeadershipActor(actor: Actor): boolean {
  const actorId = actor.id.toLowerCase();
  const countryCode = actor.countryCode?.toUpperCase();
  const text = normalizeActorText(actor);

  return LEADERSHIP_ACTOR_MATCHERS.some(matcher => {
    if (matcher.actorId === actorId) return true;
    if (matcher.countryCode && matcher.countryCode === countryCode) return true;
    return matcher.aliases?.some(alias => text.includes(alias)) ?? false;
  });
}
