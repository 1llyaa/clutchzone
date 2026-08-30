import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BookingSuccessClient from './BookingSuccessClient';

export default function BookingSuccessPage() {
  return (
    <>
      <Navbar />
      {/* Suspense is required: the child reads useSearchParams, which opts out of
          prerendering. Without it the build fails instead of the page. */}
      <Suspense fallback={null}>
        <BookingSuccessClient />
      </Suspense>
      <Footer />
    </>
  );
}
