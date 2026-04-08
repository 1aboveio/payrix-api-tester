/**
 * Payrix Platform API Types
 * 
 * Platform APIs use different auth, response format, and search/pagination
 * compared to TriPOS cloud APIs.
 */

// API Response envelope (Platform uses wrapped response format)
export interface PlatformApiEnvelope<T> {
  response: {
    data: T[];
    details: {
      page?: {
        current: number;
        limit: number;
        total: number;
      };
      requestId?: string;
    };
    errors: PlatformApiError[];
  };
}

export interface PlatformApiError {
  field?: string;
  message: string;
  code?: string;
}

// Platform search filter format: field[operator]=value
export interface PlatformSearchFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
  value: string | number | boolean | string[];
}

export interface PlatformPagination {
  page?: number;
  limit?: number;
  offset?: number; // Some APIs may use offset-based pagination
}

// Platform request result (normalized for UI consumption)
export interface PlatformRequestResult<T> {
  data: T[];
  pagination?: {
    current: number;
    limit: number;
    total: number;
  };
  errors: PlatformApiError[];
  rawResponse: unknown;
  sentHeaders: Record<string, string>;
}

// Invoice Status values
export type InvoiceStatus = 
  | 'pending' 
  | 'cancelled' 
  | 'expired' 
  | 'viewed' 
  | 'paid' 
  | 'confirmed' 
  | 'refunded' 
  | 'rejected';

// Invoice Type values
export type InvoiceType = 'single' | 'multiUse' | 'recurring';

// Invoice (response shape from API)
// merchant/customer can be string ID or embedded object with ?embed=merchant query
export interface Invoice {
  id: string;
  login: string;
  merchant: string | Merchant;
  customer?: string | { id: string; firstName?: string; lastName?: string; email?: string };
  subscription?: string;
  number: string;
  title?: string;
  message?: string;
  emails?: string[];
  total?: number;
  tax?: number;
  discount?: number;
  type?: InvoiceType;
  status: InvoiceStatus;
  dueDate?: string;
  expirationDate?: string;
  sendOn?: string;
  emailStatus?: string;
  allowedPaymentMethods?: string[];
  inactive: number;
  frozen: number;
  created: string;
  modified: string;
}

// Create/Update Invoice Request (writable fields only)
export interface CreateInvoiceRequest {
  login: string;
  merchant: string;
  number: string;
  status: InvoiceStatus;
  customer?: string;
  subscription?: string;
  type?: InvoiceType;
  title?: string;
  message?: string;
  emails?: string[];
  tax?: number;
  discount?: number;
  dueDate?: string;
  expirationDate?: string;
  sendOn?: string;
  allowedPaymentMethods?: string[];
  invoiceLineItems?: CreateInvoiceLineItemRequest[];
}

export interface UpdateInvoiceRequest extends Partial<CreateInvoiceRequest> {}

// Invoice Line Item (nested in invoice)
export interface InvoiceLineItem {
  id: string;
  invoice: string;
  login: string;
  merchant: string;
  item: string;
  description?: string;
  quantity: number;
  price: number;
  taxable: number;
  inactive: number;
  created: string;
  modified: string;
}

// Create Invoice Line Item Request (for linking to existing invoice)
export interface CreateInvoiceLineItemRequest {
  invoice: string;
  invoiceItem: string;
  quantity: number;
  price?: number;
}

// Create Catalog Item Request (step 1 of 3-step invoice flow)
export interface CreateCatalogItemRequest {
  login: string;
  item: string;
  description?: string;
  price: number;
  um?: string; // unit of measure, e.g., "each"
}

// ============ Transaction Types ============

// Transaction Type values (numeric per Payrix spec)
export type TransactionType = 
  | 1  // Sale
  | 2  // Auth
  | 3  // Capture
  | 4  // Reverse/ReverseAuth
  | 5  // Refund
  | 7  // eCheck Sale
  | 8  // eCheck Refund
  | 14 // Incremental Auth

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  1: 'Sale',
  2: 'Authorization',
  3: 'Capture',
  4: 'Reverse',
  5: 'Refund',
  7: 'eCheck Sale',
  8: 'eCheck Refund',
  14: 'Incremental Auth',
};

