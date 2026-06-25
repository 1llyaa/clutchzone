'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Logo from '@/components/ui/Logo';

export default function AcceptInvitePage() {
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const access_token  = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (!access_token || !refresh_token) {
      setStatus('error');
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        setStatus('error');
        return;
      }
      // Session set — go to set-password page
      window.location.replace('/cs/admin/set-password');
    });
  }, []);

  return (
    <div className="min-h-screen bg-cz-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Logo size={44} />
        {status === 'loading' ? (
          <p className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 11, letterSpacing: 3 }}>
            OVĚŘOVÁNÍ...
          </p>
        ) : (
          <div className="text-center">
            <p className="font-mono text-red-400 uppercase" style={{ fontSize: 11, letterSpacing: 2 }}>
              Neplatný nebo expirovaný odkaz.
            </p>
            <a href="/cs/admin/login" className="font-mono text-cz-orange" style={{ fontSize: 11 }}>
              Přejít na přihlášení
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
