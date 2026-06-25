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
  const messages = await fetchMessages();
  return <MessagesClient messages={messages} />;
}
