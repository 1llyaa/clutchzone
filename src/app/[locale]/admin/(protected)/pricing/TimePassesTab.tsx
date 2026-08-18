'use client';

import { useState } from 'react';
import type { PassStationType, PriceMode, TimePass } from '@/lib/pricing/types';
import { labelText, secondaryText, bodyText } from '@/lib/typography';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_ABBR = ['NE', 'PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO'];

type Draft = {
  nameCs: string; nameEn: string; descriptionCs: string; descriptionEn: string;
  stationType: PassStationType; priceMode: PriceMode; amount: number;
  daysOfWeek: number[]; windowStart: string; windowEnd: string; crossesMidnight: boolean; maxHours: number | null;
};

function toDraft(p: TimePass): Draft {
  return {
    nameCs: p.nameCs, nameEn: p.nameEn, descriptionCs: p.descriptionCs, descriptionEn: p.descriptionEn,
    stationType: p.stationType, priceMode: p.priceMode, amount: p.amount,
    daysOfWeek: p.daysOfWeek, windowStart: p.windowStart.slice(0, 5), windowEnd: p.windowEnd.slice(0, 5),
    crossesMidnight: p.crossesMidnight, maxHours: p.maxHours,
  };
}

const EMPTY_DRAFT: Draft = {
  nameCs: '', nameEn: '', descriptionCs: '', descriptionEn: '',
  stationType: 'pc', priceMode: 'flat', amount: 0,
  daysOfWeek: [], windowStart: '14:00', windowEnd: '17:00', crossesMidnight: false, maxHours: null,
};

