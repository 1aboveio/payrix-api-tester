import { describe, expect, it } from 'vitest';

import {
  alignCenter,
  formatCardLine,
  renderReceiptToEscPosHex,
  toUtf8Hex,
} from '../escpos-renderer';

describe('Sunmi ESC/POS renderer', () => {
  it('renders merchant and footer sections as expected', () => {
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

    expect(hex).toContain('1B6101');
    expect(hex).toContain('1B2130');
    expect(hex).toContain(toUtf8Hex('Thank you!'));
    expect(hex).toContain(toUtf8Hex('SALE RECEIPT'));
    expect(hex).toContain(toUtf8Hex('TOTAL'));
    expect(hex).toContain(toUtf8Hex('$12.00'));
    expect(hex).toContain('1D5601');
  });

  it('formats cards and alignment helpers consistently', () => {
    expect(formatCardLine('VISA', '1234')).toBe('VISA ****1234');
    expect(formatCardLine('MASTERCARD')).toBe('MASTERCARD');
    expect(alignCenter('Hello', 11)).toBe('   Hello   ');
  });

  it('emits only hex characters', () => {
    const receipt = {
      transactionId: 'TXN-00001',
      status: 'Approved',
      cardType: 'VISA',
      approvalCode: 'ABC123',
      transactionAmount: '5.00',
      timestamp: '2026-03-16 00:16:00',
    };

    const hex = renderReceiptToEscPosHex(receipt);
    expect(/^[0-9A-F]*$/.test(hex)).toBe(true);
    expect(hex.length).toBeGreaterThan(10);
  });
});
