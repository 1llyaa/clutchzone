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
