'use client';

import PriceCalculator from '@/components/pricing/PriceCalculator';
import type { CalcInput, Offer, PricingConfig } from '@/lib/pricing/types';

interface Props {
  config: PricingConfig;
  onOfferChosen: (input: CalcInput, offer: Offer) => void;
}

export default function StepOffer({ config, onOfferChosen }: Props) {
  return <PriceCalculator config={config} variant="compact" onOfferChosen={onOfferChosen} />;
}