// Transaction Origin values
export type TransactionOrigin = 
  | 1  // Terminal
  | 2  // eCommerce
  | 3  // Mail/Phone Order
  | 4  // Apple Pay
  | 8  // PayFrame
  | 12 // Invoice

export const TRANSACTION_ORIGIN_LABELS: Record<TransactionOrigin, string> = {
  1: 'Terminal',
  2: 'eCommerce',
  3: 'Mail/Phone Order',
  4: 'Apple Pay',
  8: 'PayFrame',
  12: 'Invoice',
};

// Transaction Status values (numeric per Payrix spec)
export type TransactionStatus = 
  | 0  // Pending
  | 1  // Approved
  | 2  // Failed
  | 3  // Captured
  | 4  // Settled
  | 5  // Returned

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  0: 'Pending',
  1: 'Approved',
  2: 'Failed',
  3: 'Captured',
  4: 'Settled',
  5: 'Returned',
};

// Transaction (response shape from API)
export interface Transaction {
  id: string;
  login: string;
  merchant: string | Merchant;
  mid?: string;
  customer?: string | { id: string; firstName?: string; lastName?: string; email?: string };
  token?: string;
  subscription?: string;
  amount: number;
  total?: number;
  tip?: number;
  tax?: number;
  currency?: string;
  fundingCurrency?: string;
  status: TransactionStatus;
  type?: TransactionType;
  origin?: TransactionOrigin;
  swiped?: number;
  allowPartial?: number;
  pin?: number;
  signature?: number;
  unattended?: number;
  debtRepayment?: number;
  authentication?: string;
  unauthReason?: string;
  fortxn?: string;
  description?: string;
  avsResponse?: string;
  cvvResponse?: string;
  cardType?: string;
  last4?: string;
  tokenLast4?: string;
  reasonCode?: string;
  reason?: string;
  settled?: string;
  settleDate?: string;
  refunded?: number;
  approved?: number;
  captured?: string;
  authCode?: string;
  payment?: string;
  inactive: number;
  frozen: number;
  created: string;
  modified: string;
}

// Create Transaction Request (Payrix required fields)
export interface CreateTransactionRequest {
  // Required
  merchant: string;
  mid?: string;
  type: TransactionType;
  total: number;
  
  // Optional but commonly needed
  login?: string;
  currency?: string;
  fundingCurrency?: string;
  origin?: TransactionOrigin;
  swiped?: number;
  allowPartial?: number;
  pin?: number;
  signature?: number;
  unattended?: number;
  debtRepayment?: number;
  authentication?: string;
  unauthReason?: string;
  fortxn?: string;
  
  // Additional fields
  token?: string;
  customer?: string;
  subscription?: string;
  tip?: number;
  tax?: number;
  description?: string;
  order?: string;
}

// Update is not directly supported by Payrix - use type=4 (Reverse) or type=5 (Refund) instead
export interface UpdateTransactionRequest extends Partial<CreateTransactionRequest> {}

// Invoice Item (catalog item)
export interface InvoiceItem {
  id: string;
  login: string;
  merchant: string;
  name: string;
  description?: string;
  price: number;
  taxable: number;
  inactive: number;
  created: string;
  modified: string;
}

// Merchant
export interface Merchant {
  id: string;
  entity?: string | PlatformEntity;
  dba?: string;
  name?: string;
  status: number;
  type?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  created: string;
  modified: string;
}

// Merchant status labels (Payrix uses integers 0-6)
export const MERCHANT_STATUS_LABELS: Record<number, string> = {
  0: 'Not Ready',
  1: 'Ready',
  2: 'Boarded',
  3: 'Manual',
  4: 'Closed',
  5: 'Incomplete',
  6: 'Pending',
};

