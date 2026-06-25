'use client';

import { createContext, useContext, useState } from 'react';

interface ReservationContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const Ctx = createContext<ReservationContextType>({ isOpen: false, open: () => {}, close: () => {} });

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Ctx.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useReservation() {
  return useContext(Ctx);
}
