'use client';

import { Button } from '@/components/ui/button';

import { useCookieConsent } from '@/shared/components/privacy/CookieConsentProvider';

import { SHOW_COOKIE_CONTROLS } from '@/shared/config/privacy';

type Props = {
  className?: string;
  label?: string;
  variant?: 'default' | 'ghost' | 'link' | 'outline' | 'secondary';
};

export function OpenCookiePreferencesButton({
  className,
  label = 'Cookie settings',
  variant = 'outline',
}: Props) {
  const { openPreferences } = useCookieConsent();

  if (!SHOW_COOKIE_CONTROLS) return null;

  return (
    <Button className={className} variant={variant} onClick={openPreferences}>
      {label}
    </Button>
  );
}
