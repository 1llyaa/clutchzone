import type { Offer } from './types';

type Translator = (key: string) => string;

export function hoursWord(hours: number, tc: Translator): string {
  if (hours === 1) return tc('hoursWord1');
  if (hours >= 2 && hours <= 4) return tc('hoursWord2to4');
  return tc('hoursWord5plus');
}

export function offerDisplayLabel(offer: Offer, tc: Translator): string {
  if (offer.kind === 'pass') return offer.label;
  return `${offer.hoursCovered} ${hoursWord(offer.hoursCovered, tc)}`;
}
