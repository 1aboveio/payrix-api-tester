/**
 * Utilities for building Payrix `search` HTTP header values.
 *
 * The Payrix Platform API accepts filtered list queries via repeated
 * `search:` HTTP headers. Each header is `field[operator]=value`. Multiple
 * filters on the same request should each be sent as a SEPARATE `search`
 * header.
 *
 * For multiple conditions on the SAME field (e.g. `created >= X AND
 * created <= Y`), Payrix requires explicit AND grouping via the
 * `and[][field][op]=value` notation — otherwise same-field repetition can
 * silently collapse to the last one or be interpreted as OR. See
 * https://docs.worldpay.com/api-specification/payrix/partner#/rest/welcome-to-payrix-pro/welcome-to-payrix-pro/get-started/advanced-searches
 *
 * Values must NOT be URL-encoded: Payrix doesn't decode header values, and
 * encoding breaks datetime filters (":" becomes "%3A", causing a silent
 * zero-match).
 */

import type { PlatformSearchFilter } from './types';

/** Format a single filter as `field[operator]=value`. */
export function formatSearchFilter(filter: PlatformSearchFilter): string {
  const value = Array.isArray(filter.value)
    ? filter.value.join(',')
    : String(filter.value);
  return `${filter.field}[${filter.operator}]=${value}`;
}

/** Format a filter inside an `and[]` wrapper, e.g. `and[][created][greater]=X`. */
function formatAndFilter(filter: PlatformSearchFilter): string {
  const value = Array.isArray(filter.value)
    ? filter.value.join(',')
    : String(filter.value);
  return `and[][${filter.field}][${filter.operator}]=${value}`;
}

/**
 * Return one [name, value] tuple per filter, using the header name `search`.
 * Callers pass this to an http.request({ headers: record }) where values can
 * be string[] — node preserves repeated headers on the wire.
 *
 * When the same field appears in more than one filter, all filters for that
 * field are wrapped in `and[]` so Payrix explicitly ANDs them.
 */
export function searchHeaderEntries(
  filters?: PlatformSearchFilter[],
): [string, string][] {
  if (!filters || filters.length === 0) return [];
  const counts = new Map<string, number>();
  for (const f of filters) counts.set(f.field, (counts.get(f.field) ?? 0) + 1);
  return filters.map((f) => {
    const repeated = (counts.get(f.field) ?? 0) > 1;
    return ['search', repeated ? formatAndFilter(f) : formatSearchFilter(f)] as [string, string];
  });
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
