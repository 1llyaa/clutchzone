'use client';

import { useEffect } from 'react';
import { useReservation } from '@/components/reservation/ReservationContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';

export default function BookingsPage() {
  const { open } = useReservation();

  useEffect(() => {
    open();
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
      </main>
      <Footer />
    </>
  );
}