// Entity (used to enrich merchant contact/location details)
export interface PlatformEntity {
  id: string;
  email?: string | null;
  phone?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  [key: string]: unknown;
}

// Customer
export interface Customer {
  id: string;
  login: string;
  merchant: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  inactive: number;
  created: string;
  modified: string;
}

// Customer Create Request
export interface CreateCustomerRequest {
  login: string;
  merchant: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

// Platform module type for navigation
export type PlatformModule = 'tripos' | 'platform';

// ============ Alert Types ============

// Alert — umbrella config (who it's for, active/inactive)
export interface Alert {
  id: string;
  created: string;
  modified: string;
  login: string;
  forlogin: string;
  name: string;
  description: string;
  inactive: number;
  frozen: number;
  division: string | null;
}

// Alert Trigger — defines WHEN it fires (event type + resource)
export interface AlertTrigger {
  id: string;
  created: string;
  modified: string;
  alert: string;
  event: string;
  resource: number | null;
  name: string;
  description: string;
  inactive: number;
  frozen: number;
}

// Alert Action — defines WHAT happens (type: 'email' or 'webhook', value = URL or email)
export interface AlertAction {
  id: string;
  created: string;
  modified: string;
  alert: string;
  type: string;   // 'email' | 'webhook'
  value: string;  // email address or webhook URL
  options: string | null;
  retries: number | null;
  headerName: string | null;
  headerValue: string | null;
}

// ============ Webhook History Types ============

// Stored webhook event received by the receiver endpoint
export interface WebhookEvent {
  id: string;           // auto-generated UUID
  receivedAt: string;   // ISO timestamp
  eventType: string;    // e.g., 'txn.created'
  source: string;       // source identifier
  payload: unknown;      // raw JSON payload from Payrix
  headers?: unknown;     // raw headers from the request
  entityId?: string;     // extracted entity ID if available
}

// Create Alert request
export interface CreateAlertRequest {
  login: string;
  forlogin?: string;
  name: string;
  description?: string;
  inactive?: number;
}

// Create Alert Trigger request
export interface CreateAlertTriggerRequest {
  alert: string;
  event: string;
  resource?: number;
  name?: string;
  description?: string;
}

// Create Alert Action request
export interface CreateAlertActionRequest {
  alert: string;
  type: 'email' | 'web';
  value: string;
  options?: string; // 'JSON' for webhooks
  headerName?: string;
  headerValue?: string;
  retries?: number;
}

// ============ Known Event Types (Sampled from Payrix API) ============

// Known/sampled Payrix event types from test environment - not exhaustive
export const PLATFORM_EVENT_TYPES = [
  // Transactions
  'txn.created', 'txn.approved', 'txn.failed', 'txn.captured', 'txn.closed', 'txn.settled', 'txn.returned',
  'txn.echeck.funded', 'txn.delayed.funding', 'txn.reserved.byDSModel',
  'terminalTxn.created', 'terminalTxn.approved', 'terminalTxn.failed',
  // Invoices
  'invoice.created', 'invoice.cancelled', 'invoice.emailed', 'invoice.expired',
  'invoice.paid', 'invoice.refunded', 'invoice.viewed', 'invoiceResult.failure',
  // Chargebacks
  'chargeback', 'chargeback.opened', 'chargeback.closed', 'chargeback.created', 'chargeback.lost', 'chargeback.won',
  'chargebackdocument.uploaded',
  // Disbursements
  'disbursement.requested', 'disbursement.processing', 'disbursement.processed',
  'disbursement.failed', 'disbursement.denied', 'disbursement.report', 'disbursement.returned',
  'disbursementEntries.processed', 'debit.disbursement.recovery', 'upcoming.debit.disbursement',
  // Merchants
  'merchant.created', 'merchant.boarding', 'merchant.boarded', 'merchant.closed', 'merchant.conditionally.approved',
  'merchant.fully.boarded', 'merchant.pending', 'merchant.incomplete', 'merchant.failed', 'merchant.held', 'merchant.reserved',
  // Subscriptions
  'subscription.created', 'subscription.approved', 'subscription.failed',
  // Others
  'account.created', 'account.updated', 'apikey.expired', 'apikey.expiring',
  'changerequest.created', 'changerequest.approved', 'changerequest.declined', 'changerequest.manualReview',
  'hold.expired', 'hold.reviewed', 'message.created', 'payout', 'fee',
] as const;

export type PlatformEventType = typeof PLATFORM_EVENT_TYPES[number];

/**
 * Helper functions for extracting display values from embedded objects
 */

// Get merchant display name from Invoice.merchant or Transaction.merchant
export function getMerchantDisplay(merchant: Invoice['merchant'] | Transaction['merchant']): string {
  if (typeof merchant === 'string') return merchant;
  // Prefer dba, then entity.name, then id
  return merchant.dba ?? (merchant.entity as any)?.name ?? merchant.id;
}

// Get customer display name from Invoice.customer or Transaction.customer
export function getCustomerDisplay(customer: Invoice['customer'] | Transaction['customer']): string {
  if (!customer) return '-';
  if (typeof customer === 'string') return customer;
  // Prefer firstName + lastName, then email, then id
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ');
  return name || customer.email || customer.id;
}


// ============ Terminal Transactions (Payrix Pro) ============

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
  total: number;
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
  created?: string;
  modified?: string;
  terminalTxnResults?: unknown[];
  terminalTxnDatas?: unknown[];
  terminalTxnMetadatas?: unknown[];
}

