'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import Button from '@/components/ui/Button';

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

  const [privateEventsImage, setPrivateEventsImage]       = useState(siteSettings.private_events_image ?? '');
  const [uploadingPrivateEvents, setUploadingPrivateEvents] = useState(false);
  const [privateEventsMsg, setPrivateEventsMsg]           = useState('');
  const privateEventsInputRef = useRef<HTMLInputElement>(null);

  const [streamUrl, setStreamUrl]         = useState(siteSettings.stream_url ?? '');
  const [streamVisible, setStreamVisible] = useState(siteSettings.stream_visible === 'true');
  const [savingStream, setSavingStream]   = useState(false);
  const [streamMsg, setStreamMsg]         = useState('');

  const [coinsAmount, setCoinsAmount]     = useState(siteSettings.pay_now_coins_amount ?? '50');
  const [savingCoins, setSavingCoins]     = useState(false);
  const [coinsMsg, setCoinsMsg]           = useState('');

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

  async function handlePrivateEventsUpload(file: File) {
    if (!file.type.startsWith('image/')) return;
    setUploadingPrivateEvents(true);
    setPrivateEventsMsg('');

    const ext = file.name.split('.').pop() ?? 'png';
    const path = `private_events_${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from('private_events').upload(path, file);
    if (upErr) {
      setPrivateEventsMsg(`Chyba: ${upErr.message}`);
      setUploadingPrivateEvents(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('private_events').getPublicUrl(path);

    const res = await fetch('/api/admin/settings/site', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'private_events_image', value: publicUrl }),
    });

    if (res.ok) {
      setPrivateEventsImage(publicUrl);
      setPrivateEventsMsg('Obrázek uložen');
    } else {
      const data = await res.json();
      setPrivateEventsMsg(`Chyba: ${data.error ?? 'Neznámá chyba'}`);
    }

    setUploadingPrivateEvents(false);
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

  async function handleCoinsSave() {
    setSavingCoins(true);
    setCoinsMsg('');
    const res = await updateSetting('pay_now_coins_amount', coinsAmount);
    setSavingCoins(false);
    setCoinsMsg(res ? 'Uloženo' : 'Chyba při ukládání');
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
        <p className="font-mono text-cz-gray-light" style={{ fontSize: 16, letterSpacing: 2, marginTop: 4 }}>
          SPRÁVA UŽIVATELŮ A STANIC
        </p>
      </div>

      {/* Hero image */}
      <div style={{ marginBottom: 48 }}>
        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 20 }}>
          HERO OBRÁZEK
        </div>

        <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid var(--color-cz-gray-dark)', padding: 24 }}>
          <div className="flex items-start gap-6">
            {heroImage && (
              <div
                className="relative flex-shrink-0 rounded-control overflow-hidden"
                style={{ width: 120, height: 160, background: '#0A0A0A', border: '1px solid var(--color-cz-gray-dark)' }}
              >
                <Image
                  src={heroImage}
                  alt="Hero"
                  fill
                  sizes="120px"
                  style={{ objectFit: 'contain', outline: 'none' }}
                />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.5 }}>
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

              <Button
                onClick={() => heroInputRef.current?.click()}
                disabled={uploadingHero}
                size="sm"
                className="self-start"
              >
                {uploadingHero ? 'NAHRÁVÁM...' : 'NAHRÁT NOVÝ OBRÁZEK'}
              </Button>

              {heroMsg && (
                <p
                  className="font-mono"
                  style={{ fontSize: 17, color: heroMsg.startsWith('Chyba') ? 'var(--color-cz-danger)' : 'var(--color-cz-success)' }}
                >
                  {heroMsg}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Private events image */}
      <div style={{ marginBottom: 48 }}>
        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 20 }}>
          OBRÁZEK PRIVÁTNÍCH AKCÍ
        </div>

        <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid var(--color-cz-gray-dark)', padding: 24 }}>
          <div className="flex items-start gap-6">
            {privateEventsImage && (
              <div
                className="relative flex-shrink-0 rounded-control overflow-hidden"
                style={{ width: 160, height: 120, background: '#0A0A0A', border: '1px solid var(--color-cz-gray-dark)' }}
              >
                <Image
                  src={privateEventsImage}
                  alt="Private events"
                  fill
                  sizes="160px"
                  style={{ objectFit: 'cover', outline: 'none' }}
                />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <p className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.5 }}>
                Obrázek zobrazený v sekci privátních akcí (teambuilding, oslavy) na hlavní stránce.
              </p>

              <input
                ref={privateEventsInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePrivateEventsUpload(f);
                }}
              />

              <Button
                onClick={() => privateEventsInputRef.current?.click()}
                disabled={uploadingPrivateEvents}
                size="sm"
                className="self-start"
              >
                {uploadingPrivateEvents ? 'NAHRÁVÁM...' : 'NAHRÁT NOVÝ OBRÁZEK'}
              </Button>

              {privateEventsMsg && (
                <p
                  className="font-mono"
                  style={{ fontSize: 17, color: privateEventsMsg.startsWith('Chyba') ? 'var(--color-cz-danger)' : 'var(--color-cz-success)' }}
                >
                  {privateEventsMsg}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stream settings */}
      <div style={{ marginBottom: 48 }}>
        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 20 }}>
          ŽIVÝ PŘENOS
        </div>

        <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid var(--color-cz-gray-dark)', padding: 24 }}>
          <div className="flex flex-col gap-5">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <span className="font-body text-cz-gray-light" style={{ fontSize: 17 }}>
                Zobrazit stream na hlavní stránce
              </span>
              <button
                onClick={toggleStreamVisible}
                className="font-mono uppercase rounded-control transition-colors"
                style={{
                  fontSize: 16,
                  letterSpacing: 1,
                  padding: '4px 12px',
                  color: streamVisible ? 'var(--color-cz-success)' : 'var(--color-cz-danger)',
                  background: streamVisible
                    ? 'color-mix(in srgb, var(--color-cz-success) 12.5%, transparent)'
                    : 'color-mix(in srgb, var(--color-cz-danger) 12.5%, transparent)',
                }}
              >
                {streamVisible ? 'AKTIVNÍ' : 'SKRYTÝ'}
              </button>
            </div>

            {/* URL input */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>
                TWITCH URL NEBO NÁZEV KANÁLU
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://twitch.tv/channelname"
                  className="bg-cz-black text-white font-body rounded-control focus:outline-none focus:border-cz-orange flex-1"
                  style={{ padding: '10px 14px', fontSize: 19, border: '1px solid var(--color-cz-gray-dark)' }}
                />
                <Button onClick={handleStreamSave} disabled={savingStream} size="sm" className="flex-shrink-0">
                  {savingStream ? '...' : 'ULOŽIT'}
                </Button>
              </div>
              <p className="font-mono text-cz-gray-light" style={{ fontSize: 17, letterSpacing: 1 }}>
                Zadejte celý odkaz (https://twitch.tv/nazev) nebo jen název kanálu
              </p>
            </div>

            {streamMsg && (
              <p
                className="font-mono"
                style={{ fontSize: 17, color: streamMsg.startsWith('Chyba') ? 'var(--color-cz-danger)' : 'var(--color-cz-success)' }}
              >
                {streamMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Coins per payment */}
      <div style={{ marginBottom: 48 }}>
        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 20 }}>
          MINCE ZA PLATBU KARTOU
        </div>

        <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid var(--color-cz-gray-dark)', padding: 24 }}>
          <div className="flex flex-col gap-5">
            {/* Coins amount input */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>
                POČET MINCÍ PŘI PLATBĚ KARTOU
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={coinsAmount}
                  onChange={(e) => setCoinsAmount(e.target.value)}
                  min={0}
                  className="bg-cz-black text-white font-body rounded-control focus:outline-none focus:border-cz-orange flex-1"
                  style={{ padding: '10px 14px', fontSize: 19, border: '1px solid var(--color-cz-gray-dark)' }}
                />
                <Button onClick={handleCoinsSave} disabled={savingCoins} size="sm" className="flex-shrink-0">
                  {savingCoins ? '...' : 'ULOŽIT'}
                </Button>
              </div>
            </div>

            {coinsMsg && (
              <p
                className="font-mono"
                style={{ fontSize: 17, color: coinsMsg.startsWith('Chyba') ? 'var(--color-cz-danger)' : 'var(--color-cz-success)' }}
              >
                {coinsMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Staff accounts */}
      <div style={{ marginBottom: 48 }}>
        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 20 }}>
          UŽIVATELÉ ADMIN PANELU
        </div>

        <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid var(--color-cz-gray-dark)', marginBottom: 20 }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-cz-gray-dark)' }}>
                {['E-MAIL', 'JMÉNO', 'ROLE', 'OD', ''].map((h) => (
                  <th key={h} className="font-mono text-cz-gray-light uppercase text-left" style={{ padding: '12px 16px', fontSize: 16, letterSpacing: 2 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="font-body text-white" style={{ padding: '12px 16px', fontSize: 17 }}>
                    {p.email}
                  </td>
                  <td className="font-body text-cz-gray-light" style={{ padding: '12px 16px', fontSize: 17 }}>
                    {p.display_name || '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      className="font-mono uppercase rounded-control"
                      style={{
                        fontSize: 16,
                        letterSpacing: 1,
                        padding: '3px 8px',
                        color: p.role === 'owner' ? 'var(--color-cz-orange)' : '#888',
                        background: p.role === 'owner' ? 'rgba(232,74,26,0.15)' : '#88888820',
                      }}
                    >
                      {p.role === 'owner' ? 'MAJITEL' : 'RECEPCE'}
                    </span>
                  </td>
                  <td className="font-mono text-cz-gray-light" style={{ padding: '12px 16px', fontSize: 17 }}>
                    {new Date(p.created_at).toLocaleDateString('cs-CZ')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.id !== currentUserId && p.role !== 'owner' && (
                      <button
                        onClick={() => handleRemove(p.id)}
                        disabled={removing === p.id}
                        className="font-mono text-red-400 uppercase hover:underline disabled:opacity-50"
                        style={{ fontSize: 16, letterSpacing: 1 }}
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
            <label className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2 }}>
              POZVAT NOVÉHO ZAMĚSTNANCE
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="bg-cz-black-mid text-white font-body rounded-control focus:outline-none focus:border-cz-orange"
              style={{ padding: '10px 14px', fontSize: 19, border: '1px solid var(--color-cz-gray-dark)', width: 300 }}
            />
          </div>
          <Button disabled={inviting} size="sm">
            {inviting ? '...' : 'ODESLAT POZVÁNKU'}
          </Button>
        </form>
        {inviteMsg && (
          <p
            className="font-mono"
            style={{ fontSize: 17, marginTop: 10, color: inviteMsg.startsWith('Chyba') ? 'var(--color-cz-danger)' : 'var(--color-cz-success)' }}
          >
            {inviteMsg}
          </p>
        )}
      </div>

      {/* Station management */}
      <div>
        <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 3, marginBottom: 20 }}>
          SPRÁVA STANIC
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* PC */}
          <div>
            <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 12 }}>
              PC STANICE
            </div>
            <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid var(--color-cz-gray-dark)' }}>
              {pcStations.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between"
                  style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className="font-mono text-white" style={{ fontSize: 17 }}>
                    {s.label}
                  </span>
                  <button
                    onClick={() => toggleStation(s.id, s.is_active)}
                    disabled={toggling === s.id}
                    className="font-mono uppercase rounded-control transition-colors disabled:opacity-50"
                    style={{
                      fontSize: 16,
                      letterSpacing: 1,
                      padding: '3px 10px',
                      color: s.is_active ? 'var(--color-cz-success)' : 'var(--color-cz-danger)',
                      background: s.is_active
                        ? 'color-mix(in srgb, var(--color-cz-success) 12.5%, transparent)'
                        : 'color-mix(in srgb, var(--color-cz-danger) 12.5%, transparent)',
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
            <div className="font-mono text-cz-gray-light uppercase" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 12 }}>
              PS5 STANICE
            </div>
            <div className="bg-cz-black-mid rounded-cz overflow-hidden" style={{ border: '1px solid var(--color-cz-gray-dark)' }}>
              {ps5Stations.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between"
                  style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className="font-mono text-white" style={{ fontSize: 17 }}>
                    {s.label}
                  </span>
                  <button
                    onClick={() => toggleStation(s.id, s.is_active)}
                    disabled={toggling === s.id}
                    className="font-mono uppercase rounded-control transition-colors disabled:opacity-50"
                    style={{
                      fontSize: 16,
                      letterSpacing: 1,
                      padding: '3px 10px',
                      color: s.is_active ? 'var(--color-cz-success)' : 'var(--color-cz-danger)',
                      background: s.is_active
                        ? 'color-mix(in srgb, var(--color-cz-success) 12.5%, transparent)'
                        : 'color-mix(in srgb, var(--color-cz-danger) 12.5%, transparent)',
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
