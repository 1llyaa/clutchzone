import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { requireAdmin } from '@/lib/admin/auth';
import GamesClient from './GamesClient';

export default async function GamesPage() {
  // Checked here as well as in layout.tsx: a layout is not a security
  // boundary — Next renders pages and layouts independently, so a page that
  // relies on its layout alone can be reached on its own.
  const profile = await requireAdmin();
  if (!profile) redirect(`/${await getLocale()}/admin/login`);

  return <GamesClient />;
}
