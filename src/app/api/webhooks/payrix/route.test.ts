import { describe, it, expect, vi } from 'vitest';

// Mock the webhook-events module before importing route
vi.mock('@/lib/payrix/dal/webhook-events', () => ({
  saveWebhookEvent: vi.fn(),
}));

import { extractEventType } from './route';

describe('extractEventType', () => {
  // Direct field tests
  it('extracts from payload.type', () => {
    expect(extractEventType({ type: 'invoice.created' })).toBe('invoice.created');
  });

  it('extracts from payload.event', () => {
    expect(extractEventType({ event: 'txn.approved' })).toBe('txn.approved');
  });

  it('extracts from payload.eventType', () => {
    expect(extractEventType({ eventType: 'chargeback.opened' })).toBe('chargeback.opened');
  });

  // Payrix alert structure tests
  it('extracts invoice from response.alert.invoiceStatus', () => {
    expect(
      extractEventType({
        response: {
          alert: { invoiceStatus: 'pending' },
        },
      }),
    ).toBe('invoice.pending');
  });

  it('extracts txn from response.alert.txnStatus', () => {
    expect(
      extractEventType({
        response: {
          alert: { txnStatus: 'approved' },
        },
      }),
    ).toBe('txn.approved');
  });

  it('extracts invoice from response.alert.invoiceType', () => {
    expect(
      extractEventType({
        response: {
          alert: { invoiceType: 'recurring' },
        },
      }),
    ).toBe('invoice.recurring');
  });

  it('returns null for alert with invoiceType = "alert"', () => {
    expect(
      extractEventType({
        response: {
          alert: { invoiceType: 'alert' },
        },
      }),
    ).toBeNull();
  });

  // Nested data object tests
  it('extracts from payload.data.event', () => {
    expect(
      extractEventType({
        data: { event: 'merchant.updated' },
      }),
    ).toBe('merchant.updated');
  });

  it('extracts from payload.data.type', () => {
    expect(
      extractEventType({
        data: { type: 'subscription.cancelled' },
      }),
    ).toBe('subscription.cancelled');
  });

  // Generic alert fallback tests
  describe('generic alert fallbacks', () => {
    it('extracts terminalTxn from terminalTxnStatus', () => {
      expect(
        extractEventType({
          response: {
            alert: { terminalTxnStatus: 'approved' },
          },
        }),
      ).toBe('terminalTxn.approved');
    });

    it('extracts merchant from merchantStatus', () => {
      expect(
        extractEventType({
          response: {
            alert: { merchantStatus: 'active' },
          },
        }),
      ).toBe('merchant.active');
    });

    it('extracts subscription from subscriptionStatus', () => {
      expect(
        extractEventType({
          response: {
            alert: { subscriptionStatus: 'paused' },
          },
        }),
      ).toBe('subscription.paused');
    });

    it('extracts disbursement from disbursementStatus', () => {
      expect(
        extractEventType({
          response: {
            alert: { disbursementStatus: 'completed' },
          },
        }),
      ).toBe('disbursement.completed');
    });

    it('extracts chargeback from chargebackStatus', () => {
      expect(
        extractEventType({
          response: {
            alert: { chargebackStatus: 'won' },
          },
        }),
      ).toBe('chargeback.won');
    });

    it('extracts terminalTxn from terminalTxnType', () => {
      expect(
        extractEventType({
          response: {
            alert: { terminalTxnType: 'sale' },
          },
        }),
      ).toBe('terminalTxn.sale');
    });

    it('extracts from resource + status combination', () => {
      expect(
        extractEventType({
          response: {
            alert: { resource: 'invoice', status: 'overdue' },
          },
        }),
      ).toBe('invoice.overdue');
    });

    it('extracts from entity + status combination', () => {
      expect(
        extractEventType({
          response: {
            alert: { entity: 'merchant', status: 'suspended' },
          },
        }),
      ).toBe('merchant.suspended');
    });

    it('extracts standalone type with dot notation', () => {
      expect(
        extractEventType({
          response: {
            alert: { type: 'custom.event.name' },
          },
        }),
      ).toBe('custom.event.name');
    });

    it('returns null for type without dot notation', () => {
      expect(
        extractEventType({
          response: {
            alert: { type: 'generic' },
          },
        }),
      ).toBeNull();
    });
  });

  // Data array fallback tests
  describe('data array fallbacks', () => {
    it('extracts from response.data[0].event', () => {
      expect(
        extractEventType({
          response: {
            data: [{ event: 'txn.voided' }],
          },
        }),
      ).toBe('txn.voided');
    });

    it('extracts from response.data[0].type', () => {
      expect(
        extractEventType({
          response: {
            data: [{ type: 'refund.processed' }],
          },
        }),
      ).toBe('refund.processed');
    });

    it('extracts from response.data[0] resource + status', () => {
      expect(
        extractEventType({
          response: {
            data: [{ resource: 'invoice', status: 'paid' }],
          },
        }),
      ).toBe('invoice.paid');
    });

    it('extracts from response.data[0] entity + status', () => {
      expect(
        extractEventType({
          response: {
            data: [{ entity: 'subscription', status: 'expired' }],
          },
        }),
      ).toBe('subscription.expired');
    });

    it('returns null for status without entity/resource context', () => {
      expect(
        extractEventType({
          response: {
            data: [{ status: 'active' }],
          },
        }),
      ).toBeNull();
    });

    it('handles empty data array', () => {
      expect(
        extractEventType({
          response: {
            data: [],
          },
        }),
      ).toBeNull();
    });
  });

  // Edge cases
  it('returns null for null payload', () => {
    expect(extractEventType(null)).toBeNull();
  });

  it('returns null for non-object payload', () => {
    expect(extractEventType('string')).toBeNull();
    expect(extractEventType(123)).toBeNull();
    expect(extractEventType(true)).toBeNull();
  });

  it('returns null for empty object', () => {
    expect(extractEventType({})).toBeNull();
  });

  it('prioritizes direct fields over alert fallbacks', () => {
    expect(
      extractEventType({
        type: 'direct.event',
        response: {
          alert: { invoiceStatus: 'pending' },
        },
      }),
    ).toBe('direct.event');
  });

  it('prioritizes explicit alert fields over generic fallbacks', () => {
    expect(
      extractEventType({
        response: {
          alert: { 
            invoiceStatus: 'pending',
            terminalTxnStatus: 'approved' 
          },
        },
      }),
    ).toBe('invoice.pending');
  });
});
