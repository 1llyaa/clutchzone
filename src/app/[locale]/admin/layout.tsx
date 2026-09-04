import type { Metadata } from 'next';

// The admin sign-in and password pages must never be indexable: an indexable
// credential form is what Google Safe Browsing flags as "possible phishing on
// user sign-in". robots.txt already disallows /*/admin, but that only governs
// crawling — Safe Browsing ignores it, and the locale layout otherwise sets
// index, follow for every page beneath it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
