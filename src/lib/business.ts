// Legal identity of the business operating Clutch Zone.
// Used by the footer, the e-mail legal footer and JSON-LD. The legal documents
// in src/content/legal deliberately do NOT read from here — they reproduce the
// operator's supplied text verbatim — but the values below are kept in step
// with them.
//
// registeredAddress is the operator's seat; venueAddress is the club itself.
// The two are deliberately different places, not a mistake. Both now match the
// legal documents, as does the e-mail domain (.club).
export const BUSINESS = {
  ownerName: 'Martin Mašek',
  ico: '23095571',
  registeredAddress: 'Václava Volfa 1337/37, 370 05 České Budějovice',
  venueAddress: 'Krajinská 2381/17, 370 01 České Budějovice',
  phone: '+420 733 104 289',
  email: 'info@clutchzone.club',
} as const;

// Free-cancellation window per VOP čl. 3.4.1. The API reads the live value
// from site_settings (key `cancellation_window_minutes`); this is only the
// fallback if that row is missing.
export const CANCELLATION_WINDOW_MINUTES = 15;

