import type { DayTypeGroup, OpeningHoursRow, TimePass } from './types';

const DAY_NAMES_CS = ['NE', 'PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO']; // index = day_of_week, 0 = neděle
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Po … Ne, for consecutive-run merging (no wrap)

function daySignature(row: OpeningHoursRow, passIds: string[]): string {
  if (row.isClosed) return 'closed';
  return `${row.openTime}-${row.closeTime}-${row.crossesMidnight}|${[...passIds].sort().join(',')}`;
}

function parseTimeToHours(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

export function dayTypeOpenHour(d: DayTypeGroup): number {
  return d.openTime ? parseTimeToHours(d.openTime) : 0;
}

export function dayTypeCloseHour(d: DayTypeGroup): number {
  if (!d.closeTime) return 0;
  return parseTimeToHours(d.closeTime) + (d.crossesMidnight ? 24 : 0);
}

function formatDayLabel(days: number[]): string {
  const present = new Set(days);
  const runs: number[][] = [];
  let current: number[] = [];
  for (const day of WEEK_ORDER) {
    if (present.has(day)) {
      current.push(day);
    } else if (current.length) {
      runs.push(current);
      current = [];
    }
  }
  if (current.length) runs.push(current);

  return runs
    .map((run) =>
      run.length >= 2
        ? `${DAY_NAMES_CS[run[0]]}–${DAY_NAMES_CS[run[run.length - 1]]}`
        : DAY_NAMES_CS[run[0]],
    )
    .join(', ');
}

/**
 * Derives calculator "day type" pills from opening_hours + time_passes.
 * Days with an identical (open, close, crosses_midnight, active pass set)
 * signature collapse into a single group — spec §2.4.
 */
export function deriveDayTypes(openingHours: OpeningHoursRow[], timePasses: TimePass[]): DayTypeGroup[] {
  const activePasses = timePasses.filter((p) => p.isActive);

  const passIdsForDay = (dayOfWeek: number): string[] =>
    activePasses.filter((p) => p.daysOfWeek.includes(dayOfWeek)).map((p) => p.id);

  const groups = new Map<string, { rows: OpeningHoursRow[]; passIds: string[] }>();

  for (const row of openingHours) {
    if (row.isClosed) continue;
    const passIds = passIdsForDay(row.dayOfWeek);
    const sig = daySignature(row, passIds);
    const existing = groups.get(sig);
    if (existing) existing.rows.push(row);
    else groups.set(sig, { rows: [row], passIds });
  }

  return [...groups.values()]
    .map(({ rows, passIds }) => {
      const days = rows.map((r) => r.dayOfWeek).sort((a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b));
      const first = rows[0];
      return {
        key: `d${[...days].sort((a, b) => a - b).join('')}`,
        days,
        label: formatDayLabel(days),
        openTime: first.openTime,
        closeTime: first.closeTime,
        crossesMidnight: first.crossesMidnight,
        passIds,
      } satisfies DayTypeGroup;
    })
    .sort((a, b) => WEEK_ORDER.indexOf(a.days[0]) - WEEK_ORDER.indexOf(b.days[0]));
}
