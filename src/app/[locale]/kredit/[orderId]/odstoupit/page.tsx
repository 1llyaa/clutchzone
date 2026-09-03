import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { verifyToken } from '@/lib/cancel-token';
import { loadOrderForWithdrawal, WITHDRAWAL_WINDOW_DAYS } from '@/lib/credits/withdrawal';
import WithdrawClient from './WithdrawClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('withdrawTitle'),
    // Signed, per-customer link — must never be indexed.
    robots: { index: false, follow: false },
  };
}

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

function Message({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <h1
        className="font-display text-white uppercase"
        style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: 1.5, lineHeight: 1 }}
      >
        {title}
      </h1>
      <p
        className="font-body text-cz-gray-light"
        style={{ fontSize: 19, lineHeight: 1.8, marginTop: 16 }}
      >
        {body}
      </p>
    </Shell>
  );
}

export default async function WithdrawPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; orderId: string }>;
  searchParams: Promise<{ token?: string; exp?: string }>;
}) {
  const { locale, orderId } = await params;
  const { token, exp } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'withdraw' });

  const expNum = Number(exp);
  const valid =
    Boolean(token) && Number.isFinite(expNum)
      ? await verifyToken('credit-withdraw', orderId, expNum, token as string)
      : false;

  if (!valid) return <Message title={t('invalidTitle')} body={t('invalidBody')} />;

  const order = await loadOrderForWithdrawal(orderId);
  if (!order) return <Message title={t('notFoundTitle')} body={t('notFoundBody')} />;

  return (
    <Shell>
      <WithdrawClient
        order={{
          id: order.id,
          reference: order.reference,
          totalAmount: order.totalAmount,
          items: order.items,
          daysSincePurchase: order.daysSincePurchase,
          withinWindow: order.withinWindow,
          alreadyFulfilled: order.alreadyFulfilled,
          alreadyWithdrawn: order.alreadyWithdrawn,
          canWithdraw: order.canWithdraw,
        }}
        windowDays={WITHDRAWAL_WINDOW_DAYS}
        token={token as string}
        exp={expNum}
      />
    </Shell>
  );
}
