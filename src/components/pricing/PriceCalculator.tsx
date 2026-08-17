'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useReservation } from '@/components/reservation/ReservationContext';
import Reveal from '@/components/ui/Reveal';
import { track } from '@/lib/analytics/track';
import { dayTypeCloseHour, dayTypeOpenHour } from '@/lib/pricing/dayTypes';
import { calculatePricing } from '@/lib/pricing/engine';
import type { CalcInput, Offer, PricingConfig, StationType } from '@/lib/pricing/types';
import BetterChoiceCard from './BetterChoiceCard';
import CalculatorInputs from './CalculatorInputs';
import FullPriceTable from './FullPriceTable';
import OfferCard from './OfferCard';

interface Props {
  config: PricingConfig;
  variant?: 'full' | 'compact';
  /** Compact/in-modal usage: called instead of opening the reservation modal. */
  onOfferChosen?: (input: CalcInput, offer: Offer) => void;
}

function defaultDayTypeKey(config: PricingConfig): string {
  const todayDow = new Date().getDay(); // 0 = neděle … 6 = sobota, matches our convention
  for (let i = 0; i < 7; i++) {
    const dow = (todayDow + i) % 7;
    const group = config.dayTypes.find((g) => g.days.includes(dow));
    if (group) return group.key;
  }
  return config.dayTypes[0]?.key ?? '';
}

