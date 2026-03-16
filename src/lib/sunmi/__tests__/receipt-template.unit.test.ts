import { describe, expect, it } from 'vitest';

import { toUtf8Hex } from '../escpos-renderer';
import { renderSaleReceipt } from '../receipt-template';

describe('Tripos sale receipt template', () => {
  it('renders sale transaction details for POS shared printer', () => {
    const saleResponse = {
      transactionType: 'sale',
      status: 'APPROVED',
      transactionId: 'TXN-SALE-1001',
      merchantName: 'Acme Restaurant',
      merchantAddress: '1 Market Street, Kitchen City',
      cardType: 'VISA',
      last4: '4242',
      approvalCode: 'APV123',
      subTotalAmount: '10.00',
      taxAmount: '1.20',
      tipAmount: '2.00',
      transactionAmount: '13.20',
      transactionDateTime: '2026-03-16T10:00:00Z',
    };

    const bytes = renderSaleReceipt(saleResponse);
    const hex = toHex(bytes);

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
    expect(hex).toContain(toUtf8Hex('Acme Restaurant'));
    expect(hex).toContain(toUtf8Hex('SALE RECEIPT'));
    expect(hex).toContain(toUtf8Hex('Transaction ID: TXN-SALE-1001'));
    expect(hex).toContain(toUtf8Hex('Authorization: APV123'));
    expect(hex).toContain(toUtf8Hex('VISA ****4242'));
    expect(hex).toContain(toUtf8Hex('Subtotal'));
    expect(hex).toContain(toUtf8Hex('Tip'));
    expect(hex).toContain(toUtf8Hex('Tax'));
    expect(hex).toContain(toUtf8Hex('TOTAL'));
    expect(hex).toContain(toUtf8Hex('Thank you for your business.'));
  });

  it('handles declined responses and missing fields safely', () => {
    const declined = {
      transactionId: 'TXN-DECLINE-1',
      status: 'DECLINED',
      transactionType: 'sale',
      transactionAmount: '8.00',
    };

    const bytes = renderSaleReceipt(declined);
    const hex = toHex(bytes);

    expect(hex).toContain(toUtf8Hex('DECLINED RECEIPT'));
    expect(hex).toContain(toUtf8Hex('Status: DECLINED'));
    expect(hex).toContain(toUtf8Hex('Transaction ID: TXN-DECLINE-1'));
    expect(hex).toContain(toUtf8Hex('Card: CARD'));
  });

  it('supports refund transaction template', () => {
    const refund = {
      transactionType: 'refund',
      status: 'APPROVED',
      transactionId: 'TXN-RF-1002',
      merchantName: 'Acme Restaurant',
      cardType: 'AMEX',
      last4: '1111',
      approvalCode: 'RFND11',
      transactionAmount: '22.00',
      subTotalAmount: '20.00',
      taxAmount: '2.00',
    };

    const bytes = renderSaleReceipt(refund);
    const hex = toHex(bytes);

    expect(hex).toContain(toUtf8Hex('REFUND RECEIPT'));
    expect(hex).toContain(toUtf8Hex('Return policy:'));
    expect(hex).toContain(toUtf8Hex('AMEX ****1111'));
    expect(hex).toContain(toUtf8Hex('Transaction ID: TXN-RF-1002'));
  });
});

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}