export interface CreateTerminalTxnRequest {
  type: TerminalTxnType;
  total: number;
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
  tip?: number; cashback?: number; expiration?: string; authCode?: string;
  authDate?: string; traceNumber?: number; token?: string; paymentNumber?: number;
  receipt?: TerminalTxnReceipt; tid?: string; txn?: string; forterminalTxn?: string;
  description?: string; order?: string; company?: string; email?: string;
  phone?: string; address1?: string; address2?: string; city?: string;
  state?: string; zip?: string; country?: string; entryMode?: TerminalTxnEntryMode;
  first?: string; last?: string; middle?: string;
  posApplicationId?: string; posApplicationName?: string; posApplicationVersion?: string;
  unattended?: TerminalTxnUnattended; customerReferenceNumber?: string;
  gatewayTransactionId?: string; customerTicketNumber?: string;
  clientIp?: string; cardNetworkTransactionId?: string; omnitoken?: string;
  convenienceFee?: number; surcharge?: number; paymentMethod?: string;
  payment?: Record<string, unknown>; platform?: string;
}

export const TERMINAL_TXN_TYPE_LABELS: Record<TerminalTxnType, string> = {
  1: 'Sale', 2: 'Auth', 4: 'Reverse Auth', 5: 'Refund', 13: 'Batch Out',
};
export const TERMINAL_TXN_ORIGIN_LABELS: Record<TerminalTxnOrigin, string> = {
  1: 'Credit Card Terminal', 2: 'eCommerce', 3: 'MOTO', 4: 'Apple Pay',
  5: '3D Secure', 6: '3D Secure Attempted', 7: 'Recurring', 8: 'Payframe', 9: 'Writing',
};
export const TERMINAL_TXN_BIN_TYPE_LABELS: Record<TerminalTxnBinType, string> = {
  CREDIT: 'Credit', DEBIT: 'Debit', PREPAID: 'Prepaid',
};
export const TERMINAL_TXN_ENTRY_MODE_LABELS: Record<number, string> = {
  1: 'Keyed', 2: 'Swiped (T1)', 3: 'Swiped (T2)', 4: 'Swiped (T1+T2)',
  5: 'EMV Dipped', 6: 'Contactless', 7: 'Track after EMV', 8: 'Keyed after EMV',
  9: 'ApplePay', 10: 'Google Pay', 11: 'Merchant Created', 12: 'Invoice Payment',
  13: 'Portal Merchant', 14: 'Portal Invoice',
};
export const TERMINAL_TXN_RECEIPT_LABELS: Record<TerminalTxnReceipt, string> = {
  noReceipt: 'No Receipt', merchant: 'Merchant', customer: 'Customer', both: 'Both',
};

