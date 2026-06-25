'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams } from 'next/navigation';
import Logo from '@/components/ui/Logo';

export default function SetPasswordPage() {
  const router   = useRouter();
  const params   = useParams();
  const locale   = (params?.locale as string) ?? 'cs';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [checking, setChecking]   = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace(`/${locale}/admin/login`);
      } else {
        setChecking(false);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Hesla se neshodují.');
      return;
    }
    if (password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    window.location.href = `/${locale}/admin`;
  }

  if (checking) return null;

  return (
    <div className="min-h-screen bg-cz-black flex items-center justify-center" style={{ padding: 24 }}>
      <div className="w-full max-w-sm bg-cz-black-mid rounded-cz" style={{ padding: '40px 32px', border: '1px solid #2A2A2A' }}>
        <div className="flex flex-col items-center" style={{ marginBottom: 32 }}>
          <Logo size={44} />
          <div className="font-display text-white uppercase" style={{ fontSize: 22, letterSpacing: 2, marginTop: 10 }}>
            CLUTCH ZONE
          </div>
          <div className="font-mono text-cz-orange uppercase" style={{ fontSize: 10, letterSpacing: 4 }}>
            NASTAVIT HESLO
          </div>
        </div>

        <p className="font-mono text-cz-gray-mid" style={{ fontSize: 11, letterSpacing: 1, marginBottom: 24, lineHeight: 1.7 }}>
          Vítejte. Před prvním přihlášením si nastavte heslo.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
              NOVÉ HESLO
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange transition-colors"
              style={{ padding: '10px 14px', fontSize: 14, border: '1px solid #2A2A2A' }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
              POTVRDIT HESLO
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange transition-colors"
              style={{ padding: '10px 14px', fontSize: 14, border: '1px solid #2A2A2A' }}
            />
          </div>

          {error && (
            <p className="font-mono text-red-400" style={{ fontSize: 11, letterSpacing: 1 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark transition-colors rounded-[2px] border-none cursor-pointer disabled:opacity-50"
            style={{ fontSize: 15, letterSpacing: 2, padding: '13px 0', marginTop: 8 }}
          >
            {loading ? '...' : 'ULOŽIT A POKRAČOVAT'}
          </button>
        </form>
      </div>
    </div>
  );
}
