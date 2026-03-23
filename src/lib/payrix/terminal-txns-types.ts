// Terminal Transactions (Payrix Pro) type definitions
// OpenAPI spec: docs/payrix-openapi31.yaml lines 59556-61600

export type TerminalTxnBinType = 'CREDIT' | 'DEBIT' | 'PREPAID';
export type TerminalTxnSwiped = 0 | 1;
export type TerminalTxnPin = 0 | 1;
export type TerminalTxnSignature = 0 | 1;
export type TerminalTxnPos = 0 | 1;
export type TerminalTxnUnattended = 0 | 1;
export type TerminalTxnInactive = 0 | 1;
export type TerminalTxnFrozen = 0 | 1;

export type TerminalTxnEntryMode =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export type TerminalTxnType = 1 | 2 | 4 | 5 | 13;

export type TerminalTxnOrigin = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type TerminalTxnReceipt = 'noReceipt' | 'merchant' | 'customer' | 'both';

export interface TerminalTxn {
  id: string;
  type: TerminalTxnType;
  total: number; // In cents
  currency: string;
  fundingCurrency?: string;
  merchant: string;
  mid?: string;
  origin: TerminalTxnOrigin;
  pos: TerminalTxnPos;
  binType: TerminalTxnBinType;
  swiped: TerminalTxnSwiped;
  pin: TerminalTxnPin;
  signature: TerminalTxnSignature;
  reserved: number;
  status: number;
  inactive: TerminalTxnInactive;
  frozen: TerminalTxnFrozen;
  tip?: number;
  cashback?: number;
  expiration?: string;       // MMYY
  authCode?: string;
  authDate?: string;          // YYYYMMDD
  traceNumber?: number;
  token?: string;
  paymentNumber?: number;      // Last 4
  receipt?: TerminalTxnReceipt;
  tid?: string;
  txn?: string;
  forterminalTxn?: string;
  description?: string;
  order?: string;
  company?: string;
  email?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  entryMode?: TerminalTxnEntryMode;
  first?: string;
  last?: string;
  middle?: string;
  posApplicationId?: string;
  posApplicationName?: string;
  posApplicationVersion?: string;
  unattended?: TerminalTxnUnattended;
  customerReferenceNumber?: string;
  gatewayTransactionId?: string;
  customerTicketNumber?: string;
  clientIp?: string;
  cardNetworkTransactionId?: string;
  omnitoken?: string;
  convenienceFee?: number;
  surcharge?: number;
  paymentMethod?: string;
  payment?: Record<string, unknown>;
  created?: string;
  modified?: string;
  terminalTxnResults?: unknown[];
  terminalTxnDatas?: unknown[];
  terminalTxnMetadatas?: unknown[];
}

export interface CreateTerminalTxnRequest {
  type: TerminalTxnType;
  total: number;        // In cents
  currency: string;
  fundingCurrency: string;
  merchant: string;
  mid: string;
  origin: TerminalTxnOrigin;
  pos: TerminalTxnPos;
  binType: TerminalTxnBinType;
  swiped: TerminalTxnSwiped;
  pin: TerminalTxnPin;
  signature: TerminalTxnSignature;
  reserved: number;
  status: number;
  inactive: TerminalTxnInactive;
  frozen: TerminalTxnFrozen;
  tip?: number;
  cashback?: number;
  expiration?: string;
  authCode?: string;
  authDate?: string;
  traceNumber?: number;
  token?: string;
  paymentNumber?: number;
  receipt?: TerminalTxnReceipt;
  tid?: string;
  txn?: string;
  forterminalTxn?: string;
  description?: string;
  order?: string;
  company?: string;
  email?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  entryMode?: TerminalTxnEntryMode;
  first?: string;
  last?: string;
  middle?: string;
  posApplicationId?: string;
  posApplicationName?: string;
  posApplicationVersion?: string;
  unattended?: TerminalTxnUnattended;
  customerReferenceNumber?: string;
  gatewayTransactionId?: string;
  customerTicketNumber?: string;
  clientIp?: string;
  cardNetworkTransactionId?: string;
  omnitoken?: string;
  convenienceFee?: number;
  surcharge?: number;
  paymentMethod?: string;
  payment?: Record<string, unknown>;
  platform?: string;
}

export const TERMINAL_TXN_TYPE_LABELS: Record<TerminalTxnType, string> = {
  1: 'Sale',
  2: 'Auth',
  4: 'Reverse Auth',
  5: 'Refund',
  13: 'Batch Out',
};

export const TERMINAL_TXN_ORIGIN_LABELS: Record<TerminalTxnOrigin, string> = {
  1: 'Credit Card Terminal',
  2: 'eCommerce',
  3: 'MOTO',
  4: 'Apple Pay (deprecated)',
  5: '3D Secure (Success)',
  6: '3D Secure (Attempted)',
  7: 'Recurring (deprecated)',
  8: 'Payframe',
  9: 'Writing',
};

export const TERMINAL_TXN_BIN_TYPE_LABELS: Record<TerminalTxnBinType, string> = {
  CREDIT: 'Credit',
  DEBIT: 'Debit',
  PREPAID: 'Prepaid',
};

export const TERMINAL_TXN_ENTRY_MODE_LABELS: Record<number, string> = {
  1: 'Keyed',
  2: 'Swiped (T1)',
  3: 'Swiped (T2)',
  4: 'Swiped (T1+T2)',
  5: 'EMV Dipped',
  6: 'Contactless',
  7: 'Track after EMV',
  8: 'Keyed after EMV',
  9: 'ApplePay',
  10: 'Google Pay',
  11: 'Merchant Created',
  12: 'Invoice Payment',
  13: 'Portal Merchant',
  14: 'Portal Invoice',
};

export const TERMINAL_TXN_RECEIPT_LABELS: Record<TerminalTxnReceipt, string> = {
  noReceipt: 'No Receipt',
  merchant: 'Merchant',
  customer: 'Customer',
  both: 'Both',
};

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function dollarsToCents(dollars: string | number): number {
  return Math.round(Number(dollars) * 100);
}
