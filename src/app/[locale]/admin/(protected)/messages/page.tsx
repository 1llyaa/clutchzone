import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import MessagesClient from './MessagesClient';

async function fetchMessages() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function MessagesPage() {
  // Checked here as well as in layout.tsx: a layout is not a security
  // boundary — Next renders pages and layouts independently, so a page that
  // relies on its layout alone can be reached on its own.
  const profile = await requireAdmin();
  if (!profile) redirect(`/${await getLocale()}/admin/login`);

  const messages = await fetchMessages();
  return <MessagesClient messages={messages} />;
}
