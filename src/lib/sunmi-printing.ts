/**
 * Sunmi printing utilities — pure functions that can be used outside server actions.
 */

import type { SaleResponse } from '@/lib/payrix/types';

export const PRINT_SUCCESS_CODE = '0';
export const PRINT_SUCCESS_RESPONSE_CODES: ReadonlySet<string> = new Set(['0', '00', '5', '05']);

export function isResponseCodeSuccessful(responseCode: string | undefined): boolean {
  if (!responseCode) return false;
  const code = responseCode.trim();
  return PRINT_SUCCESS_RESPONSE_CODES.has(code);
}

export function isDeclinedStatus(status: string): boolean {
  const s = status.trim().toUpperCase();
  return s === 'DECLINED' || s === 'FAILED' || s === 'NOT APPROVED';
}

export function isSuccessfulStatus(status: string): boolean {
  const s = status.trim().toUpperCase();
  return s === 'APPROVED' || s === 'PARTIAL APPROVED';
}

export function isSuccessfulSaleResponse(saleResponse: SaleResponse): boolean {
  if (saleResponse.success === true) return true;
  if (!isResponseCodeSuccessful(saleResponse.responseCode)) return false;
  const status = saleResponse.status ?? '';
  const responseMessage = saleResponse.responseMessage ?? '';
  if (isDeclinedStatus(status) || isDeclinedStatus(responseMessage)) return false;
  return isSuccessfulStatus(status) || isSuccessfulStatus(responseMessage);
}

export function isResponseCodePrintable(responseCode: string | undefined): boolean {
  return isResponseCodeSuccessful(responseCode);
}
