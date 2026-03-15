import assert from 'node:assert/strict';
import test from 'node:test';

import { generateSunmiSign, isValidSunmiSign } from '../sign.ts';

test('Sunmi sign generation sorts keys alphabetically before hashing', () => {
  const sign = generateSunmiSign(
    {
      timestamp: 1700000000,
      app_id: 'demo-app',
      msn: 'printer-01',
    },
    'super-secret',
  );

  assert.equal(sign, '5da412662888a3fe78411438c1539487');
});

test('sign generation excludes sign field from hash input', () => {
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

  assert.equal(withSignField, withoutSignField);
});

test('validates matching sign', () => {
  const sign = generateSunmiSign(
    {
      app_id: 'demo-app',
      timestamp: 1700000000,
      msn: 'printer-01',
    },
    'super-secret',
  );

  assert.equal(
    isValidSunmiSign(
      {
        app_id: 'demo-app',
        timestamp: 1700000000,
        msn: 'printer-01',
        sign,
      },
      'super-secret',
    ),
    true,
  );
});

test('rejects mismatched sign', () => {
  assert.equal(
    isValidSunmiSign(
      {
        app_id: 'demo-app',
        timestamp: 1700000000,
        msn: 'printer-01',
        sign: 'wrong',
      },
      'super-secret',
    ),
    false,
  );
});

test('rejects missing sign', () => {
  assert.equal(
    isValidSunmiSign(
      {
        app_id: 'demo-app',
        timestamp: 1700000000,
        msn: 'printer-01',
      },
      'super-secret',
    ),
    false,
  );
});
