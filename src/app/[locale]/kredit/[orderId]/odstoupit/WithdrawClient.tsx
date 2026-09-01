'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import Button from '@/components/ui/Button';

type Order = {
  id: string;
  reference: string;
  totalAmount: number;
  items: { stationType: string; hours: number; quantity: number }[];
  daysSincePurchase: number;
  withinWindow: boolean;
  alreadyFulfilled: boolean;
  alreadyWithdrawn: boolean;
  canWithdraw: boolean;
};

export default function WithdrawClient({
  order,
  windowDays,
  token,
  exp,
}: {
  order: Order;
  windowDays: number;
  token: string;
  exp: number;
}) {
  const t = useTranslations('withdraw');
  const [done, setDone] = useState<'withdrawn' | 'already_withdrawn' | null>(
    order.alreadyWithdrawn ? 'already_withdrawn' : null,
  );
  const [refundFailed, setRefundFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/credits/${order.id}/withdraw?token=${encodeURIComponent(token)}&exp=${exp}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
      );
      const data = await res.json();
      // 202 = withdrawal recorded but the Stripe refund itself failed; staff
      // picks it up. Still a success from the customer's side.
      if (!res.ok && res.status !== 202) {
        setError(data.error ?? t('genericError'));
        return;
      }
      if (data.refundStatus === 'failed') setRefundFailed(true);
      setDone(data.status === 'already_withdrawn' ? 'already_withdrawn' : 'withdrawn');
    } catch {
      setError(t('genericError'));
    } finally {
      setBusy(false);
    }
  }

  const itemsLabel = order.items
    .map((i) => `${i.quantity}x ${i.hours}H ${i.stationType.toUpperCase()}`)
    .join(', ');

  const rows: [string, string][] = [
    [t('reference'), order.reference],
    [t('items'), itemsLabel],
    [t('amount'), `${order.totalAmount} Kč`],
  ];

  return (
    <>
      <span
        className="font-mono text-cz-orange uppercase block"
        style={{ fontSize: 16, letterSpacing: 4, marginBottom: 10 }}
      >
        {t('eyebrow')}
      </span>
      <h1
        className="font-display text-white uppercase"
        style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: 1.5, lineHeight: 1 }}
      >
        {done ? t('doneTitle') : t('title')}
      </h1>

      <div
        className="bg-cz-black-mid rounded-control"
        style={{ marginTop: 28, padding: 24, border: '1px solid var(--color-cz-gray-dark)' }}
      >
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline justify-between"
            style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 16 }}
          >
            <span className="font-body text-cz-gray-light" style={{ fontSize: 17 }}>
              {k}
            </span>
            <span className="font-body font-medium text-cz-white-soft" style={{ fontSize: 17 }}>
              {v}
            </span>
          </div>
        ))}
      </div>

      {done ? (
        <div style={{ marginTop: 28 }}>
          <p className="font-body text-cz-white-soft" style={{ fontSize: 19, lineHeight: 1.8 }}>
            {done === 'already_withdrawn' ? t('alreadyWithdrawn') : t('withdrawn')}
          </p>
          <p
            className="font-body text-cz-gray-light"
            style={{ fontSize: 19, lineHeight: 1.8, marginTop: 12 }}
          >
            {refundFailed ? t('refundFailedNote') : t('refundNote')}
          </p>
        </div>
      ) : (
        <div style={{ marginTop: 28 }}>
          <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.8 }}>
            {order.canWithdraw
              ? t('eligibleNote', { days: windowDays })
              : order.alreadyFulfilled
                ? t('fulfilledNote')
                : !order.withinWindow
                  ? t('expiredNote', { days: windowDays })
                  : t('ineligibleNote')}
          </p>

          {error && (
            <p className="font-body text-cz-danger" style={{ fontSize: 17, marginTop: 16 }}>
              {error}
            </p>
          )}

          {order.canWithdraw && (
            <div style={{ marginTop: 24 }}>
              <Button type="button" variant="danger" size="md" onClick={withdraw} disabled={busy}>
                {busy ? t('withdrawing') : t('withdrawButton')}
              </Button>
            </div>
          )}
        </div>
      )}

      <p
        className="font-body text-cz-gray-light"
        style={{ fontSize: 17, lineHeight: 1.7, marginTop: 32 }}
      >
        <Link href="/terms#reklamace" className="text-cz-orange hover:underline">
          {t('complaintsLink')}
        </Link>
      </p>
    </>
  );
}
