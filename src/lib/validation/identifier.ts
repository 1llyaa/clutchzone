/**
 * Whether a value is a canonical UUID.
 *
 * This exists because PostgREST filter strings are comma-separated: an
 * identifier interpolated into `.or()` without a shape check lets the caller
 * append clauses of their own and widen the query to the whole table.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): boolean {
  return typeof value === 'string' && UUID.test(value);
}
