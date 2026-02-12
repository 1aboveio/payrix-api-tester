// Payrix API Type Definitions

export type PayrixEnvironment = 'cert' | 'prod';
export type PaymentType = 'credit' | 'debit' | 'ebt';

export interface PayrixConfig {
  environment: PayrixEnvironment;
  expressAcceptorId: string;
  expressAccountId: string;
  expressAccountToken: string;
  applicationId: string;
  applicationName: string;
  applicationVersion: string;
  tpAuthorization: string;
}

export interface PayrixHeaders {
  'tp-application-id': string;
  'tp-application-name': string;
  'tp-application-version': string;
  'tp-request-id': string;
  'tp-express-acceptor-id': string;
  'tp-express-account-id': string;
  'tp-express-account-token': string;
  'tp-authorization'?: string;
  'Content-Type': 'application/json';
  [key: string]: string | undefined;
}

// Lane API
export interface CreateLaneRequest {
  laneId: string;
  terminalId: string;
  activationCode: string;
}

export interface ListLanesRequest {
  pageNumber?: number;
  pageSize?: number;
}

export interface Lane {
  laneId: string;
  terminalId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateLaneResponse {
  lane?: Lane;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface ListLanesResponse {
  lanes?: Lane[];
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface GetLaneResponse {
  lane?: Lane;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

// Transaction API
export interface SaleRequest {
  laneId: string;
  transactionAmount: string;
  referenceNumber?: string;
  ticketNumber?: string;
  [key: string]: unknown;
}

export interface SaleResponse {
  transactionId?: string;
  status?: string;
  approvalCode?: string;
  responseCode?: string;
  responseMessage?: string;
  transactionAmount?: string;
  cardType?: string;
  last4?: string;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface TransactionQueryRequest {
  transactionId?: string;
  referenceNumber?: string;
  terminalId?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
}

export interface Transaction {
  transactionId?: string;
  transactionType?: string;
  status?: string;
  transactionAmount?: string;
  approvalCode?: string;
  responseCode?: string;
  responseMessage?: string;
  cardType?: string;
  last4?: string;
  referenceNumber?: string;
  ticketNumber?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface TransactionQueryResponse {
  transactions?: Transaction[];
  reportingData?: Transaction[];
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface VoidRequest {
  [key: string]: unknown;
}

export interface VoidResponse {
  transactionId?: string;
  originalTransactionId?: string;
  status?: string;
  responseCode?: string;
  responseMessage?: string;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface ReturnRequest {
  amount?: string;
  [key: string]: unknown;
}

export interface ReturnResponse {
  transactionId?: string;
  originalTransactionId?: string;
  status?: string;
  responseCode?: string;
  responseMessage?: string;
  returnAmount?: string;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface ReversalRequest {
  [key: string]: unknown;
}

export interface ReversalResponse {
  transactionId?: string;
  originalTransactionId?: string;
  status?: string;
  responseCode?: string;
  responseMessage?: string;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface CreditRequest {
  laneId: string;
  transactionAmount: string;
  referenceNumber?: string;
  [key: string]: unknown;
}

export interface CreditResponse {
  transactionId?: string;
  status?: string;
  approvalCode?: string;
  responseCode?: string;
  responseMessage?: string;
  transactionAmount?: string;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface ReceiptRequest {
  transactionId: string;
  receiptType?: 'merchant' | 'customer';
  emailAddress?: string;
  phoneNumber?: string;
  [key: string]: unknown;
}

export interface ReceiptResponse {
  receiptData?: string;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  request: unknown;
  response: unknown;
  status: number;
  statusText: string;
  duration?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
  statusText: string;
}

export interface ServerActionResult<T> {
  apiResponse: ApiResponse<T>;
  historyEntry: HistoryEntry;
}
