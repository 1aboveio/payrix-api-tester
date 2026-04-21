import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { PAYRIX_SOURCE_TIMEZONE } from './timezone';

// Detects whether an ISO-like string has an explicit timezone suffix (Z or ±HH:MM).
function hasTimezoneSuffix(s: string): boolean {
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(s.trim());
}

/** Parse a Payrix/tripos timestamp string. Naive strings are treated as ET;
 *  strings with Z or ±HH:MM respect their offset. Returns a JS Date (UTC instant). */
export function parsePayrixTimestamp(input: string | Date | null | undefined): Date | null {
  if (input == null) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  const s = String(input).trim();
  if (!s) return null;
  if (hasTimezoneSuffix(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  // Naive: interpret as a wall clock in ET
  const d = fromZonedTime(s, PAYRIX_SOURCE_TIMEZONE);
  return isNaN(d.getTime()) ? null : d;
}

/** Parse a Payrix integer date (YYYYMMDD) as midnight in ET. */
export function parsePayrixInt(num: number | string | null | undefined): Date | null {
  if (num == null) return null;
  const s = String(num);
  if (s.length !== 8 || !/^\d{8}$/.test(s)) return null;
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00`;
  return fromZonedTime(iso, PAYRIX_SOURCE_TIMEZONE);
}

/** Format a Date (or parseable value) in a target timezone using date-fns format tokens. */
export function formatInTz(
  date: Date | string | number | null | undefined,
  fmt: string,
  tz: string,
): string {
  if (date == null) return '';
  const d =
    typeof date === 'string' || typeof date === 'number'
      ? parsePayrixTimestamp(String(date)) // permissive
      : date;
  if (!d) return '';
  return formatInTimeZone(d, tz, fmt);
}

/** Convenience: parse Payrix timestamp string, format in target tz. */
export function formatPayrixTimestamp(
  input: string | Date | null | undefined,
  fmt: string,
  tz: string,
): string {
  const d = parsePayrixTimestamp(input);
  return d ? formatInTimeZone(d, tz, fmt) : '';
}

/** Convenience: parse Payrix int (YYYYMMDD), format in target tz. */
export function formatPayrixInt(
  num: number | string | null | undefined,
  fmt: string,
  tz: string,
): string {
  const d = parsePayrixInt(num);
  return d ? formatInTimeZone(d, tz, fmt) : '';
}

/** Convert Payrix int (YYYYMMDD) to ISO date string for HTML date inputs (YYYY-MM-DD). */
export function payrixIntToIsoDate(num: number | string | null | undefined): string {
  if (num == null) return '';
  const s = String(num);
  if (s.length !== 8 || !/^\d{8}$/.test(s)) return '';
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/**
 * Convert a naive wall-clock string in a source timezone into the equivalent
 * wall-clock string in Payrix's source tz (ET). Use this when translating a
 * `<input type="datetime-local">` value entered in the user's display tz into
 * a value the Payrix `search` header will interpret correctly.
 */
export function wallClockToPayrixET(
  input: string,
  sourceTz: string,
  fmt = "yyyy-MM-dd'T'HH:mm:ss",
): string {
  const s = input.trim();
  if (!s) return '';
  const utc = fromZonedTime(s, sourceTz);
  if (isNaN(utc.getTime())) return '';
  return formatInTimeZone(utc, PAYRIX_SOURCE_TIMEZONE, fmt);
}
