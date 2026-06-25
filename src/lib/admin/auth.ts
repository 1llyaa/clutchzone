import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AdminProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: 'owner' | 'staff';
}

export async function requireAdmin(): Promise<AdminProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, display_name, role')
    .eq('id', user.id)
    .single();

  return (profile as AdminProfile | null);
}
