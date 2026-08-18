import type { CSSProperties } from 'react';

/**
 * Named style-fragment constants for the CZ type scale.
 *
 * Sizes are wired to the `--text-*` tokens in `src/app/globals.css`, so
 * updating a token there updates every consumer of the matching fragment.
 * Spread these into a component's inline `style={{}}` object instead of
 * hand-typing raw font-size numbers (the established convention in this
 * codebase — see the typography plan).
 *
 * Example:
 *   <p style={{ ...bodyText, color: 'var(--color-cz-white-soft)' }}>...</p>
 */

export const labelText: CSSProperties = {
  fontSize: 'var(--text-label)',
  lineHeight: 1.4,
};

export const secondaryText: CSSProperties = {
  fontSize: 'var(--text-secondary)',
  lineHeight: 1.5,
};

export const bodyText: CSSProperties = {
  fontSize: 'var(--text-body)',
  lineHeight: 1.6,
};

export const leadText: CSSProperties = {
  fontSize: 'var(--text-lead)',
  lineHeight: 1.4,
};

/**
 * Display-scale fragments (font-display headings). Unlike the body-text
 * fragments above these are fixed rem sizes, not fluid — most headings in
 * this codebase currently use ad hoc `clamp()` instead (see Hero.tsx,
 * section headings). These exist so a future heading that doesn't need a
 * fluid clamp() (e.g. a fixed-size card title) can reach for a named step
 * of the scale instead of retyping a raw px/rem number.
 */
export const displayCard: CSSProperties = {
  fontSize: 'var(--text-display-card)',
  lineHeight: 1,
};

export const displaySubsection: CSSProperties = {
  fontSize: 'var(--text-display-subsection)',
  lineHeight: 1,
};

export const displaySection: CSSProperties = {
  fontSize: 'var(--text-display-section)',
  lineHeight: 0.98,
};

export const displayHero: CSSProperties = {
  fontSize: 'var(--text-display-hero)',
  lineHeight: 0.94,
};

/**
 * Shared Phosphor icon-size scale (px), for the `size` prop on
 * `@phosphor-icons/react` icons. Not retrofitted sitewide — use for new/
 * touched icon usages going forward instead of picking an arbitrary number.
 */
export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;
