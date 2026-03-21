type ResolvedFlag =
  | { kind: 'actor'; src: string }
  | { kind: 'country'; code: string }
  | { kind: 'none' };

const ACTOR_FLAG_ASSETS: Record<string, string> = {
  nato: '/flags/actors/nato.svg',
  pmf: '/flags/actors/pmf.gif',
  usil: '/flags/actors/usil.svg',
  hezbollah: '/flags/actors/hezbollah.svg',
};

export function resolveFlag(input: { actorId?: string | null; countryCode?: string | null }): ResolvedFlag {
  const actorId = input.actorId?.toLowerCase();
  if (actorId && ACTOR_FLAG_ASSETS[actorId]) {
    return { kind: 'actor', src: ACTOR_FLAG_ASSETS[actorId] };
  }

  const countryCode = input.countryCode?.toLowerCase();
  if (countryCode) {
    return { kind: 'country', code: countryCode };
  }

  return { kind: 'none' };
}
