'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

interface Station {
  id: string;
  label: string;
  type: string;
  is_active: boolean;
}

export default function SettingsClient({
  profiles,
  stations,
  currentUserId,
  siteSettings,
}: {
  profiles: Profile[];
  stations: Station[];
  currentUserId: string;
  siteSettings: Record<string, string>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting]       = useState(false);
  const [inviteMsg, setInviteMsg]     = useState('');
  const [removing, setRemoving]       = useState<string | null>(null);
  const [toggling, setToggling]       = useState<string | null>(null);

  const [heroImage, setHeroImage]       = useState(siteSettings.hero_image ?? '');
  const [uploadingHero, setUploadingHero] = useState(false);
  const [heroMsg, setHeroMsg]           = useState('');
  const heroInputRef = useRef<HTMLInputElement>(null);

  const [streamUrl, setStreamUrl]         = useState(siteSettings.stream_url ?? '');
  const [streamVisible, setStreamVisible] = useState(siteSettings.stream_visible === 'true');
  const [savingStream, setSavingStream]   = useState(false);
  const [streamMsg, setStreamMsg]         = useState('');

  async function handleHeroUpload(file: File) {
    if (!file.type.startsWith('image/')) return;
    setUploadingHero(true);
    setHeroMsg('');

    const ext = file.name.split('.').pop() ?? 'png';
    const path = `hero_${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from('hero').upload(path, file);
    if (upErr) {
      setHeroMsg(`Chyba: ${upErr.message}`);
      setUploadingHero(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('hero').getPublicUrl(path);

    const res = await fetch('/api/admin/settings/site', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'hero_image', value: publicUrl }),
    });

    if (res.ok) {
      setHeroImage(publicUrl);
      setHeroMsg('Obrázek uložen');
    } else {
      const data = await res.json();
      setHeroMsg(`Chyba: ${data.error ?? 'Neznámá chyba'}`);
    }

    setUploadingHero(false);
    startTransition(() => router.refresh());
  }

  async function updateSetting(key: string, value: string) {
    const res = await fetch('/api/admin/settings/site', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    return res.ok;
  }

  async function handleStreamSave() {
    setSavingStream(true);
    setStreamMsg('');

    const [urlOk, visOk] = await Promise.all([
      updateSetting('stream_url', streamUrl),
      updateSetting('stream_visible', String(streamVisible)),
    ]);

    setSavingStream(false);
    setStreamMsg(urlOk && visOk ? 'Uloženo' : 'Chyba při ukládání');
    startTransition(() => router.refresh());
  }

  async function toggleStreamVisible() {
    const next = !streamVisible;
    setStreamVisible(next);
    await updateSetting('stream_visible', String(next));
    startTransition(() => router.refresh());
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteMsg('');
    const res = await fetch('/api/admin/settings/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json();
    setInviting(false);
    if (res.ok) {
      setInviteMsg(`Pozvánka odeslána na ${inviteEmail}`);
      setInviteEmail('');
      startTransition(() => router.refresh());
    } else {
      setInviteMsg(`Chyba: ${data.error ?? 'Neznámá chyba'}`);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Odebrat přístup tohoto uživatele?')) return;
    setRemoving(id);
    await fetch(`/api/admin/settings/staff/${id}`, { method: 'DELETE' });
    setRemoving(null);
    startTransition(() => router.refresh());
  }

  async function toggleStation(id: string, isActive: boolean) {
    setToggling(id);
    await fetch(`/api/admin/settings/stations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    });
    setToggling(null);
    startTransition(() => router.refresh());
  }

  const pcStations  = stations.filter((s) => s.type === 'pc');
  const ps5Stations = stations.filter((s) => s.type === 'ps5');

  return (
    <div style={{ padding: '40px 48px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 className="font-display text-white uppercase" style={{ fontSize: 36, letterSpacing: 2 }}>
          NASTAVENÍ
        </h1>
        <p className="font-mono text-cz-gray-mid" style={{ fontSize: 11, letterSpacing: 2, marginTop: 4 }}>
          SPRÁVA UŽIVATELŮ A STANIC
        </p>
      </div>

      {/* Hero image */}
      <div style={{ marginBottom: 48 }}>
        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 11, letterSpacing: 3, marginBottom: 20 }}>
          HERO OBRÁZEK
        </div>

        <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid #2A2A2A', padding: 24 }}>
          <div className="flex items-start gap-6">
            {heroImage && (
              <div
                className="relative flex-shrink-0 rounded-[2px] overflow-hidden"
                style={{ width: 120, height: 160, background: '#0A0A0A', border: '1px solid #2A2A2A' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImage}
                  alt="Hero"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', outline: 'none' }}
                />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <p className="font-body text-cz-gray-light" style={{ fontSize: 13, lineHeight: 1.5 }}>
                Obrázek postavy zobrazený v hero sekci na hlavní stránce. Doporučený formát: PNG s průhledným pozadím.
              </p>

              <input
                ref={heroInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleHeroUpload(f);
                }}
              />

              <button
                onClick={() => heroInputRef.current?.click()}
                disabled={uploadingHero}
                className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark active:scale-[0.96] transition-[background-color,scale] duration-150 rounded-[2px] disabled:opacity-50 self-start"
                style={{ fontSize: 12, letterSpacing: 2, padding: '10px 24px' }}
              >
                {uploadingHero ? 'NAHRÁVÁM...' : 'NAHRÁT NOVÝ OBRÁZEK'}
              </button>

              {heroMsg && (
                <p
                  className="font-mono"
                  style={{ fontSize: 11, color: heroMsg.startsWith('Chyba') ? '#ef4444' : '#22c55e' }}
                >
                  {heroMsg}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stream settings */}
      <div style={{ marginBottom: 48 }}>
        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 11, letterSpacing: 3, marginBottom: 20 }}>
          ŽIVÝ PŘENOS
        </div>

        <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid #2A2A2A', padding: 24 }}>
          <div className="flex flex-col gap-5">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <span className="font-body text-cz-gray-light" style={{ fontSize: 13 }}>
                Zobrazit stream na hlavní stránce
              </span>
              <button
                onClick={toggleStreamVisible}
                className="font-mono uppercase rounded-[2px] transition-colors"
                style={{
                  fontSize: 9,
                  letterSpacing: 1,
                  padding: '4px 12px',
                  color: streamVisible ? '#22c55e' : '#ef4444',
                  background: streamVisible ? '#22c55e20' : '#ef444420',
                }}
              >
                {streamVisible ? 'AKTIVNÍ' : 'SKRYTÝ'}
              </button>
            </div>

            {/* URL input */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
                TWITCH URL NEBO NÁZEV KANÁLU
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://twitch.tv/channelname"
                  className="bg-cz-black text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange flex-1"
                  style={{ padding: '10px 14px', fontSize: 13, border: '1px solid #2A2A2A' }}
                />
                <button
                  onClick={handleStreamSave}
                  disabled={savingStream}
                  className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark active:scale-[0.96] transition-[background-color,scale] duration-150 rounded-[2px] disabled:opacity-50 flex-shrink-0"
                  style={{ fontSize: 12, letterSpacing: 2, padding: '10px 24px' }}
                >
                  {savingStream ? '...' : 'ULOŽIT'}
                </button>
              </div>
              <p className="font-mono text-cz-gray-mid" style={{ fontSize: 10, letterSpacing: 1 }}>
                Zadejte celý odkaz (https://twitch.tv/nazev) nebo jen název kanálu
              </p>
            </div>

            {streamMsg && (
              <p
                className="font-mono"
                style={{ fontSize: 11, color: streamMsg.startsWith('Chyba') ? '#ef4444' : '#22c55e' }}
              >
                {streamMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Staff accounts */}
      <div style={{ marginBottom: 48 }}>
        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 11, letterSpacing: 3, marginBottom: 20 }}>
          UŽIVATELÉ ADMIN PANELU
        </div>

        <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid #2A2A2A', marginBottom: 20 }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                {['E-MAIL', 'JMÉNO', 'ROLE', 'OD', ''].map((h) => (
                  <th key={h} className="font-mono text-cz-gray-mid uppercase text-left" style={{ padding: '12px 16px', fontSize: 10, letterSpacing: 2 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="font-body text-white" style={{ padding: '12px 16px', fontSize: 13 }}>
                    {p.email}
                  </td>
                  <td className="font-body text-cz-gray-light" style={{ padding: '12px 16px', fontSize: 13 }}>
                    {p.display_name || '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      className="font-mono uppercase rounded-[2px]"
                      style={{
                        fontSize: 9,
                        letterSpacing: 1,
                        padding: '3px 8px',
                        color: p.role === 'owner' ? '#E84A1A' : '#888',
                        background: p.role === 'owner' ? 'rgba(232,74,26,0.15)' : '#88888820',
                      }}
                    >
                      {p.role === 'owner' ? 'MAJITEL' : 'RECEPCE'}
                    </span>
                  </td>
                  <td className="font-mono text-cz-gray-mid" style={{ padding: '12px 16px', fontSize: 11 }}>
                    {new Date(p.created_at).toLocaleDateString('cs-CZ')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.id !== currentUserId && p.role !== 'owner' && (
                      <button
                        onClick={() => handleRemove(p.id)}
                        disabled={removing === p.id}
                        className="font-mono text-red-400 uppercase hover:underline disabled:opacity-50"
                        style={{ fontSize: 10, letterSpacing: 1 }}
                      >
                        {removing === p.id ? '...' : 'ODEBRAT'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invite form */}
        <form
          onSubmit={handleInvite}
          className="flex items-end gap-3"
        >
          <div className="flex flex-col gap-2">
            <label className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 2 }}>
              POZVAT NOVÉHO ZAMĚSTNANCE
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="bg-cz-black-mid text-white font-body rounded-[2px] focus:outline-none focus:border-cz-orange"
              style={{ padding: '10px 14px', fontSize: 13, border: '1px solid #2A2A2A', width: 300 }}
            />
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="bg-cz-orange text-white font-display uppercase hover:bg-cz-orange-dark rounded-[2px] disabled:opacity-50"
            style={{ fontSize: 12, letterSpacing: 2, padding: '10px 24px' }}
          >
            {inviting ? '...' : 'ODESLAT POZVÁNKU'}
          </button>
        </form>
        {inviteMsg && (
          <p
            className="font-mono"
            style={{ fontSize: 11, marginTop: 10, color: inviteMsg.startsWith('Chyba') ? '#ef4444' : '#22c55e' }}
          >
            {inviteMsg}
          </p>
        )}
      </div>

      {/* Station management */}
      <div>
        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 11, letterSpacing: 3, marginBottom: 20 }}>
          SPRÁVA STANIC
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* PC */}
          <div>
            <div className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>
              PC STANICE
            </div>
            <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid #2A2A2A' }}>
              {pcStations.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between"
                  style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className="font-mono text-white" style={{ fontSize: 12 }}>
                    {s.label}
                  </span>
                  <button
                    onClick={() => toggleStation(s.id, s.is_active)}
                    disabled={toggling === s.id}
                    className="font-mono uppercase rounded-[2px] transition-colors disabled:opacity-50"
                    style={{
                      fontSize: 9,
                      letterSpacing: 1,
                      padding: '3px 10px',
                      color: s.is_active ? '#22c55e' : '#ef4444',
                      background: s.is_active ? '#22c55e20' : '#ef444420',
                    }}
                  >
                    {toggling === s.id ? '...' : s.is_active ? 'AKTIVNÍ' : 'INACTIVE'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PS5 */}
          <div>
            <div className="font-mono text-cz-gray-mid uppercase" style={{ fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>
              PS5 STANICE
            </div>
            <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid #2A2A2A' }}>
              {ps5Stations.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between"
                  style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className="font-mono text-white" style={{ fontSize: 12 }}>
                    {s.label}
                  </span>
                  <button
                    onClick={() => toggleStation(s.id, s.is_active)}
                    disabled={toggling === s.id}
                    className="font-mono uppercase rounded-[2px] transition-colors disabled:opacity-50"
                    style={{
                      fontSize: 9,
                      letterSpacing: 1,
                      padding: '3px 10px',
                      color: s.is_active ? '#22c55e' : '#ef4444',
                      background: s.is_active ? '#22c55e20' : '#ef444420',
                    }}
                  >
                    {toggling === s.id ? '...' : s.is_active ? 'AKTIVNÍ' : 'INACTIVE'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
