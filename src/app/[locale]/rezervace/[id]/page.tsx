import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { verifyToken } from '@/lib/cancel-token';
import {
  loadBookingForCancellation,
  getCancellationWindowMinutes,
  cancellationSettlementFor,
} from '@/lib/bookings/cancellation';
import CancelBookingClient from './CancelBookingClient';

export const metadata: Metadata = {
  title: 'Rezervace — Clutch Zone',
  // A signed, per-customer link — must never reach an index.
  robots: { index: false, follow: false },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="bg-cz-black px-6 py-20 md:px-16 md:py-28">
        <div className="max-w-[620px] mx-auto">{children}</div>
      </main>
      <Footer />
    </>
  );
}

export default async function ManageBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ token?: string; exp?: string }>;
}) {
  const { locale, id } = await params;
  const { token, exp } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'cancel' });

  const expNum = Number(exp);
  const valid =
    Boolean(token) && Number.isFinite(expNum)
      ? await verifyToken('booking-cancel', id, expNum, token as string)
      : false;

  if (!valid) {
    return (
      <Shell>
        <h1
          className="font-display text-white uppercase"
          style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: 1.5, lineHeight: 1 }}
        >
          {t('invalidTitle')}
        </h1>
        <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.8, marginTop: 16 }}>
          {t('invalidBody')}
        </p>
      </Shell>
    );
  }

  const booking = await loadBookingForCancellation(id);
  if (!booking) {
    return (
      <Shell>
        <h1
          className="font-display text-white uppercase"
          style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: 1.5, lineHeight: 1 }}
        >
          {t('notFoundTitle')}
        </h1>
        <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.8, marginTop: 16 }}>
          {t('notFoundBody')}
        </p>
      </Shell>
    );
  }

  const windowMinutes = await getCancellationWindowMinutes();
  // The same rule the API applies, evaluated once here rather than mirrored in
  // the client — an earlier copy of it drifted and silently promised nothing.
  const settlement = cancellationSettlementFor(booking);

  return (
    <Shell>
      <CancelBookingClient
        booking={{
          groupId: booking.groupId,
          reference: booking.reference,
          date: booking.date,
          startTime: booking.startTime,
          stationLabels: booking.stationLabels,
          totalPrice: booking.totalPrice,
          settlement,
          paid: booking.paid,
          paysWithCredit: booking.paysWithCredit,
          paymentMethod: booking.paymentMethod,
          minutesBeforeStart: booking.minutesBeforeStart,
          withinFreeWindow: booking.withinFreeWindow,
          alreadyCancelled: booking.alreadyCancelled,
        }}
        windowMinutes={windowMinutes}
        token={token as string}
        exp={expNum}
      />
    </Shell>
  );
}
