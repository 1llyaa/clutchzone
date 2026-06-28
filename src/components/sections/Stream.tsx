'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  streamUrl: string;
}

function extractTwitchChannel(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/(?:twitch\.tv\/)([a-zA-Z0-9_]+)/);
  if (match) return match[1];

  if (/^[a-zA-Z0-9_]+$/.test(trimmed)) return trimmed;

  return null;
}

export default function Stream({ streamUrl }: Props) {
  const t = useTranslations('stream');
  const [parent, setParent] = useState('');
  const channel = extractTwitchChannel(streamUrl);

  useEffect(() => {
    setParent(window.location.hostname);
  }, []);

  if (!channel || !parent) return null;

  return (
    <section
      id="stream"
      className="relative bg-cz-black px-6 py-20 md:px-16 md:py-[120px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000, transparent 80%)',
        }}
      />

      <div className="relative max-w-[1440px] mx-auto">
        {/* Section header */}
        <div style={{ marginBottom: 48 }}>
          <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 11, letterSpacing: 4, marginBottom: 10 }}>
            {t('eyebrow')}
          </span>
          <h2
            className="font-display text-white uppercase inline-block"
            style={{ fontSize: 'clamp(36px, 5vw, 60px)', letterSpacing: 1.5, lineHeight: 0.95, paddingBottom: 14, borderBottom: '2px solid #E84A1A' }}
          >
            {t('heading')}
          </h2>
        </div>

        {/* Stream embed */}
        <div
          className="relative bg-cz-black-mid border border-cz-gray-dark rounded-cz overflow-hidden"
          style={{ padding: 0 }}
        >
          <span className="absolute top-0 left-0 right-0 bg-cz-orange" style={{ height: 2 }} />
          <div style={{ position: 'relative', paddingTop: '56.25%' }}>
            <iframe
              src={`https://player.twitch.tv/?channel=${channel}&parent=${parent}&muted=true`}
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
          </div>
        </div>

        {/* Channel link */}
        <div className="flex items-center gap-3" style={{ marginTop: 16 }}>
          <span className="rounded-full bg-red-500 animate-flicker flex-shrink-0" style={{ width: 8, height: 8 }} />
          <a
            href={`https://twitch.tv/${channel}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-cz-gray-light uppercase hover:text-cz-orange transition-colors"
            style={{ fontSize: 11, letterSpacing: 2 }}
          >
            twitch.tv/{channel}
          </a>
        </div>
      </div>
    </section>
  );
}
