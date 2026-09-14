'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { toEmbedUrl } from '@/lib/maps/embed';
import { CONSENT_CHANGED_EVENT, getConsent } from '@/lib/consent/state';

interface Props {
  embedUrl: string;
  visible: boolean;
}

export default function MapSection({ embedUrl, visible }: Props) {
  const t = useTranslations('map');
  const tc = useTranslations('contact');
  const [loaded, setLoaded] = useState(false);

  const src = toEmbedUrl(embedUrl);

  // Google's iframe sets cookies the moment it loads, so it is consent-gated
  // like any other third-party embed: nothing loads until the visitor either
  // has already accepted analytics, or clicks the button below.
  useEffect(() => {
    function sync() {
      if (getConsent() === 'accepted') setLoaded(true);
    }
    sync();
    window.addEventListener(CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, sync);
  }, []);

  if (!visible || !src) return null;

  return (
    <section
      id="mapa"
      // Deliberately outside the max-w-[1440px] container: the map is a
      // full-bleed band sitting directly above the footer.
      className="relative bg-cz-black w-full overflow-hidden"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)', height: 'clamp(320px, 45vh, 520px)' }}
    >
      {loaded ? (
        <iframe
          src={src}
          title={t('iframeTitle')}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      ) : (
        <div className="relative w-full h-full flex flex-col items-center justify-center text-center px-6">
          {/* Same grid overlay as the stream section's placeholder state. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000, transparent 80%)',
            }}
          />
          <div className="relative flex flex-col items-center gap-4">
            <h2 className="font-display text-white uppercase" style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: 1.5, lineHeight: 0.98 }}>
              {t('heading')}
            </h2>
            {/* The address is readable without loading anything from Google —
                the placeholder has to be useful on its own, not just a gate. */}
            <p className="font-body text-cz-white-soft" style={{ fontSize: 17, maxWidth: 460 }}>
              {tc('locationValue')}
            </p>
            <p className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2, maxWidth: 460 }}>
              {t('placeholderText')}
            </p>
            <Button onClick={() => setLoaded(true)} size="sm">
              {t('showButton')}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
