import type { DayTypeGroup } from './types';

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Upcoming real calendar dates (today included) whose weekday belongs to
 * the given day-type group, nearest first. Used to preselect + offer quick
 * picks in the reservation modal's datepicker (spec §4 Krok 1).
 */
export function nextDatesForDayType(dayType: DayTypeGroup, count: number, from: Date = new Date()): string[] {
  const dates: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(12, 0, 0, 0); // avoid DST edge cases shifting the date
  for (let i = 0; i < 60 && dates.length < count; i++) {
    if (dayType.days.includes(cursor.getDay())) dates.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

/** The day-type group whose weekday set contains this date's weekday, if any. */
export function dayTypeForDate(dayTypes: DayTypeGroup[], isoDate: string): DayTypeGroup | null {
  const dow = new Date(isoDate + 'T12:00:00').getDay();
  return dayTypes.find((g) => g.days.includes(dow)) ?? null;
}