function DayPills({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {WEEK_ORDER.map((dow) => {
        const active = value.includes(dow);
        return (
          <button
            key={dow}
            type="button"
            onClick={() => onChange(active ? value.filter((d) => d !== dow) : [...value, dow])}
            className="font-mono uppercase"
            style={{ ...labelText, letterSpacing: 1, padding: '5px 10px', borderRadius: 'var(--radius-control)', cursor: 'pointer', color: active ? '#fff' : '#888', background: active ? 'var(--color-cz-orange)' : 'transparent', border: `1px solid ${active ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)'}` }}
          >
            {DAY_ABBR[dow]}
          </button>
        );
      })}
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="font-mono text-cz-gray-light uppercase block" style={{ ...labelText, letterSpacing: 1.5, marginBottom: 6 }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-cz-black text-white font-mono rounded-control" style={{ padding: '8px 12px', fontSize: 16, border: '1px solid var(--color-cz-gray-dark)' }} />
    </div>
  );
}

function previewSentence(d: Draft): string {
  const days = d.daysOfWeek.length
    ? [...d.daysOfWeek].sort((a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b)).map((dow) => DAY_ABBR[dow]).join(', ')
    : '(bez dnů)';
  const price = d.priceMode === 'flat' ? `${d.amount} Kč za celé okno` : `${d.amount} Kč/h`;
  return `Platí ${days} · ${d.windowStart}–${d.windowEnd}${d.crossesMidnight ? ' (+1 den)' : ''} · ${price}`;
}

function PassForm({
  draft, onChange, onSave, onCancel, saving, error,
}: {
  draft: Draft; onChange: (d: Draft) => void; onSave: () => void; onCancel?: () => void; saving: boolean; error: string | null;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Název CS" value={draft.nameCs} onChange={(v) => onChange({ ...draft, nameCs: v })} />
        <TextField label="Název EN" value={draft.nameEn} onChange={(v) => onChange({ ...draft, nameEn: v })} />
        <TextField label="Popis CS" value={draft.descriptionCs} onChange={(v) => onChange({ ...draft, descriptionCs: v })} />
        <TextField label="Popis EN" value={draft.descriptionEn} onChange={(v) => onChange({ ...draft, descriptionEn: v })} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="font-mono text-cz-gray-light uppercase block" style={{ ...labelText, letterSpacing: 1.5, marginBottom: 6 }}>Typ stanice</label>
          <select value={draft.stationType} onChange={(e) => onChange({ ...draft, stationType: e.target.value as PassStationType })} className="w-full bg-cz-black text-white font-mono rounded-control" style={{ padding: '8px 12px', fontSize: 16, border: '1px solid var(--color-cz-gray-dark)' }}>
            <option value="pc">PC</option>
            <option value="ps5">PS5</option>
            <option value="any">OBOJÍ</option>
          </select>
        </div>
        <div>
          <label className="font-mono text-cz-gray-light uppercase block" style={{ ...labelText, letterSpacing: 1.5, marginBottom: 6 }}>Režim ceny</label>
          <select value={draft.priceMode} onChange={(e) => onChange({ ...draft, priceMode: e.target.value as PriceMode })} className="w-full bg-cz-black text-white font-mono rounded-control" style={{ padding: '8px 12px', fontSize: 16, border: '1px solid var(--color-cz-gray-dark)' }}>
            <option value="flat">PAUŠÁL</option>
            <option value="per_hour">ZA HODINU</option>
          </select>
        </div>
        <div>
          <label className="font-mono text-cz-gray-light uppercase block" style={{ ...labelText, letterSpacing: 1.5, marginBottom: 6 }}>Částka (Kč)</label>
          <input type="number" value={draft.amount} onChange={(e) => onChange({ ...draft, amount: Number(e.target.value) })} className="w-full bg-cz-black text-white font-mono rounded-control" style={{ padding: '8px 12px', fontSize: 16, border: '1px solid var(--color-cz-gray-dark)' }} />
        </div>
      </div>

      <div>
        <label className="font-mono text-cz-gray-light uppercase block" style={{ ...labelText, letterSpacing: 1.5, marginBottom: 6 }}>Dny</label>
        <DayPills value={draft.daysOfWeek} onChange={(days) => onChange({ ...draft, daysOfWeek: days })} />
      </div>

      <div className="grid grid-cols-3 gap-3 items-end">
        <div>
          <label className="font-mono text-cz-gray-light uppercase block" style={{ ...labelText, letterSpacing: 1.5, marginBottom: 6 }}>Okno od</label>
          <input type="time" value={draft.windowStart} onChange={(e) => onChange({ ...draft, windowStart: e.target.value })} className="w-full bg-cz-black text-white font-mono rounded-control" style={{ padding: '8px 12px', fontSize: 16, border: '1px solid var(--color-cz-gray-dark)', colorScheme: 'dark' }} />
        </div>
        <div>
          <label className="font-mono text-cz-gray-light uppercase block" style={{ ...labelText, letterSpacing: 1.5, marginBottom: 6 }}>Okno do</label>
          <input type="time" value={draft.windowEnd} onChange={(e) => onChange({ ...draft, windowEnd: e.target.value })} className="w-full bg-cz-black text-white font-mono rounded-control" style={{ padding: '8px 12px', fontSize: 16, border: '1px solid var(--color-cz-gray-dark)', colorScheme: 'dark' }} />
        </div>
        <label className="flex items-center gap-2 font-mono text-cz-gray-light uppercase" style={{ ...labelText, letterSpacing: 1, paddingBottom: 10 }}>
          <input type="checkbox" checked={draft.crossesMidnight} onChange={(e) => onChange({ ...draft, crossesMidnight: e.target.checked })} />
          přesahuje půlnoc
        </label>
      </div>

      {draft.priceMode === 'flat' && (
        <div style={{ maxWidth: 200 }}>
          <label className="font-mono text-cz-gray-light uppercase block" style={{ ...labelText, letterSpacing: 1.5, marginBottom: 6 }}>Max. hodin (nepovinné)</label>
          <input type="number" value={draft.maxHours ?? ''} onChange={(e) => onChange({ ...draft, maxHours: e.target.value ? Number(e.target.value) : null })} className="w-full bg-cz-black text-white font-mono rounded-control" style={{ padding: '8px 12px', fontSize: 16, border: '1px solid var(--color-cz-gray-dark)' }} />
        </div>
      )}

      <div className="font-body" style={{ ...bodyText, color: 'var(--color-cz-white-soft)', background: '#0A0A0A', border: '1px solid var(--color-cz-gray-dark)', borderRadius: 'var(--radius-control)', padding: '10px 14px' }}>
        {previewSentence(draft)}
      </div>

      {error && <p className="font-mono" style={{ ...secondaryText, color: 'var(--color-cz-orange)' }}>{error}</p>}

      <div className="flex gap-3">
        <button onClick={onSave} disabled={saving} className="font-mono text-cz-orange uppercase hover:underline disabled:opacity-50" style={{ ...labelText, letterSpacing: 1 }}>
          {saving ? '...' : 'ULOŽIT'}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="font-mono text-cz-gray-light uppercase hover:underline" style={{ ...labelText, letterSpacing: 1 }}>ZRUŠIT</button>
        )}
      </div>
    </div>
  );
}

