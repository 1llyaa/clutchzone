'use client';

import { useEffect, useState } from 'react';

export type GgLeapHoursState = 'idle' | 'loading' | 'ok' | 'not_found' | 'unavailable';

interface Result {
  state: GgLeapHoursState;
  minutes: number | null;
}

/**
 * Looks a ggLeap nickname up through `/api/ggleap/hours`.
 *
 * Runs once per distinct trimmed nickname while `enabled`, and resets to `idle`
 * the moment it is disabled (e.g. the customer ticks "nemám zatím účet").
 * `debounceMs` keeps a per-keystroke input from firing a request per character.
 */
export function useGgLeapHours(username: string | null, enabled: boolean, debounceMs = 0): Result {
  const [state, setState] = useState<GgLeapHoursState>('idle');
  const [minutes, setMinutes] = useState<number | null>(null);

  const trimmed = (username ?? '').trim();
  const active = enabled && trimmed.length >= 2;

  useEffect(() => {
    if (!active) {
      setState('idle');
      setMinutes(null);
      return;
    }

    let cancelled = false;
    setState('loading');
    setMinutes(null);

    const timer = setTimeout(() => {
      fetch('/api/ggleap/hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      })
        .then((res) => (res.ok ? res.json() : { status: 'unavailable' }))
        .then((data) => {
          if (cancelled) return;
          if (data?.status === 'ok' && typeof data.minutes === 'number') {
            setMinutes(data.minutes);
            setState('ok');
          } else if (data?.status === 'not_found') {
            setState('not_found');
          } else {
            setState('unavailable');
          }
        })
        .catch(() => {
          if (!cancelled) setState('unavailable');
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, active, debounceMs]);

  return { state, minutes };
}
