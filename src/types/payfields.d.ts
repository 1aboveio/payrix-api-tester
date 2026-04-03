// Global PayFields SDK types
// This file should be imported once in the application entry point (layout.tsx)

export interface PayFieldsConfig {
  apiKey: string;
  txnSessionKey: string;
  merchant: string;
  mode: 'txn' | 'token';
  customer: string;
  txnType?: 'sale' | 'auth' | 'refund';
  amount?: string;
  invoiceResult?: { invoice: string };
}

export interface PayFieldsField {
  type: string;
  element: string;
}

export interface PayFieldsResponse {
  data: Array<{
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
    customer?: string;
    merchant?: string;
    inactive?: number;
    frozen?: number;
    created?: string;
    modified?: string;
  }>;
  errors: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
}

export interface PayFieldsSDK {
  config: PayFieldsConfig;
  fields?: PayFieldsField[];
  addFields?: () => void;
  ready?: () => void;
  onSuccess: (response: PayFieldsResponse) => void;
  onFailure: (response: PayFieldsResponse) => void;
  submit: () => void;
}

declare global {
  interface Window {
    PayFields?: PayFieldsSDK;
  }
}

export {};
