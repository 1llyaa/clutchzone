import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import OpenReservationOnMount from './OpenReservationOnMount';

export default function BookingsPage() {
  return (
    <>
      <Navbar />
      <OpenReservationOnMount />
      <main>
        <Hero />
      </main>
      <Footer />
    </>
  );
}
