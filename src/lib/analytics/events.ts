// Spec §12 — event catalogue for the pricing calculator / reservation / credit funnels.
// `reservation_step_reached` isn't named in the spec table but is required to compute
// "drop-off po krocích modalu" (drop-off by modal step).
export const ANALYTICS_EVENTS = [
  'calculator_interacted',
  'calculator_offer_shown',
  'better_choice_applied',
  'better_choice_reverted',
  'calculator_to_reservation',
  'reservation_step_reached',
  'reservation_completed',
  'credit_purchase_completed',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export interface AnalyticsEventProperties {
  calculator_interacted: Record<string, never>;
  calculator_offer_shown: { kind: string; passId: string | null; amount: number };
  better_choice_applied: { amount: number };
  better_choice_reverted: { amount: number };
  calculator_to_reservation: { kind: string; amount: number };
  reservation_step_reached: { step: number };
  reservation_completed: { kind: string; stations: number; amount: number };
  credit_purchase_completed: { amount: number };
}
