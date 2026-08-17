'use client';

import { useMemo, useState } from 'react';
import { deriveDayTypes } from '@/lib/pricing/dayTypes';
import type { DayTypeGroup, HourTier, OpeningHoursRow, TimePass } from '@/lib/pricing/types';
import HourTiersTab from './HourTiersTab';
import ImpactPanel from './ImpactPanel';
import OpeningHoursTab from './OpeningHoursTab';
import TimePassesTab from './TimePassesTab';

type Tab = 'hours' | 'passes' | 'opening';

const TABS: { key: Tab; label: string }[] = [
  { key: 'hours', label: 'HODINOVÉ CENOVKY' },
  { key: 'passes', label: 'ČASOVÉ PASY' },
  { key: 'opening', label: 'OTEVÍRACÍ DOBA' },
];

function sameDayTypes(a: DayTypeGroup[], b: DayTypeGroup[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((g, i) => g.label === b[i]?.label && g.days.join(',') === b[i]?.days.join(','));
}

export default function PricingClient({
  initialHourTiers,
  initialTimePasses,
  initialOpeningHours,
  initialDayTypes,
}: {
  initialHourTiers: HourTier[];
  initialTimePasses: TimePass[];
  initialOpeningHours: OpeningHoursRow[];
  initialDayTypes: DayTypeGroup[];
}) {
  const [tab, setTab] = useState<Tab>('hours');
  const [hourTiers, setHourTiers] = useState(initialHourTiers);
  const [timePasses, setTimePasses] = useState(initialTimePasses);
  const [openingHours, setOpeningHours] = useState(initialOpeningHours);
  const [savedDayTypes, setSavedDayTypes] = useState(initialDayTypes);

  const draftDayTypes = useMemo(() => deriveDayTypes(openingHours, timePasses), [openingHours, timePasses]);
  const isDirty = !sameDayTypes(draftDayTypes, savedDayTypes);

  function commitDayTypes(nextOpeningHours = openingHours, nextTimePasses = timePasses) {
    setSavedDayTypes(deriveDayTypes(nextOpeningHours, nextTimePasses));
  }

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>CENÍK</h1>
        <p className="font-mono text-cz-gray-light" style={{ fontSize: 16, letterSpacing: 2, marginTop: 4 }}>
          SPRÁVA CENOVEK, PASŮ A OTEVÍRACÍ DOBY
        </p>
      </div>

      <ImpactPanel dayTypes={draftDayTypes} isDirty={isDirty} />

      <div className="flex gap-8" style={{ borderBottom: '1px solid #2A2A2A', marginBottom: 28 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="font-mono uppercase"
            style={{
              fontSize: 16, letterSpacing: 2, padding: '0 0 14px', background: 'transparent', border: 'none', cursor: 'pointer',
              color: tab === t.key ? '#E84A1A' : '#888888',
              borderBottom: tab === t.key ? '2px solid #E84A1A' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hours' && (
        <HourTiersTab
          hourTiers={hourTiers}
          onUpdate={(t) => setHourTiers((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
          onCreate={(t) => setHourTiers((prev) => [...prev, t])}
        />
      )}
      {tab === 'passes' && (
        <TimePassesTab
          timePasses={timePasses}
          onUpdate={(p) => {
            const next = timePasses.map((x) => (x.id === p.id ? p : x));
            setTimePasses(next);
            commitDayTypes(openingHours, next);
          }}
          onCreate={(p) => {
            const next = [...timePasses, p];
            setTimePasses(next);
            commitDayTypes(openingHours, next);
          }}
        />
      )}
      {tab === 'opening' && (
        <OpeningHoursTab
          openingHours={openingHours}
          onUpdate={(r) => {
            const next = openingHours.map((x) => (x.dayOfWeek === r.dayOfWeek ? r : x));
            setOpeningHours(next);
            commitDayTypes(next, timePasses);
          }}
        />
      )}
    </div>
  );
}
