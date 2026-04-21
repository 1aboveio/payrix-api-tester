/**
 * Utilities for building the Payrix `search` HTTP header value.
 *
 * Wire format (verified against the live API):
 *
 *   search: field1[op]=value1;field2[op]=value2;field1[op2]=value3
 *
 * Rules:
 *   - ONE `search` header per request.
 *   - Clauses joined with `;`.
 *   - Default combinator is AND — this applies to same-field repetition
 *     too, so e.g. `created[greater]=A;created[lesser]=B` works as a
 *     date range without any extra wrapper.
 *   - No URL-encoding. Payrix does not decode header values; encoding
 *     breaks datetime filters (":" → "%3A" silently matches nothing).
 *
 * Payrix's docs hint at `and[]` / `or[]` wrappers, but the live API
 * rejects the indexed `and[i][field][op]=value` form with
 *   query_error: "Invalid search operator 'X' given in search request"
 * so we stick to the plain `;`-joined form.
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
 * Build the single `search` header value from a filter list. All clauses
 * use the plain `field[op]=value` form and are joined with `;` — Payrix's
 * default combinator for multiple clauses (including repeated same-field)
 * is AND.
 *
 * An earlier attempt used the `and[i][field][op]=value` indexed wrapper
 * (borrowed from the HiMamaInc Ruby SDK / Payrix OpenAPI examples), but
 * the live API rejects that form with
 *   query_error: "Invalid search operator 'created' given in search request"
 * so we stick to the documented `;`-joined form which is confirmed to
 * work, even for two conditions on the same field (e.g.
 * `created[greater]=A;created[lesser]=B`).
 */
export function buildSearchHeaderValue(filters?: PlatformSearchFilter[]): string {
  if (!filters || filters.length === 0) return '';
  return filters.map(formatSearchFilter).join(';');
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
