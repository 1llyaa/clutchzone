export type DayLocale = 'cs' | 'en' | 'de' | 'ua';

// index = day_of_week (0 = Sunday), matches OpeningHoursRow.dayOfWeek
export const DAY_ABBR: Record<DayLocale, string[]> = {
  cs: ['NE', 'PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO'],
  en: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  de: ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'],
  ua: ['НД', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'],
};

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Po … Ne, for consecutive-run merging (no wrap)

export function formatDayTypeLabel(days: number[], locale: DayLocale): string {
  const names = DAY_ABBR[locale];
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
    .map((run) => (run.length >= 2 ? `${names[run[0]]}–${names[run[run.length - 1]]}` : names[run[0]]))
    .join(', ');
}
