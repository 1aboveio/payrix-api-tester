/**
 * Utilities for building the Payrix `search` HTTP header value.
 *
 * Payrix's "advanced searches" feature (per the published OpenAPI docs and
 * the HiMamaInc Ruby SDK's wire format) uses a SINGLE `search` header whose
 * value is a list of `&`-joined filter clauses:
 *
 *   - Filters on distinct fields: joined with `&` as plain clauses:
 *       merchant[equals]=X&status[equals]=3
 *
 *   - Multiple conditions on the SAME field (e.g. created >= A AND
 *     created <= B): ALL filters in that group must be wrapped under an
 *     indexed `and[i]` prefix, producing:
 *       and[0][created][greater]=A&and[1][created][less]=B
 *
 * Without the `and[i]` wrapper, Payrix silently collapses same-field
 * repetition.
 *
 * Values are NOT URL-encoded: Payrix does not decode header values, and
 * encoding breaks datetime filters (":" → "%3A" matches nothing).
 *
 * Refs:
 *   https://resource.payrix.com/resources/api-call-syntax
 *   https://github.com/HiMamaInc/payrix (Ruby SDK Compound#construct)
 */

import type { PlatformSearchFilter } from './types';

/** Render a filter value — array values are comma-joined (Payrix `in` form). */
function renderValue(value: PlatformSearchFilter['value']): string {
  return Array.isArray(value) ? value.join(',') : String(value);
}

/**
 * Normalize operator to the canonical Payrix form. Only `equals`, `greater`,
 * `less`, `like`, `in`, and `notEquals` are supported by the live API —
 * short aliases and the `*Equal` family silently return zero results.
 */
function canonicalOperator(op: PlatformSearchFilter['operator']): string {
  switch (op) {
    case 'eq':
    case 'equals':
      return 'equals';
    case 'ne':
    case 'notEquals':
      return 'notEquals';
    case 'gt':
    case 'gte':
    case 'greater':
    case 'greaterEqual':
      return 'greater';
    case 'lt':
    case 'lte':
    case 'less':
    case 'lesser':
    case 'lesserEqual':
      return 'less';
    case 'like':
      return 'like';
    case 'in':
      return 'in';
  }
}

/** Format a standalone filter as `field[operator]=value`. */
export function formatSearchFilter(filter: PlatformSearchFilter): string {
  return `${filter.field}[${canonicalOperator(filter.operator)}]=${renderValue(filter.value)}`;
}

/**
 * Build the single `search` header value from a filter list. Filters on
 * the same field are grouped under `and[i]`; distinct-field filters stay on
 * the plain `field[op]=value` form. Everything is joined with `&`.
 */
export function buildSearchHeaderValue(filters?: PlatformSearchFilter[]): string {
  if (!filters || filters.length === 0) return '';

  // Count occurrences per field to decide whether a given filter needs the
  // `and[i]` wrapper.
  const counts = new Map<string, number>();
  for (const f of filters) counts.set(f.field, (counts.get(f.field) ?? 0) + 1);

  // Running index per field for the and[i] slot number.
  const indexByField = new Map<string, number>();
  const parts: string[] = [];
  for (const f of filters) {
    const total = counts.get(f.field) ?? 0;
    if (total > 1) {
      const i = indexByField.get(f.field) ?? 0;
      indexByField.set(f.field, i + 1);
      parts.push(`and[${i}][${f.field}][${f.operator}]=${renderValue(f.value)}`);
    } else {
      parts.push(formatSearchFilter(f));
    }
  }
  return parts.join('&');
}

/**
 * Header tuples for an http request. A single `search` header carries all
 * filters joined with `&`. Returned as a tuple list so it slots naturally
 * alongside APIKEY and Content-Type.
 */
export function searchHeaderEntries(
  filters?: PlatformSearchFilter[],
): [string, string][] {
  const value = buildSearchHeaderValue(filters);
  return value ? [['search', value]] : [];
}

/**
 * Collapse repeated-header tuples into a Record for debug/history display.
 * Keys that appear multiple times become string[].
 */
export function collectHeadersForDisplay(
  entries: [string, string][],
): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};
  for (const [k, v] of entries) {
    const existing = record[k];
    if (existing === undefined) {
      record[k] = v;
    } else if (Array.isArray(existing)) {
      existing.push(v);
    } else {
      record[k] = [existing, v];
    }
  }
  return record;
}
