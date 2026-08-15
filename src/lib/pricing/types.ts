export type StationType = 'pc' | 'ps5';
export type PassStationType = StationType | 'any';
export type PriceMode = 'per_hour' | 'flat';
export type OfferKind = 'hours' | 'hours_upsell' | 'pass';

export interface HourTier {
  id: string;
  stationType: StationType;
  hours: number;
  amount: number;
  isActive: boolean;
  sortOrder: number;
}

export interface TimePass {
  id: string;
  slug: string;
  nameCs: string;
  nameEn: string;
  descriptionCs: string;
  descriptionEn: string;
  stationType: PassStationType;
  priceMode: PriceMode;
  amount: number;
  daysOfWeek: number[]; // 0 = neděle … 6 = sobota
  windowStart: string;  // "HH:MM:SS"
  windowEnd: string;    // "HH:MM:SS" — may be "24:00:00"
  crossesMidnight: boolean;
  maxHours: number | null;
  isActive: boolean;
  sortOrder: number;
}

export interface OpeningHoursRow {
  dayOfWeek: number; // 0 = neděle … 6 = sobota
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  crossesMidnight: boolean;
}

export interface DayTypeGroup {
  key: string;
  days: number[];        // sorted 0..6
  label: string;         // "ÚT–ČT", "PÁ", "SO", "NE"
  openTime: string | null;
  closeTime: string | null;
  crossesMidnight: boolean;
  passIds: string[];     // active time_passes valid on these days
}

export interface PricingConfig {
  hourTiers: HourTier[];
  timePasses: TimePass[];
  openingHours: OpeningHoursRow[];
  dayTypes: DayTypeGroup[];
  creditExpiryMonths: number;
}

export interface CalcInput {
  stationType: StationType;
  dayTypeKey: string;
  startHour: number;      // 14–23, po půlnoci 24–27
  durationHours: number;
  stationsCount: number;
}

export interface OfferBreakdownLine {
  label: string;
  qty: number;
  unitAmount: number;
}

export interface Offer {
  id: string;
  kind: OfferKind;
  passId: string | null;
  label: string;
  totalAmount: number;
  amountPerStation: number;
  hoursCovered: number;
  bonusHours: number;
  breakdown: OfferBreakdownLine[];
  isCredit: boolean;
  creditRemainderHours: number;
  effectiveHourly: number;
  savingsVsHourly: number;
  fitsClosingTime: boolean;
}

export interface OfferResult {
  recommended: Offer;
  betterChoice: Offer | null;
  alternatives: Offer[]; // sorted, excludes recommended + betterChoice
  all: Offer[];          // sorted, includes everything (full price table / "zobrazit vše")
}
