'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/navigation';
import Button from '@/components/ui/Button';
import type { CancellationSettlement } from '@/lib/bookings/cancellation';

type Booking = {
  groupId: string;
  reference: string;
  date: string;
  startTime: string;
  stationLabels: string[];
  totalPrice: number;
  settlement: CancellationSettlement;
  paid: boolean;
  paysWithCredit: boolean;
  paymentMethod: string;
  minutesBeforeStart: number;
  withinFreeWindow: boolean;
  alreadyCancelled: boolean;
};

type Outcome = {
  status: 'cancelled' | 'already_cancelled';
  creditHours: number;
  refundRequested?: boolean;
  refundAmount?: number;
  /** Credit was due but the ledger row didn't land — staff must be contacted. */
  creditUnrecorded?: boolean;
};

export default function CancelBookingClient({
  booking,
  windowMinutes,
  token,
  exp,
}: {
  booking: Booking;
  windowMinutes: number;
  token: string;
  exp: number;
}) {
  const t = useTranslations('cancel');
  const locale = useLocale();
  const [outcome, setOutcome] = useState<Outcome | null>(
    booking.alreadyCancelled ? { status: 'already_cancelled', creditHours: 0 } : null,
  );
  const [refundRequested, setRefundRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The server already decided what comes back; the UI only phrases it.
  const willEarnCredit = booking.settlement.kind === 'credit' && booking.settlement.hours > 0;
  // A pass is refunded in money, and cancelling here *is* the written request
  // VOP §3.4.1 asks for — so there is no opt-in checkbox, only a statement.
  const willBeRefunded = booking.settlement.kind === 'refund';

  // Hours come off the account only for time actually played, so a credit
  // booking has nothing at stake either way. Every other case turns on whether
  // money was ever received — promising a return or warning about forfeiture
  // would both be false when it wasn't.
  const noteKey = booking.paysWithCredit
    ? 'creditBookingNote'
    : !booking.paid
      ? // An unpaid card booking is not "pay on arrival" — it is a hold that
        // lapses on its own if the payment never lands.
        booking.paymentMethod === 'online'
        ? 'awaitingPaymentNote'
        : 'unpaidNote'
      : booking.minutesBeforeStart <= 0
        ? 'startedNote'
        : !booking.withinFreeWindow
          ? 'lateNote'
          : willBeRefunded
            ? 'freeWindowRefundNote'
            : willEarnCredit
              ? 'freeWindowNote'
              : 'freeWindowNoCreditNote';

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/bookings/${booking.groupId}/cancel?token=${encodeURIComponent(token)}&exp=${exp}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refundRequested: refundRequested && willEarnCredit, locale }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t('genericError'));
        return;
      }
      setOutcome({
        status: data.status,
        creditHours: data.creditHours ?? 0,
        refundRequested: data.refundRequested,
        refundAmount: data.refundAmount ?? 0,
        creditUnrecorded: data.creditUnrecorded,
      });
    } catch {
      setError(t('genericError'));
    } finally {
      setBusy(false);
    }
  }

  const rows: [string, string][] = [
    [t('reference'), booking.reference],
    [t('stations'), booking.stationLabels.join(', ')],
    [t('date'), booking.date],
    // start_time comes back as 'HH:MM:SS' — seconds are noise here.
    [t('time'), booking.startTime.slice(0, 5)],
    // A price on a credit booking reads as money owed; nothing is due.
    booking.paysWithCredit
      ? [t('payment'), t('paidWithCredit')]
      : [t('price'), `${booking.totalPrice} Kč`],
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
        {outcome ? t('doneTitle') : t('title')}
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

      {outcome ? (
        <div style={{ marginTop: 28 }}>
          <p className="font-body text-cz-white-soft" style={{ fontSize: 19, lineHeight: 1.8 }}>
            {outcome.status === 'already_cancelled' ? t('alreadyCancelled') : t('cancelled')}
          </p>
          {/* A pass refund owes money with zero credit hours, so this must not
              be gated on creditHours the way it used to be. */}
          {(outcome.refundRequested || outcome.creditHours > 0) && (
            <p
              className="font-body text-cz-gray-light"
              style={{ fontSize: 19, lineHeight: 1.8, marginTop: 12 }}
            >
              {outcome.refundRequested
                ? t('refundRequestedNote')
                : t('creditNote', { hours: outcome.creditHours })}
            </p>
          )}
          {outcome.creditUnrecorded && (
            <p
              className="font-body text-cz-gray-light"
              style={{ fontSize: 19, lineHeight: 1.8, marginTop: 12 }}
            >
              {t('creditUnrecordedNote')}
            </p>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 28 }}>
          <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.8 }}>
            {t(noteKey, { minutes: windowMinutes, amount: booking.totalPrice })}
          </p>

          {willEarnCredit && (
            <label
              className="flex items-start font-body text-cz-gray-light"
              style={{ gap: 10, marginTop: 18, fontSize: 17, lineHeight: 1.6, cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={refundRequested}
                onChange={(e) => setRefundRequested(e.target.checked)}
                style={{ marginTop: 5, accentColor: 'var(--color-cz-orange)' }}
              />
              <span>{t('refundRequestLabel')}</span>
            </label>
          )}

          {error && (
            <p className="font-body text-cz-danger" style={{ fontSize: 17, marginTop: 16 }}>
              {error}
            </p>
          )}

          <div style={{ marginTop: 24 }}>
            <Button type="button" variant="danger" size="md" onClick={cancel} disabled={busy}>
              {busy ? t('cancelling') : t('cancelButton')}
            </Button>
          </div>
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
