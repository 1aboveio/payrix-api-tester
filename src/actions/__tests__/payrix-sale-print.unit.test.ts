import { describe, expect, it } from 'vitest';

import { isResponseCodePrintable, isSuccessfulSaleResponse } from '@/actions/payrix';

describe('Sunmi sale printing eligibility', () => {
  it('allows partial approval response codes', () => {
    expect(isResponseCodePrintable('5')).toBe(true);
    expect(isResponseCodePrintable('05')).toBe(true);
    expect(isResponseCodePrintable('0')).toBe(true);
    expect(isResponseCodePrintable('00')).toBe(true);
    expect(isResponseCodePrintable('12')).toBe(false);
    expect(isResponseCodePrintable(undefined)).toBe(true);
  });

  it('treats partial-approved sales as successful', () => {
    expect(
      isSuccessfulSaleResponse({
        success: true,
        status: 'PARTIAL APPROVED',
        responseCode: '5',
      })
    ).toBe(true);
  });

  it('treats declined outcomes as not successful even with code 5', () => {
    expect(
      isSuccessfulSaleResponse({
        success: true,
        status: 'DECLINED',
        responseCode: '5',
      })
    ).toBe(false);

    expect(
      isSuccessfulSaleResponse({
        success: true,
        responseMessage: 'declined by bank',
        responseCode: '5',
      })
    ).toBe(false);
  });
});
