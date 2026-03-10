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
  page: number;
  limit: number;
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
export interface Invoice {
  id: string;
  login: string;
  merchant: string;
  customer?: string;
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

// Create Invoice Line Item Request
export interface CreateInvoiceLineItemRequest {
  item: string;
  description?: string;
  quantity: number;
  price: number;
  taxable?: number;
}

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
  entity?: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
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
  payload: unknown;      // raw JSON payload from Payrix
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
  type: 'email' | 'webhook';
  value: string;
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
