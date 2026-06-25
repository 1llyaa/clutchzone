import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

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

  return (
    <div className="min-h-screen bg-cz-black flex">
      <AdminSidebar profile={profile} locale={locale} />
      <main className="flex-1 min-h-screen" style={{ marginLeft: 240 }}>
        {children}
      </main>
    </div>
  );
}
