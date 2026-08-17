import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNotifications from '@/components/admin/AdminNotifications';

export default async function ProtectedAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/admin/login`);
  }

  const profile = await requireAdmin();

  if (!profile) {
    redirect(`/${locale}/admin/login`);
  }

  const admin = createAdminClient();
  const [{ count: unfulfilledOrdersCount }, { data: unfulfilledBookingRows }] = await Promise.all([
    admin.from('credit_orders').select('id', { count: 'exact', head: true }).eq('payment_status', 'paid').is('fulfilled_at', null),
    admin
      .from('bookings')
      .select('booking_group_id')
      .neq('status', 'cancelled')
      .is('fulfilled_at', null)
      .eq('pays_with_credit', false)
      .or('offer_kind.in.(hours,hours_upsell),and(payment_method.eq.online,payment_status.eq.paid)'),
  ]);
  const unfulfilledBookingGroups = new Set((unfulfilledBookingRows ?? []).map((r) => r.booking_group_id)).size;
  const unfulfilledCreditsCount = (unfulfilledOrdersCount ?? 0) + unfulfilledBookingGroups;

  return (
    <div className="min-h-screen bg-cz-black flex">
      <AdminSidebar profile={profile} locale={locale} unfulfilledCreditsCount={unfulfilledCreditsCount} />
      <main className="flex-1 min-h-screen" style={{ marginLeft: 240 }}>
        {children}
      </main>
      <AdminNotifications locale={locale} />
    </div>
  );
}
