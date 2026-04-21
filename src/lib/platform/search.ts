/**
 * Utilities for building Payrix `search` HTTP header values.
 *
 * The Payrix Platform API accepts filtered list queries via repeated
 * `search:` HTTP headers. Each header is `field[operator]=value`. Multiple
 * filters on the same request should each be sent as a SEPARATE `search`
 * header — some multi-condition queries do not match when filters are
 * combined into a single semicolon-joined header.
 *
 * Values must NOT be URL-encoded: Payrix doesn't decode header values, and
 * encoding breaks datetime filters (":" becomes "%3A", causing a silent
 * zero-match). HTTP header values tolerate `:`, `T`, and whitespace; the
 * only character to avoid in raw filter values is the header-separator
 * `,` that the Fetch `Headers` API uses when combining same-named entries
 * — which we avoid by sending each filter as its own header.
 */

import type { PlatformSearchFilter } from './types';

/** Format a single filter as `field[operator]=value`. */
export function formatSearchFilter(filter: PlatformSearchFilter): string {
  const value = Array.isArray(filter.value)
    ? filter.value.join(',')
    : String(filter.value);
  return `${filter.field}[${filter.operator}]=${value}`;
}

/**
 * Return one [name, value] tuple per filter, using the header name `search`.
 * Callers pass this to `fetch({ headers: entries })` so each filter arrives
 * as a separate HTTP header on the wire.
 */
export function searchHeaderEntries(
  filters?: PlatformSearchFilter[],
): [string, string][] {
  if (!filters || filters.length === 0) return [];
  return filters.map((f) => ['search', formatSearchFilter(f)] as [string, string]);
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