// ============ Token (PayFields) ============

export interface Token {
  id: string;
  first?: string;
  middle?: string;
  last?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
  type?: 'Credit' | 'Debit' | 'EBT' | 'Gift';
  routing?: string;
  number?: string;
  expiration?: string;
  token?: string;
  payment?: Record<string, unknown>;
  customer?: string | { id: string };
  merchant?: string;
  inactive?: number;
  frozen?: number;
  created?: string;
  modified?: string;
  origin?: string;
  entryMode?: string;
  omnitoken?: string;
  name?: string;
  description?: string;
  custom?: string;
  accountUpdaterEligible?: number;
}

export interface CreateTokenRequest {
  customer: string;
  merchant: string;
  type?: 'Credit' | 'Debit' | 'EBT' | 'Gift';
  number?: string;
  expiration?: string;
  routing?: string;
  first?: string;
  middle?: string;
  last?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface UpdateTokenRequest {
  customer?: string;
  merchant?: string;
  type?: 'Credit' | 'Debit' | 'EBT' | 'Gift';
  number?: string;
  expiration?: string;
  routing?: string;
  first?: string;
  middle?: string;
  last?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
  inactive?: number;
  frozen?: number;
}

export type TokenStatus = 'active' | 'inactive' | 'frozen';
export type TokenPaymentMethod = 'Credit' | 'Debit' | 'EBT' | 'Gift';

export const TOKEN_STATUS_LABELS: Record<TokenStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  frozen: 'Frozen',
};

export const TOKEN_PAYMENT_METHOD_LABELS: Record<TokenPaymentMethod, string> = {
  Credit: 'Credit Card',
  Debit: 'Debit Card',
  EBT: 'EBT',
  Gift: 'Gift Card',
};

// Get customer ID from Token.customer (string ID or embedded object)
export function getTokenCustomerId(customer: string | { id: string } | undefined): string {
  if (!customer) return '-';
  if (typeof customer === 'string') return customer;
  return customer.id || '-';
}

// ============ TxnSession Types ============

// TxnSession (response from API)
export interface TxnSession {
  id: string;
  key: string;
  login: string;
  merchant: string;
  configurations: {
    duration: number;
    maxTimesApproved: number;
    maxTimesUse: number;
  };
  durationAvailable: number;
  timesApproved: number;
  timesUsed: number;
  created: string;
  modified: string;
  inactive: number;
  frozen: number;
}

// Create TxnSession request (for PayFields SDK)
export interface CreateTxnSessionRequest {
  login: string;
  merchant: string;
  configurations: {
    duration: number;
    maxTimesApproved: number;
    maxTimesUse: number;
  };
}

// Update Token request
export interface UpdateTokenRequest {
  id?: string; // Optional - may be provided in path instead
  customer?: string;
  first?: string;
  last?: string;
  phone?: string;
  email?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  inactive?: number;
  frozen?: number;
}

// Create Subscription Token request
export interface CreateSubscriptionTokenRequest {
  subscription: string;
  token: string;
  payment?: {
    number?: string;
    token?: string;
  };
}

// ============ Subscription Types ============

export interface Subscription {
  id: string;
  login: string;
  merchant: string;
  customer: string | Customer;
  plan: string | Plan;
  amount?: number;
  currency?: string;
  cycles?: number;
  cyclesPaid?: number;
  cyclesTotal?: number;
  start?: number; // YYYYMMDD
  finish?: number; // YYYYMMDD
  nextBillDate?: string;
  lastBillDate?: string;
  failures?: number;
  created: string;
  modified: string;
  inactive: number;
  frozen: number;
}

