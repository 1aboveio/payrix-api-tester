import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { isResponseCodePrintable, isSuccessfulSaleResponse, printSaleReceiptAction } from '@/actions/payrix';

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


describe('Sunmi sale print action', () => {
  const originalEnv = {
    ...process.env,
  };

  const restoreEnv = (): void => {
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  };

  beforeEach(() => {
    restoreEnv();
    process.env.SUNMI_APP_ID = 'test-app-id';
    process.env.SUNMI_APP_KEY = 'test-app-key';
  });

  afterEach(() => {
    restoreEnv();
  });

  it('returns handled failure when Sunmi client config is invalid', async () => {
    process.env.SUNMI_PRINTER_SN = 'SN-12345';
    process.env.SUNMI_ENVIRONMENT = 'invalid';

    const result = await printSaleReceiptAction({
      saleResponse: {
        transactionId: 'txn-1001',
        responseCode: '0',
        status: 'APPROVED',
      },
    });

    expect(result.attempted).toBe(true);
    expect(result.printed).toBe(false);
    expect(result.skipped).toBe(false);
    expect(result.reason).toBe('Failed to send print job to printer.');
    expect(result.error).toContain('Invalid SUNMI_ENVIRONMENT value: invalid.');
  });
});
