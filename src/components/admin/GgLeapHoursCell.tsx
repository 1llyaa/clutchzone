'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { formatHours } from '@/lib/ggleap/hours';
import { secondaryText } from '@/lib/typography';

type State = 'idle' | 'loading' | 'ok' | 'not_found' | 'unavailable';

/**
 * On-demand ggLeap balance check for one nickname, used in the admin lists.
 *
 * Deliberately click-to-load: auto-loading would fire one ggLeap request per
 * table row on every page render.
 */
export default function GgLeapHoursCell({ username }: { username: string | null }) {
  const [state, setState] = useState<State>('idle');
  const [minutes, setMinutes] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  const nick = username?.trim() ?? '';

  function check() {
    setState('loading');
    fetch(`/api/admin/ggleap/hours?username=${encodeURIComponent(nick)}`)
      .then((res) => (res.ok ? res.json() : { status: 'unavailable' }))
      .then((data) => {
        if (data?.status === 'ok' && typeof data.minutes === 'number') {
          setMinutes(data.minutes);
          setLocked(data.locked === true);
          setState('ok');
        } else if (data?.status === 'not_found') {
          setState('not_found');
        } else {
          setState('unavailable');
        }
      })
      .catch(() => setState('unavailable'));
  }

  if (nick.length < 2) return null;

  if (state === 'idle') {
    return (
      <Button variant="ghost" size="xs" type="button" onClick={check}>
        Hodiny
      </Button>
    );
  }

  if (state === 'loading') {
    return <span className="font-mono" style={{ ...secondaryText, color: 'var(--color-cz-gray-light)' }}>…</span>;
  }

  const label =
    state === 'ok'
      ? `${formatHours(minutes ?? 0, 'cs')}${locked ? ' · zamčený' : ''}`
      : state === 'not_found'
        ? 'účet nenalezen'
        : 'nelze ověřit';

  return (
    <span
      className="font-mono"
      title="Kliknutím načíst znovu"
      onClick={check}
      style={{
        ...secondaryText,
        cursor: 'pointer',
        color: state === 'ok' ? 'var(--color-cz-white-soft)' : 'var(--color-cz-warning)',
      }}
    >
      {label}
    </span>
  );
}
