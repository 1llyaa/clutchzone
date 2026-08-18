'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import Button from '@/components/ui/Button';

const STORAGE_KEY = 'cz_cookie_ack';

// Informational only — the site currently sets no marketing/analytics
// cookies (see /privacy §7), so there's nothing to gate behind Accept/Reject.
// If that changes (e.g. analytics added), this needs to become a real
// consent gate that blocks those cookies until acknowledged.
export default function CookieBar() {
  const t = useTranslations('cookies');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] bg-cz-black-mid flex flex-wrap items-center justify-between"
      style={{ borderTop: '1px solid var(--color-cz-gray-dark)', padding: '16px 24px', gap: 16 }}
    >
      <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.6, maxWidth: 640, margin: 0 }}>
        {t('text')}{' '}
        <Link href="/privacy" className="text-cz-orange hover:underline">
          {t('link')}
        </Link>
      </p>
      <Button type="button" onClick={dismiss} size="sm" className="flex-shrink-0">
        {t('ack')}
      </Button>
    </div>
  );
}
