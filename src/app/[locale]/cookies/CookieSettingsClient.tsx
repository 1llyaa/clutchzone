'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import {
  getConsent,
  setConsent,
  clearConsent,
  CONSENT_CHANGED_EVENT,
  type ConsentValue,
} from '@/lib/consent/state';

export default function CookieSettingsClient() {
  const t = useTranslations('cookies');
  // `undefined` = not read yet (SSR/first paint), `null` = no choice recorded.
  const [consent, setLocal] = useState<ConsentValue | null | undefined>(undefined);

  useEffect(() => {
    setLocal(getConsent());
    function onChange(e: Event) {
      setLocal((e as CustomEvent).detail as ConsentValue | null);
    }
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
  }, []);

  const statusText =
    consent === 'accepted' ? t('accepted') : consent === 'rejected' ? t('rejected') : t('notSet');

  return (
    <div style={{ marginTop: 40 }}>
      <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.8 }}>
        {t('settingsIntro')}
      </p>

      <div
        className="bg-cz-black-mid rounded-control"
        style={{ marginTop: 28, padding: 24, border: '1px solid var(--color-cz-gray-dark)' }}
      >
        <span
          className="font-mono text-cz-orange uppercase block"
          style={{ fontSize: 16, letterSpacing: 3, marginBottom: 10 }}
        >
          {t('statusLabel')}
        </span>
        <p
          className="font-body text-cz-white-soft"
          style={{ fontSize: 19, margin: 0, minHeight: 28 }}
        >
          {/* Rendered only after the effect reads localStorage, so the server
              markup and the first client paint agree. */}
          {consent === undefined ? '' : statusText}
        </p>

        <div className="flex flex-wrap" style={{ gap: 12, marginTop: 20 }}>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConsent('rejected')}>
            {t('rejectAll')}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConsent('accepted')}>
            {t('acceptAll')}
          </Button>
          {consent !== undefined && consent !== null && (
            <Button type="button" variant="ghost" size="sm" onClick={clearConsent}>
              {t('withdraw')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
