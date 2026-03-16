import { createHash } from 'node:crypto';

export type SunmiSignInput = Record<string, string | number | boolean | undefined | null>;

interface SignNormalizationOptions {
  includeEmptyValues?: boolean;
}

function toPairValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  return `${value}`;
}

function toSignablePairs(params: SunmiSignInput, options: SignNormalizationOptions = {}): [string, string][] {
  return Object.entries(params)
    .filter(([key, value]) => {
      const normalized = value === undefined || value === null ? value : toPairValue(value);
      if (key === 'sign') {
        return false;
      }

      if (!options.includeEmptyValues && (normalized === null || normalized === undefined || normalized === '')) {
        return false;
      }

      return true;
    })
    .map(([key, value]) => [key, toPairValue(value)]);
}

export function buildSunmiSignPayload(params: SunmiSignInput, options: SignNormalizationOptions = {}): string {
  return toSignablePairs(params, options)
    .sort(([aKey], [bKey]) => aKey.localeCompare(bKey))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

export function generateSunmiSign(params: SunmiSignInput, appKey: string): string {
  const payload = buildSunmiSignPayload(params);
  return createHash('md5').update(`${payload}${appKey}`, 'utf8').digest('hex');
}

export function isValidSunmiSign(params: SunmiSignInput, appKey: string): boolean {
  const providedSign = params.sign;
  if (typeof providedSign !== 'string' || providedSign.length === 0) {
    return false;
  }

  const signlessParams: SunmiSignInput = { ...params };
  delete signlessParams.sign;

  const expectedSign = generateSunmiSign(signlessParams, appKey);
  return expectedSign === providedSign.toLowerCase();
}

export function buildSignedPayload(params: SunmiSignInput, appKey: string): Record<string, string> {
  const payload = buildSunmiSignPayload(params);
  const sign = createHash('md5').update(`${payload}${appKey}`, 'utf8').digest('hex');

  const signed: Record<string, string> = {};
  for (const [key, value] of toSignablePairs(params)) {
    signed[key] = value;
  }
  signed.sign = sign;

  return signed;
}

export function buildSignedSearchParams(params: SunmiSignInput, appKey: string): string {
  return new URLSearchParams(buildSignedPayload(params, appKey)).toString();
}

// Backward-compatible helper names used by other callers.
export const generateSign = generateSunmiSign;
export const validateSign = isValidSunmiSign;
