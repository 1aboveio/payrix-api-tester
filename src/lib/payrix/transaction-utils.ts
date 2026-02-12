import type { Transaction } from '@/lib/payrix/types';

export type FlatTransaction = Record<string, string | number | boolean | null | undefined>;

export function flattenTransaction(tx: Transaction): FlatTransaction {
  const result: FlatTransaction = {};

  function walk(obj: Record<string, unknown>, prefix: string) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        walk(value as Record<string, unknown>, fullKey);
      } else {
        result[fullKey] = value as string | number | boolean | null | undefined;
      }
    }
  }

  walk(tx as Record<string, unknown>, '');
  return result;
}

export interface FieldGroup {
  label: string;
  fields: { key: string; value: unknown }[];
}

const FIELD_GROUP_DEFINITIONS: [string, string[]][] = [
  ['Identifiers', ['transactionId', 'referenceNumber', 'ticketNumber', 'terminalId']],
  ['Amounts', ['transactionAmount', 'approvedAmount', 'tipAmount', 'totalAmount', 'cashBackAmount', 'surchargeAmount']],
  ['Card Info', ['cardType', 'last4', 'cardholderName', 'entryMode', 'cardBrand', 'expirationDate']],
  ['Status', ['status', 'transactionType', 'responseCode', 'responseMessage', 'approvalCode']],
  ['Timestamps', ['timestamp', 'createdAt', 'updatedAt']],
];

export function groupTransactionFields(tx: Record<string, unknown>): FieldGroup[] {
  const usedKeys = new Set<string>();
  const groups: FieldGroup[] = [];

  for (const [label, keys] of FIELD_GROUP_DEFINITIONS) {
    const fields = keys
      .filter((key) => tx[key] !== undefined && tx[key] !== null && tx[key] !== '')
      .map((key) => {
        usedKeys.add(key);
        return { key, value: tx[key] };
      });
    if (fields.length > 0) {
      groups.push({ label, fields });
    }
  }

  const remaining = Object.entries(tx)
    .filter(([key, value]) => !usedKeys.has(key) && value !== undefined && value !== null && value !== '')
    .map(([key, value]) => ({ key, value }));

  if (remaining.length > 0) {
    groups.push({ label: 'Other', fields: remaining });
  }

  return groups;
}

export const DEFAULT_VISIBLE_COLUMNS = new Set([
  'transactionId',
  'transactionType',
  'status',
  'transactionAmount',
  'cardType',
  'last4',
  'responseCode',
  'responseMessage',
  'timestamp',
  'referenceNumber',
]);
