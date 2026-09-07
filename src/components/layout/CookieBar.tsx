'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import Button from '@/components/ui/Button';
import { getConsent, setConsent, CONSENT_CHANGED_EVENT } from '@/lib/consent/state';

// Opt-in consent gate for the first-party analytics in src/lib/analytics.
// Accept and Reject are deliberately rendered with the identical variant, size
// and width — styling one of them as the primary CTA would be a dark pattern.
export default function CookieBar() {
  const t = useTranslations('cookies');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only ask when no choice has been recorded yet.
    setVisible(getConsent() === null);
    // Withdrawing consent on /cookies clears the stored value and should bring
    // the bar back without a reload.
    function onChange(e: Event) {
      setVisible((e as CustomEvent).detail === null);
    }
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t('heading')}
      className="fixed bottom-0 left-0 right-0 z-[100] bg-cz-black-mid flex flex-wrap items-center justify-between"
      style={{
        borderTop: '1px solid var(--color-cz-gray-dark)',
        padding: '16px clamp(16px, 4vw, 24px)',
        gap: 16,
      }}
    >
      <p
        className="font-body text-cz-gray-light"
        style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 640, margin: 0 }}
      >
        {t('text')}{' '}
        <Link href="/cookies" className="text-cz-orange hover:underline">
          {t('link')}
        </Link>
      </p>
      {/* Below `sm` the two buttons stack and each takes the full bar width:
          side by side they need ~426px (cs) to ~472px (de), which no phone has,
          and a shrink-0 row of `flex-1` buttons would overflow the viewport and
          wrap the longer label onto a second line. Stacked they stay one line
          each and stay identical in width, as the variant note above requires. */}
      <div className="flex flex-col w-full sm:flex-row sm:w-auto sm:flex-shrink-0" style={{ gap: 12 }}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConsent('rejected')}
          className="flex-1"
        >
          {t('rejectAll')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConsent('accepted')}
          className="flex-1"
        >
          {t('acceptAll')}
        </Button>
      </div>
    </div>
  );
}
