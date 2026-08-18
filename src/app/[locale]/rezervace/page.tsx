'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { useReservation } from '@/components/reservation/ReservationContext';
import { calculatePricing } from '@/lib/pricing/engine';
import type { CalcInput, PricingConfig, StationType } from '@/lib/pricing/types';

// day=<slug> in the share/ad URL — spec §4: /cs/rezervace?type=pc&day=fri&start=19&h=5&st=2
const DAY_SLUG_TO_DOW: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function buildPrefillFromParams(config: PricingConfig, params: URLSearchParams) {
  const typeParam = params.get('type');
  const dayParam = params.get('day');
  const startParam = params.get('start');
  if (!typeParam || !dayParam || !startParam) return null;

  const stationType: StationType = typeParam === 'ps5' ? 'ps5' : 'pc';
  const dow = DAY_SLUG_TO_DOW[dayParam.toLowerCase()];
  if (dow === undefined) return null;

  const dayType = config.dayTypes.find((g) => g.days.includes(dow));
  if (!dayType) return null;

  const startHour = parseInt(startParam, 10);
  const durationHours = parseInt(params.get('h') ?? '3', 10);
  const stationsCount = parseInt(params.get('st') ?? '1', 10);
  if (!Number.isFinite(startHour) || !Number.isFinite(durationHours) || !Number.isFinite(stationsCount)) return null;

  const input: CalcInput = { stationType, dayTypeKey: dayType.key, startHour, durationHours, stationsCount };
  const result = calculatePricing(input, config);
  if (!result) return null;

  return { ...input, offerId: result.recommended.id };
}

export default function RezervacePage() {
  const t = useTranslations('rezervace');
  const { open } = useReservation();
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    fetch('/api/pricing')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setConfig(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!config || triggered) return;
    setTriggered(true);
    const prefill = buildPrefillFromParams(config, searchParams);
    open(prefill ?? undefined);
  }, [config, triggered, searchParams, open]);

  return (
    <>
      <Navbar />
      <main className="flex items-center justify-center" style={{ minHeight: '60vh', padding: '64px 16px' }}>
        <div className="flex flex-col items-center text-center gap-5">
          <span className="font-mono text-cz-orange uppercase" style={{ fontSize: 16, letterSpacing: 2.5 }}>
            {t('eyebrow')}
          </span>
          <h1 className="font-display text-white uppercase" style={{ fontSize: 'clamp(32px, 5vw, 48px)', letterSpacing: 1 }}>
            {t('heading')}
          </h1>
          <Button type="button" onClick={() => open()}>
            {t('openButton')}
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
