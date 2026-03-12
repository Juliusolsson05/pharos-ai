import { publicAppUrl } from '@/shared/lib/env';

export const GITHUB_URL = 'https://github.com/Juliusolsson05/pharos-ai';

export const SITE_URL = publicAppUrl;

export const OG_IMAGE_PATH = '/og-image-1200x630.jpg';

export const BROWSE_POLL = 4 * 60_000;

export const BROWSE_SECTIONS = [
  { label: 'Events', href: '/browse/events' },
  { label: 'Actors', href: '/browse/actors' },
  { label: 'Briefs', href: '/browse/brief' },
  { label: 'Stories', href: '/browse/stories' },
] as const;
