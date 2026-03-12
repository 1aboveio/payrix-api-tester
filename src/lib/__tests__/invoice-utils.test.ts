import { describe, it, expect } from 'vitest';

// Copy of normalizePaymentMethods for testing
function normalizePaymentMethods(methods: string[]): string[] {
  const mapping: Record<string, string> = {
    'visa': 'Visa',
    'mastercard': 'Mc',
    'master card': 'Mc',
    'amex': 'Amex',
    'american express': 'Amex',
    'discover': 'Discover',
  };
  
  return methods.map(m => {
    const lower = m.toLowerCase().trim();
    return mapping[lower] || m;
  });
}

// Copy of total calculation for testing
function calculateEstimatedTotal(
  lineItems: { item: string; quantity: string; price: string }[],
  tax: number | undefined,
  discount: number | undefined
): number {
  const subtotal = lineItems
    .filter(item => item.item && item.price)
    .reduce((sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.price) || 0), 0);
  
  const taxAmount = tax ?? 0;
  const discountAmount = discount ?? 0;
  return subtotal + taxAmount - discountAmount;
}

describe('normalizePaymentMethods', () => {
  it('normalizes visa to Visa', () => {
    expect(normalizePaymentMethods(['visa'])).toEqual(['Visa']);
  });

  it('normalizes mastercard to Mc', () => {
    expect(normalizePaymentMethods(['mastercard'])).toEqual(['Mc']);
  });

  it('normalizes amex to Amex', () => {
    expect(normalizePaymentMethods(['amex'])).toEqual(['Amex']);
  });

  it('preserves already normalized values', () => {
    expect(normalizePaymentMethods(['Visa', 'Mc', 'Amex'])).toEqual(['Visa', 'Mc', 'Amex']);
  });

  it('handles mixed case input', () => {
    expect(normalizePaymentMethods(['VISA', 'MasterCard'])).toEqual(['Visa', 'Mc']);
  });

  it('passes through unknown methods unchanged', () => {
    expect(normalizePaymentMethods(['UnknownMethod'])).toEqual(['UnknownMethod']);
  });

  it('handles empty array', () => {
    expect(normalizePaymentMethods([])).toEqual([]);
  });
});

describe('calculateEstimatedTotal', () => {
  it('calculates subtotal from line items', () => {
    const lineItems = [
      { item: 'Item 1', quantity: '1', price: '10.00' },
      { item: 'Item 2', quantity: '2', price: '5.00' },
    ];
    expect(calculateEstimatedTotal(lineItems, undefined, undefined)).toBe(20); // 10 + 2*5
  });

  it('adds tax to subtotal', () => {
    const lineItems = [
      { item: 'Item 1', quantity: '1', price: '100' },
    ];
    expect(calculateEstimatedTotal(lineItems, 8.80, undefined)).toBe(108.80);
  });

  it('subtracts discount from subtotal', () => {
    const lineItems = [
      { item: 'Item 1', quantity: '1', price: '100' },
    ];
    expect(calculateEstimatedTotal(lineItems, undefined, 10)).toBe(90);
  });

  it('combines tax and discount', () => {
    const lineItems = [
      { item: 'Item 1', quantity: '1', price: '100' },
    ];
    expect(calculateEstimatedTotal(lineItems, 10, 5)).toBe(105);
  });

  it('handles empty line items', () => {
    expect(calculateEstimatedTotal([], undefined, undefined)).toBe(0);
  });

  it('filters out items without price', () => {
    const lineItems = [
      { item: 'Item 1', quantity: '1', price: '50' },
      { item: 'Item 2', quantity: '1', price: '' },
    ];
    expect(calculateEstimatedTotal(lineItems, undefined, undefined)).toBe(50);
  });

  it('uses quantity fallback of 1', () => {
    const lineItems = [
      { item: 'Item 1', quantity: '', price: '25' },
    ];
    expect(calculateEstimatedTotal(lineItems, undefined, undefined)).toBe(25);
  });
});
