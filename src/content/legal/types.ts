// Structured legal content, one module per document per locale.
//
// Legal prose lives here rather than in messages/*.json because it goes
// through a different review process than UI copy (a lawyer/translator signs
// it off, not a copywriter) and because flat message strings can't carry the
// heading/paragraph/list structure these documents need.

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  // Renders as a paragraph with one inline link. `text` must contain the
  // `{link}` placeholder exactly once — that's where `label` gets linked.
  | { type: 'link'; text: string; href: string; label: string }
  // The cookie document lists what is stored as a table; every row must have
  // the same number of cells as `head`.
  | { type: 'table'; head: string[]; rows: string[][] };

export type LegalSection = {
  /** Stable anchor id — deep links (e.g. /privacy#cookies) rely on these. */
  id: string;
  title: string;
  body: LegalBlock[];
};

export type LegalDocument = {
  /** Version stamp recorded against bookings via site_settings.terms_version. */
  version: string;
  eyebrow: string;
  title: string;
  sections: LegalSection[];
};
