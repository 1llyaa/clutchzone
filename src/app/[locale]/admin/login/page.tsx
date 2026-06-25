'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Logo from '@/components/ui/Logo';

export default function AdminLoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Neplatné přihlašovací údaje.');
      setLoading(false);
      return;
    }

    // Full reload so the server layout re-reads the new session cookie
    window.location.href = window.location.pathname.replace('/admin/login', '/admin');
  }

  return (
    <div
      className="min-h-screen bg-cz-black flex items-center justify-center"
      style={{ padding: 24 }}
    >
      <div
        className="w-full max-w-sm bg-cz-black-mid rounded-cz"
        style={{ padding: '40px 32px', border: '1px solid #2A2A2A' }}
      >
        <div className="flex flex-col items-center" style={{ marginBottom: 36 }}>
          <Logo size={44} />
          <div className="font-display text-white uppercase" style={{ fontSize: 22, letterSpacing: 2, marginTop: 10 }}>
            CLUTCH ZONE
          </div>
          <div className="font-mono text-cz-orange uppercase" style={{ fontSize: 10, letterSpacing: 4 }}>
            ADMIN PANEL
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              className="font-mono text-cz-gray-light uppercase"
              style={{ fontSize: 10, letterSpacing: 2 }}
            >
              E-MAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange transition-colors"
              style={{ padding: '10px 14px', fontSize: 14, border: '1px solid #2A2A2A' }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="font-mono text-cz-gray-light uppercase"
              style={{ fontSize: 10, letterSpacing: 2 }}
            >
              HESLO
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
            {loading ? '...' : 'PŘIHLÁSIT SE'}
          </button>
        </form>
      </div>
    </div>
  );
}
