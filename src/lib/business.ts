// Legal identity of the business operating Clutch Zone.
// Used by the footer and JSON-LD only. The legal documents in
// src/content/legal deliberately do NOT read from here — they reproduce the
// operator's supplied text verbatim, including its own address and e-mail,
// which currently differ from the values below (see docs/legal-review-notes.md
// section B, pending the operator's decision on which are correct).
export const BUSINESS = {
  ownerName: 'Martin Mašek',
  ico: '23095571',
  registeredAddress: 'V. Volfa 1337/37, 370 05 České Budějovice 2',
  venueAddress: 'Krajinská 244/17, 370 01 České Budějovice',
  phone: '+420 733 104 289',
  email: 'info@clutchzone.cz',
} as const;

// Free-cancellation window per VOP čl. 3.4.1. The API reads the live value
// from site_settings (key `cancellation_window_minutes`); this is only the
// fallback if that row is missing.
export const CANCELLATION_WINDOW_MINUTES = 15;