export default function PriceCalculator({ config, variant = 'full', onOfferChosen }: Props) {
  const t = useTranslations('calculator');
  const locale = useLocale() === 'en' ? 'en' : 'cs';
  const { open } = useReservation();
  const isCompact = variant === 'compact';

  const [stationType, setStationType] = useState<StationType>('pc');
  const [dayTypeKey, setDayTypeKey] = useState(() => defaultDayTypeKey(config));
  const [startHour, setStartHour] = useState(18);
  const [durationHours, setDurationHours] = useState(3);
  const [stationsCount, setStationsCount] = useState(1);
  const [overrideOfferId, setOverrideOfferId] = useState<string | null>(null);

  const interactedRef = useRef(false);
  function markInteracted() {
    if (interactedRef.current) return;
    interactedRef.current = true;
    track('calculator_interacted', {});
  }

  const dayType = config.dayTypes.find((d) => d.key === dayTypeKey) ?? config.dayTypes[0];

  function handleDayType(key: string) {
    markInteracted();
    setDayTypeKey(key);
    setOverrideOfferId(null);
    const next = config.dayTypes.find((d) => d.key === key);
    if (!next) return;
    const open = Math.round(dayTypeOpenHour(next));
    const close = Math.round(dayTypeCloseHour(next));
    if (startHour < open || startHour > close - 1) setStartHour(open);
  }

  function handleStartHour(h: number) {
    markInteracted();
    setStartHour(h);
    setOverrideOfferId(null);
  }

  function handleDurationHours(h: number) {
    markInteracted();
    setDurationHours(h);
    setOverrideOfferId(null);
  }

  const result = useMemo(() => {
    if (!dayType) return null;
    return calculatePricing({ stationType, dayTypeKey: dayType.key, startHour, durationHours, stationsCount }, config, locale);
  }, [config, stationType, dayType, startHour, durationHours, stationsCount, locale]);

  const shownOfferKey = useMemo(() => {
    if (!result) return null;
    const off = overrideOfferId ? result.all.find((o) => o.id === overrideOfferId) ?? null : null;
    const chosen = off ?? result.recommended;
    return { id: chosen.id, kind: chosen.kind, passId: chosen.passId, amount: chosen.totalAmount };
  }, [result, overrideOfferId]);

  useEffect(() => {
    if (shownOfferKey) track('calculator_offer_shown', { kind: shownOfferKey.kind, passId: shownOfferKey.passId, amount: shownOfferKey.amount });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownOfferKey?.id]);

  if (!dayType || !result) {
    return null; // no open days configured — nothing to calculate
  }

  const closeHour = dayTypeCloseHour(dayType);
  const fitHours = Math.max(0, Math.min(durationHours, closeHour - startHour));
  const fitNote =
    fitHours < durationHours
      ? t('fitNote', { fit: fitHours, rest: durationHours - fitHours })
      : null;

  const overrideOffer = overrideOfferId ? result.all.find((o) => o.id === overrideOfferId) ?? null : null;
  const displayedOffer = overrideOffer ?? result.recommended;
  const upsell = !overrideOffer ? result.alternatives.find((o) => o.kind === 'hours_upsell') ?? null : null;
  const alts = result.alternatives.filter((o) => o.id !== upsell?.id && o.id !== displayedOffer.id).slice(0, 2);

  const calcInput: CalcInput = { stationType, dayTypeKey: dayType.key, startHour, durationHours, stationsCount };

  function handleReserve() {
    track('calculator_to_reservation', { kind: displayedOffer.kind, amount: displayedOffer.totalAmount });
    if (onOfferChosen) {
      onOfferChosen(calcInput, displayedOffer);
      return;
    }
    open({ ...calcInput, offerId: displayedOffer.id });
  }

  const inputsBlock = (
    <CalculatorInputs
      config={config}
      stationType={stationType}
      onStationType={(t) => {
        markInteracted();
        setStationType(t);
        setOverrideOfferId(null);
      }}
      dayType={dayType}
      onDayType={handleDayType}
      startHour={startHour}
      onStartHour={handleStartHour}
      durationHours={durationHours}
      onDurationHours={handleDurationHours}
      stationsCount={stationsCount}
      onStationsCount={(n) => {
        markInteracted();
        setStationsCount(n);
      }}
      fitNote={fitNote}
    />
  );

  const offerBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      {result.betterChoice && !overrideOffer && (
        <BetterChoiceCard
          offer={result.betterChoice}
          recommended={result.recommended}
          onApply={() => {
            track('better_choice_applied', { amount: result.betterChoice!.totalAmount });
            setOverrideOfferId(result.betterChoice!.id);
          }}
        />
      )}

      <OfferCard
        offer={displayedOffer}
        creditExpiryMonths={config.creditExpiryMonths}
        badgeLabel={overrideOffer ? t('selected') : undefined}
        isOverride={!!overrideOffer}
        onRevert={() => {
          track('better_choice_reverted', { amount: displayedOffer.totalAmount });
          setOverrideOfferId(null);
        }}
        upsell={upsell}
        onApplyUpsell={upsell ? () => setOverrideOfferId(upsell.id) : undefined}
        alts={alts}
        onSelectAlt={(id) => setOverrideOfferId(id)}
        onReserve={handleReserve}
        reserveLabel={isCompact ? t('continueLabel') : undefined}
        showKreditLink={!isCompact}
      />
    </div>
  );

  if (isCompact) {
    return (
      <div className="flex flex-col gap-8">
        {inputsBlock}
        {offerBlock}
      </div>
    );
  }

  return (
    <section
      id="cenik"
      className="relative bg-cz-black px-6 py-20 md:px-16 md:py-[104px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, #000, transparent 80%)',
        }}
      />
      <div className="relative max-w-[1200px] mx-auto">
        <Reveal>
          <div style={{ marginBottom: 40 }}>
            <span className="font-mono text-cz-orange uppercase block" style={{ fontSize: 13, letterSpacing: 2.5, marginBottom: 12 }}>
              {t('eyebrow')}
            </span>
            <h2
              className="font-display text-white uppercase"
              style={{ margin: 0, fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 0.98, letterSpacing: 1 }}
            >
              {t('heading')}
            </h2>
            <div style={{ width: 64, height: 2, background: '#E84A1A', marginTop: 24 }} />
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,38fr)_minmax(0,62fr)] gap-12 items-start">
          <Reveal>{inputsBlock}</Reveal>
          <Reveal delay={80}>{offerBlock}</Reveal>
        </div>

        <FullPriceTable config={config} />
      </div>
    </section>
  );
}