export default function TimePassesTab({ timePasses, onUpdate, onCreate }: {
  timePasses: TimePass[];
  onUpdate: (p: TimePass) => void;
  onCreate: (p: TimePass) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNew, setShowNew] = useState(false);
  const [newDraft, setNewDraft] = useState<Draft>(EMPTY_DRAFT);

  function draftFor(p: TimePass): Draft {
    return drafts[p.id] ?? toDraft(p);
  }

  async function save(p: TimePass) {
    const d = draftFor(p);
    setSaving(p.id);
    setErrors((e) => ({ ...e, [p.id]: '' }));
    const res = await fetch(`/api/admin/time-passes/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) { setErrors((e) => ({ ...e, [p.id]: data.error })); return; }
    onUpdate({ ...p, ...d, windowStart: d.windowStart, windowEnd: d.windowEnd });
  }

  async function toggleActive(p: TimePass) {
    setSaving(p.id);
    const res = await fetch(`/api/admin/time-passes/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    setSaving(null);
    if (res.ok) onUpdate({ ...p, isActive: !p.isActive });
  }

  async function createPass() {
    setSaving('new');
    setErrors((e) => ({ ...e, new: '' }));
    const res = await fetch('/api/admin/time-passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDraft),
    });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) { setErrors((e) => ({ ...e, new: data.error })); return; }
    onCreate({
      id: data.id, slug: data.slug, ...newDraft, isActive: true, sortOrder: data.sort_order,
    });
    setNewDraft(EMPTY_DRAFT);
    setShowNew(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {timePasses.map((p) => (
        <div key={p.id} style={{ background: '#111111', border: '1px solid var(--color-cz-gray-dark)', borderRadius: 'var(--radius-control)', padding: 20, opacity: p.isActive ? 1 : 0.55 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <span className="font-display text-white uppercase" style={{ fontSize: 20, letterSpacing: 1 }}>{p.nameCs}</span>
            <button onClick={() => toggleActive(p)} disabled={saving === p.id} className="font-mono uppercase" style={{ ...labelText, letterSpacing: 1, color: p.isActive ? 'var(--color-cz-orange)' : '#888', background: 'transparent', border: `1px solid ${p.isActive ? 'var(--color-cz-orange)' : 'var(--color-cz-gray-dark)'}`, borderRadius: 'var(--radius-control)', padding: '4px 10px', cursor: 'pointer' }}>
              {p.isActive ? 'AKTIVNÍ' : 'VYPNUTO'}
            </button>
          </div>
          <PassForm draft={draftFor(p)} onChange={(d) => setDrafts((prev) => ({ ...prev, [p.id]: d }))} onSave={() => save(p)} saving={saving === p.id} error={errors[p.id] || null} />
        </div>
      ))}

      {showNew ? (
        <div style={{ background: '#111111', border: '1px solid var(--color-cz-orange)', borderRadius: 'var(--radius-control)', padding: 20 }}>
          <span className="font-display text-white uppercase" style={{ fontSize: 20, letterSpacing: 1, display: 'block', marginBottom: 14 }}>NOVÝ PAS</span>
          <PassForm draft={newDraft} onChange={setNewDraft} onSave={createPass} onCancel={() => { setShowNew(false); setNewDraft(EMPTY_DRAFT); }} saving={saving === 'new'} error={errors.new || null} />
        </div>
      ) : (
        <button onClick={() => setShowNew(true)} className="font-mono text-cz-orange uppercase hover:underline self-start" style={{ ...labelText, letterSpacing: 1.5 }}>
          + NOVÝ PAS
        </button>
      )}
    </div>
  );
}
