'use client';

import { createContext, useContext, useState } from 'react';
import type { StationType } from '@/lib/pricing/types';

export interface ReservationPrefill {
  stationType: StationType;
  dayTypeKey: string;
  startHour: number;
  durationHours: number;
  stationsCount: number;
  offerId: string;
}

interface ReservationContextType {
  isOpen: boolean;
  prefill: ReservationPrefill | null;
  open: (prefill?: ReservationPrefill) => void;
  close: () => void;
}

const Ctx = createContext<ReservationContextType>({ isOpen: false, prefill: null, open: () => {}, close: () => {} });

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<ReservationPrefill | null>(null);
  return (
    <Ctx.Provider
      value={{
        isOpen,
        prefill,
        open: (p) => { setPrefill(p ?? null); setIsOpen(true); },
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useReservation() {
  return useContext(Ctx);
}
