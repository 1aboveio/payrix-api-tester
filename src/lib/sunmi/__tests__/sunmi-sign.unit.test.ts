import { describe, expect, it } from 'vitest';

import { generateSunmiSign, isValidSunmiSign } from '../sign';

describe('Sunmi sign generation', () => {
  it('sorts keys alphabetically before hashing', () => {
    const sign = generateSunmiSign(
      {
        timestamp: 1700000000,
        app_id: 'demo-app',
        msn: 'printer-01',
      },
      'super-secret',
    );

    expect(sign).toBe('5da412662888a3fe78411438c1539487');
  });

  it('excludes sign field from hash input', () => {
    const withSignField = generateSunmiSign(
      {
        timestamp: 1700000000,
        app_id: 'demo-app',
        sign: 'should-be-ignored',
        msn: 'printer-01',
      },
      'super-secret',
    );

    const withoutSignField = generateSunmiSign(
      {
        app_id: 'demo-app',
        msn: 'printer-01',
        timestamp: 1700000000,
      },
      'super-secret',
    );

    expect(withSignField).toBe(withoutSignField);
  });
});

describe('Sunmi sign validation', () => {
  it('validates matching sign', () => {
    const sign = generateSunmiSign(
      {
        app_id: 'demo-app',
        timestamp: 1700000000,
        msn: 'printer-01',
      },
      'super-secret',
    );

    expect(
      isValidSunmiSign(
        {
          app_id: 'demo-app',
          timestamp: 1700000000,
          msn: 'printer-01',
          sign,
        },
        'super-secret',
      ),
    ).toBe(true);
  });

  it('rejects mismatched sign', () => {
    expect(
      isValidSunmiSign(
        {
          app_id: 'demo-app',
          timestamp: 1700000000,
          msn: 'printer-01',
          sign: 'wrong',
        },
        'super-secret',
      ),
    ).toBe(false);
  });

  it('rejects missing sign', () => {
    expect(
      isValidSunmiSign(
        {
          app_id: 'demo-app',
          timestamp: 1700000000,
          msn: 'printer-01',
        },
        'super-secret',
      ),
    ).toBe(false);
  });
});