/** Get the amount for a subscription — from the subscription itself or its embedded plan */
export function getSubscriptionAmount(sub: Subscription): number | undefined {
  if (sub.amount != null) return sub.amount;
  if (typeof sub.plan === 'object' && sub.plan?.amount != null) return sub.plan.amount;
  return undefined;
}

/** Get display name for the plan on a subscription */
export function getSubscriptionPlanName(sub: Subscription): string {
  if (typeof sub.plan === 'object' && sub.plan?.name) return sub.plan.name;
  if (typeof sub.plan === 'object' && sub.plan?.id) return sub.plan.id;
  return typeof sub.plan === 'string' ? sub.plan : '-';
}

/** Get the plan ID from a subscription */
export function getSubscriptionPlanId(sub: Subscription): string {
  if (typeof sub.plan === 'object') return sub.plan?.id || '';
  return sub.plan || '';
}

/** Get display name for the customer on a subscription */
export function getSubscriptionCustomerName(sub: Subscription): string {
  if (typeof sub.customer === 'object') {
    const c = sub.customer;
    if (c.firstName || c.lastName) return [c.firstName, c.lastName].filter(Boolean).join(' ');
    if (c.email) return c.email;
    return c.id;
  }
  return sub.customer || '-';
}

/** Get the customer ID from a subscription */
export function getSubscriptionCustomerId(sub: Subscription): string {
  if (typeof sub.customer === 'object') return sub.customer?.id || '';
  return sub.customer || '';
}

export interface CreateSubscriptionRequest {
  plan: string;
  start: number; // YYYYMMDD
  finish?: number; // YYYYMMDD
  origin?: number; // 2=eCommerce, 3=mail/phone
  tax?: number; // cents
  descriptor?: string;
  txnDescription?: string;
}

export interface UpdateSubscriptionRequest extends Partial<CreateSubscriptionRequest> {
  inactive?: number;
  frozen?: number;
}

// ============ Plan Types ============

export interface Plan {
  id: string;
  login: string;
  merchant: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  schedule?: number; // 1=daily, 2=weekly, 3=monthly, 4=yearly
  scheduleFactor?: number;
  cycle?: string; // may be returned on GET as string alias
  cycles?: number;
  trialDays?: number;
  start?: number; // YYYYMMDD
  finish?: number; // YYYYMMDD
  type?: string;
  maxFailures?: number;
  created: string;
  modified: string;
  inactive: number;
  frozen: number;
}

const SCHEDULE_LABELS: Record<number, string> = { 1: 'Daily', 2: 'Weekly', 3: 'Monthly', 4: 'Yearly' };

/** Get the billing cycle label for a plan */
export function getPlanCycleLabel(plan: Plan): string {
  if (plan.schedule) return SCHEDULE_LABELS[plan.schedule] || String(plan.schedule);
  if (plan.cycle) return plan.cycle.charAt(0).toUpperCase() + plan.cycle.slice(1);
  return '-';
}

export interface CreatePlanRequest {
  merchant: string;
  name?: string;
  description?: string;
  amount: number; // cents
  schedule: number; // 1=daily, 2=weekly, 3=monthly, 4=yearly
  scheduleFactor?: number;
  type?: string; // "installment" | "recurring"
  um?: string; // "actual" | "percent"
  maxFailures?: number;
}

export type UpdatePlanRequest = Partial<CreatePlanRequest>;

// ============ Login Types ============

export interface Login {
  id: string;
  login: string;
  merchant?: string | Merchant;
  entity?: string | PlatformEntity;
  type?: string;
  status?: number;
  created: string;
  modified: string;
}

// ============ ApiKey Types ============

export interface ApiKey {
  id: string;
  key: string;
  name?: string;
  login: string;
  merchant?: string;
  status: number;
  created: string;
  modified: string;
}

// ============ SubscriptionToken Types ============

export interface SubscriptionToken {
  id: string;
  subscription: string;
  token: string;
  payment?: {
    number?: string;
    token?: string;
  };
  created: string;
  modified: string;
  inactive: number;
  frozen: number;
}
