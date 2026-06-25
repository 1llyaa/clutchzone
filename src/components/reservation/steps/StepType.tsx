'use client';

import { useTranslations } from 'next-intl';
import type { BookingForm, StationType } from '@/types';

interface Props {
  form: BookingForm;
  setForm: (f: BookingForm) => void;
  onNext: () => void;
}

export default function StepType({ form, setForm, onNext }: Props) {
  const t = useTranslations('booking');

  function select(type: StationType) {
    setForm({ ...form, stationType: type });
    setTimeout(onNext, 150);
  }

  const cards = [
    {
      type: 'pc' as StationType,
      title: t('pcTitle'),
      desc: 'RTX 5060 Ti · 240Hz',
      count: t('pcCount'),
      from: '75 Kč/hod',
    },
    {
      type: 'ps5' as StationType,
      title: t('ps5Title'),
      desc: '65" TV · 2× DualSense',
      count: t('ps5Count'),
      from: '120 Kč/hod',
    },
  ];

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
      {cards.map((card) => {
        const selected = form.stationType === card.type;
        return (
          <button
            key={card.type}
            onClick={() => select(card.type)}
            className="flex flex-col text-left bg-transparent cursor-pointer rounded-cz border transition-all duration-150"
            style={{
              padding: '28px 24px',
              borderColor: selected ? '#E84A1A' : '#2A2A2A',
              background: selected ? 'rgba(232,74,26,0.06)' : '#0A0A0A',
            }}
          >
            <span
              className="font-display text-white uppercase"
              style={{ fontSize: 26, letterSpacing: 1, lineHeight: 1 }}
            >
              {card.title}
            </span>
            <span
              className="font-mono text-cz-gray-light uppercase"
              style={{ fontSize: 10, letterSpacing: 2, marginTop: 8 }}
            >
              {card.desc}
            </span>
            <span
              className="font-mono text-cz-gray-mid uppercase"
              style={{ fontSize: 10, letterSpacing: 1, marginTop: 4 }}
            >
              {card.count}
            </span>
            <span
              className="font-display text-cz-orange"
              style={{ fontSize: 22, marginTop: 20, letterSpacing: 1 }}
            >
              od {card.from}
            </span>
          </button>
        );
      })}
    </div>
  );
}
