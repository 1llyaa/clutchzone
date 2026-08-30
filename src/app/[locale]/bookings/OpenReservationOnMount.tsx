'use client';

import { useEffect } from 'react';
import { useReservation } from '@/components/reservation/ReservationContext';

/**
 * Opens the reservation modal as soon as the page mounts. Rendering nothing is
 * the point — it keeps the only client-side need of `/bookings` out of the page
 * itself, so the page can stay a Server Component and render `Footer`.
 */
export default function OpenReservationOnMount() {
  const { open } = useReservation();

  useEffect(() => {
    open();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once on mount, not on every identity change
  }, []);

  return null;
}
