import type { StationType, DurationOption } from '@/types';

export const PC_PRICES: Record<number, number> = { 1: 75, 3: 215, 5: 345, 7: 475, 10: 660 };
export const PS5_PRICES: Record<number, number> = { 1: 120, 3: 330, 5: 560 };
const HAPPY_HOUR_RATE = 55;

// Returns { open, close } in hours-since-midnight (close can be >24 for after-midnight)
export function getOpeningHours(date: string): { open: number; close: number } | null {
  const d = new Date(date + 'T12:00:00');
  const dow = d.getDay(); // 0=Sun, 1=Mon … 6=Sat
  if (dow === 1) return null; // Monday: closed
  const isFriSat = dow === 5 || dow === 6;
  return { open: 14, close: isFriSat ? 28 : 24 };
}

export function getStartTimeSlots(date: string): string[] {
  const hours = getOpeningHours(date);
  if (!hours) return [];
  const slots: string[] = [];
  // Generate slots every 15 minutes, last slot must leave at least 1h before closing
  const startMin = hours.open * 60;
  const endMin = (hours.close - 1) * 60;
  for (let m = startMin; m <= endMin; m += 15) {
    const h = Math.floor(m / 60) % 24;
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

export function getHourSlots(date: string): string[] {
  const hours = getOpeningHours(date);
  if (!hours) return [];
  const slots: string[] = [];
  for (let h = hours.open; h < hours.close - 1; h++) {
    slots.push(`${String(h % 24).padStart(2, '0')}:00`);
  }
  return slots;
}

export function getDurationOptions(
  type: StationType,
  startTime: string,
  date: string,
): DurationOption[] {
  const hours = getOpeningHours(date);
  if (!hours) return [];

  const [rawH, rawM] = startTime.split(':').map(Number);
  // Slots after midnight (00, 01, 02, 03) are represented as 24, 25, 26, 27
  const startH = (rawH < 14 ? rawH + 24 : rawH) + rawM / 60;

  const durations = type === 'pc' ? [1, 3, 5, 7, 10] : [1, 3, 5];
  const options: DurationOption[] = [];

  for (const dh of durations) {
    const endH = startH + dh;
    if (endH > hours.close) continue; // exceeds closing

    let amount: number;
    let isHappyHour = false;

    if (type === 'pc') {
      if (startH >= 14 && endH <= 17) {
        amount = HAPPY_HOUR_RATE * dh;
        isHappyHour = true;
      } else {
        amount = PC_PRICES[dh];
      }
    } else {
      amount = PS5_PRICES[dh];
    }

    options.push({
      duration_h: dh,
      duration_minutes: dh * 60,
      amount,
      label: `${dh}H`,
      isHappyHour,
    });
  }

  // Evening Pass — PC only, start ≥ 19:00, on days that close at midnight
  const d = new Date(date + 'T12:00:00');
  const dow = d.getDay();
  const isFriSat = dow === 5 || dow === 6;

  if (type === 'pc' && startH >= 19 && !isFriSat) {
    const dh = hours.close - startH;
    options.push({
      duration_h: dh,
      duration_minutes: dh * 60,
      amount: 285,
      label: 'EVENING PASS',
      timeLabel: '19:00 – 00:00',
      isPass: true,
    });
  }

  // Weekend Pass — PC only, start ≥ 22:00, Fri/Sat only
  if (type === 'pc' && startH >= 22 && isFriSat) {
    const dh = hours.close - startH;
    options.push({
      duration_h: dh,
      duration_minutes: dh * 60,
      amount: 340,
      label: 'WEEKEND PASS',
      timeLabel: '22:00 – 04:00',
      isPass: true,
    });
  }

  return options;
}

export function formatTime(hhmm: string): string {
  return hhmm;
}

export function addHours(startTime: string, hours: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = h * 60 + m + hours * 60;
  const rh = Math.floor(totalMin / 60) % 24;
  const rm = totalMin % 60;
  return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`;
}
