export type StationType = 'pc' | 'ps5';

export interface DurationOption {
  duration_h: number;
  duration_minutes: number;
  amount: number;
  label: string;
  timeLabel?: string;
  isHappyHour?: boolean;
  isPass?: boolean;
}

export interface BookingForm {
  stationType: StationType | null;
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:MM
  option: DurationOption | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDiscord: string;
}

export interface BookingResult {
  reference: string;
  stationLabel: string;
}
