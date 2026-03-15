import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDecoder } from 'node:util';

import {
  alignCenter,
  formatCardLine,
  renderReceiptToEscPosHex,
  toUtf8Hex,
} from '../escpos-renderer.ts';

function hexToBytes(hex: string): number[] {
  const normalized = hex.match(/.{2}/g) ?? [];
  return normalized.map((pair) => Number.parseInt(pair, 16));
}

function bytesContainText(hex: string, text: string): boolean {
  const bytes = hexToBytes(hex);
  return new TextDecoder().decode(Uint8Array.from(bytes)).includes(text);
}

test('renders merchant and footer sections as expected', () => {
  const receipt = {
    merchantName: 'Payrix Merchant',
    transactionId: 'TXN-12345',
    status: 'Approved',
    cardType: 'VISA',
    last4: '1234',
    approvalCode: '123456',
    subTotalAmount: '$10.00',
    tipAmount: '$2.00',
    transactionAmount: '$12.00',
    timestamp: '2026-03-16 00:15:00',
  };

  const hex = renderReceiptToEscPosHex(receipt);

  assert.ok(hex.includes('1B6101'));
  assert.ok(hex.includes('1B2130'));
  assert.ok(bytesContainText(hex, 'Thank you!'));
  assert.ok(bytesContainText(hex, 'SALE RECEIPT'));
  assert.ok(bytesContainText(hex, 'TOTAL'));
  assert.ok(bytesContainText(hex, '$12.00'));
  assert.ok(hex.includes('1D5601'));
  assert.ok(toUtf8Hex('Thank you!').length > 0);
  assert.equal(toUtf8Hex('$12.00').length > 0, true);
});

test('formats cards and alignment helpers consistently', () => {
  assert.equal(formatCardLine('VISA', '1234'), 'VISA ****1234');
  assert.equal(formatCardLine('MASTERCARD'), 'MASTERCARD');
  assert.equal(alignCenter('Hello', 11), '   Hello   ');
});

test('emits only hex characters', () => {
  const receipt = {
    transactionId: 'TXN-00001',
    status: 'Approved',
    cardType: 'VISA',
    approvalCode: 'ABC123',
    transactionAmount: '5.00',
    timestamp: '2026-03-16 00:16:00',
  };

  const hex = renderReceiptToEscPosHex(receipt);
  assert.ok(/^[0-9A-F]*$/.test(hex));
  assert.ok(hex.length > 10);
});
