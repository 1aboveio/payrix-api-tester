import type {
  PlatformApiEnvelope,
  PlatformApiError,
  PlatformSearchFilter,
  PlatformPagination,
  PlatformRequestResult,
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceLineItem,
  InvoiceItem,
  CreateInvoiceLineItemRequest,
  CreateCatalogItemRequest,
  Merchant,
  PlatformEntity,
  Customer,
  CreateCustomerRequest,
  Alert,
  CreateAlertRequest,
  AlertTrigger,
  CreateAlertTriggerRequest,
  AlertAction,
  CreateAlertActionRequest,
  Transaction,
  CreateTransactionRequest,
} from './types';
import type { TerminalTxn, CreateTerminalTxnRequest } from '@/lib/platform/types';

export interface PlatformClientConfig {
  apiKey: string;
  environment: 'test' | 'prod';
}

function getPlatformBaseUrl(environment: 'test' | 'prod'): string {
  return environment === 'test' 
    ? 'https://test-api.payrix.com' 
    : 'https://api.payrix.com';
}

export class PlatformClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: PlatformClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = getPlatformBaseUrl(config.environment);
  }

  private buildHeaders(searchFilters?: PlatformSearchFilter[]): Record<string, string> {
    const headers: Record<string, string> = {
      'APIKEY': this.apiKey,
      'Content-Type': 'application/json',
    };

    if (searchFilters && searchFilters.length > 0) {
      headers['search'] = this.buildSearchHeader(searchFilters);
    }

    return headers;
  }

  private buildSearchHeader(filters: PlatformSearchFilter[]): string {
    return filters
      .map(f => {
        const value = Array.isArray(f.value) ? f.value.join(',') : String(f.value);
        return `${f.field}[${f.operator}]=${encodeURIComponent(value)}`;
      })
      .join(';');
  }

  private buildQueryParams(pagination?: PlatformPagination): string {
    const params = new URLSearchParams();
    if (pagination) {
      params.set('page[number]', String(pagination.page));
      params.set('page[limit]', String(pagination.limit));
    }
    return params.toString();
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      searchFilters?: PlatformSearchFilter[];
      pagination?: PlatformPagination;
    } = {}
  ): Promise<PlatformRequestResult<T>> {
    const { method = 'GET', body, searchFilters, pagination } = options;
    
    const queryString = this.buildQueryParams(pagination);
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${endpoint}${queryString ? `${separator}${queryString}` : ''}`;
    
    const headers = this.buildHeaders(searchFilters);
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const rawResponse = await response.json().catch(() => null);
      
      // Handle non-ok responses
      if (!response.ok) {
        const errors: PlatformApiError[] = rawResponse?.response?.errors || [
          { message: `HTTP ${response.status}: ${response.statusText}` }
        ];
        return {
          data: [],
          errors,
          rawResponse,
          sentHeaders: headers,
        };
      }

      // Parse envelope
      const envelope = rawResponse as PlatformApiEnvelope<T> | null;
      
      if (!envelope?.response) {
        return {
          data: [],
          errors: [{ message: 'Invalid response format from Platform API' }],
          rawResponse,
          sentHeaders: headers,
        };
      }

      return {
        data: envelope.response.data || [],
        pagination: envelope.response.details?.page,
        errors: envelope.response.errors || [],
        rawResponse,
        sentHeaders: headers,
      };
    } catch (error) {
      // Handle timeout and other fetch errors
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message?.includes('timeout')) {
          return {
            data: [],
            errors: [{ message: 'Request timed out after 30 seconds' }],
            rawResponse: null,
            sentHeaders: headers,
          };
        }
        return {
          data: [],
          errors: [{ message: `Network error: ${error.message}` }],
          rawResponse: null,
          sentHeaders: headers,
        };
      }
      return {
        data: [],
        errors: [{ message: 'Unknown error occurred' }],
        rawResponse: null,
        sentHeaders: headers,
      };
    }
  }

  // Invoice methods
  async listInvoices(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<Invoice>> {
    return this.request<Invoice>('/invoices?embed=merchant,customer', { searchFilters: filters, pagination });
  }

  async getInvoice(id: string): Promise<PlatformRequestResult<Invoice>> {
    return this.request<Invoice>(`/invoices/${id}`);
  }

  async createInvoice(body: CreateInvoiceRequest): Promise<PlatformRequestResult<Invoice>> {
    return this.request<Invoice>('/invoices', { method: 'POST', body });
  }

  async updateInvoice(id: string, body: UpdateInvoiceRequest): Promise<PlatformRequestResult<Invoice>> {
    return this.request<Invoice>(`/invoices/${id}`, { method: 'PUT', body });
  }

  async deleteInvoice(id: string): Promise<PlatformRequestResult<Invoice>> {
    return this.request<Invoice>(`/invoices/${id}`, { method: 'DELETE' });
  }

  // Invoice Item methods
  async listInvoiceItems(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<InvoiceLineItem>> {
    return this.request<InvoiceLineItem>('/invoiceitems', { searchFilters: filters, pagination });
  }

  async createInvoiceItem(body: CreateInvoiceLineItemRequest & { invoice: string }): Promise<PlatformRequestResult<InvoiceLineItem>> {
    return this.request<InvoiceLineItem>('/invoiceitems', { method: 'POST', body });
  }

  // Link invoice to catalog item (step 3 of invoice creation)
  async createInvoiceLineItem(body: CreateInvoiceLineItemRequest & { invoice: string }): Promise<PlatformRequestResult<InvoiceLineItem>> {
    return this.request<InvoiceLineItem>('/invoiceLineItems', { method: 'POST', body });
  }

  // Create catalog item (step 1 of invoice creation)
  async createCatalogItem(body: CreateCatalogItemRequest): Promise<PlatformRequestResult<InvoiceItem>> {
    return this.request<InvoiceItem>('/invoiceItems', { method: 'POST', body });
  }

  async deleteInvoiceItem(id: string): Promise<PlatformRequestResult<InvoiceLineItem>> {
    return this.request<InvoiceLineItem>(`/invoiceitems/${id}`, { method: 'DELETE' });
  }

  // Merchant methods
  async listMerchants(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<Merchant>> {
    return this.request<Merchant>('/merchants?embed=entity', { searchFilters: filters, pagination });
  }

  async getMerchant(id: string): Promise<PlatformRequestResult<Merchant>> {
    return this.request<Merchant>(`/merchants/${id}?embed=entity`);
  }

  async getEntity(id: string): Promise<PlatformRequestResult<PlatformEntity>> {
    return this.request<PlatformEntity>(`/entities/${id}`);
  }

  // Customer methods
  async listCustomers(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<Customer>> {
    return this.request<Customer>('/customers', { searchFilters: filters, pagination });
  }

  async getCustomer(id: string): Promise<PlatformRequestResult<Customer>> {
    return this.request<Customer>(`/customers/${id}`);
  }

  async createCustomer(body: CreateCustomerRequest): Promise<PlatformRequestResult<Customer>> {
    return this.request<Customer>('/customers', { method: 'POST', body });
  }

  // ============ Alert Methods ============

  // List alerts
  async listAlerts(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<Alert>> {
    return this.request<Alert>('/alerts', { searchFilters: filters, pagination });
  }

  // Get single alert
  async getAlert(id: string): Promise<PlatformRequestResult<Alert>> {
    return this.request<Alert>(`/alerts/${id}`);
  }

  // Create alert
  async createAlert(body: CreateAlertRequest): Promise<PlatformRequestResult<Alert>> {
    return this.request<Alert>('/alerts', { method: 'POST', body });
  }

  // Update alert
  async updateAlert(id: string, body: Partial<CreateAlertRequest>): Promise<PlatformRequestResult<Alert>> {
    return this.request<Alert>(`/alerts/${id}`, { method: 'PUT', body });
  }

  // Delete alert
  async deleteAlert(id: string): Promise<PlatformRequestResult<Alert>> {
    return this.request<Alert>(`/alerts/${id}`, { method: 'DELETE' });
  }

  // ============ Alert Trigger Methods ============

  // List alert triggers
  async listAlertTriggers(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<AlertTrigger>> {
    return this.request<AlertTrigger>('/alertTriggers', { searchFilters: filters, pagination });
  }

  // Get single alert trigger
  async getAlertTrigger(id: string): Promise<PlatformRequestResult<AlertTrigger>> {
    return this.request<AlertTrigger>(`/alertTriggers/${id}`);
  }

  // Create alert trigger
  async createAlertTrigger(body: CreateAlertTriggerRequest): Promise<PlatformRequestResult<AlertTrigger>> {
    return this.request<AlertTrigger>('/alertTriggers', { method: 'POST', body });
  }

  // Delete alert trigger
  async deleteAlertTrigger(id: string): Promise<PlatformRequestResult<AlertTrigger>> {
    return this.request<AlertTrigger>(`/alertTriggers/${id}`, { method: 'DELETE' });
  }

  // ============ Alert Action Methods ============

  // List alert actions
  async listAlertActions(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<AlertAction>> {
    return this.request<AlertAction>('/alertActions', { searchFilters: filters, pagination });
  }

  // Get single alert action
  async getAlertAction(id: string): Promise<PlatformRequestResult<AlertAction>> {
    return this.request<AlertAction>(`/alertActions/${id}`);
  }

  // Create alert action
  async createAlertAction(body: CreateAlertActionRequest): Promise<PlatformRequestResult<AlertAction>> {
    return this.request<AlertAction>('/alertActions', { method: 'POST', body });
  }

  // Delete alert action
  async deleteAlertAction(id: string): Promise<PlatformRequestResult<AlertAction>> {
    return this.request<AlertAction>(`/alertActions/${id}`, { method: 'DELETE' });
  }

  // ============ Transaction Methods ============

  // List transactions
  async listTransactions(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<Transaction>> {
    return this.request<Transaction>('/txns?embed=merchant,customer', { searchFilters: filters, pagination });
  }

  // Get single transaction
  async getTransaction(id: string): Promise<PlatformRequestResult<Transaction>> {
    return this.request<Transaction>(`/txns/${id}`);
  }

  // Create transaction
  async createTransaction(body: CreateTransactionRequest): Promise<PlatformRequestResult<Transaction>> {
    return this.request<Transaction>('/txns', { method: 'POST', body });
  }

  // List terminal transactions
  async listTerminalTxns(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<TerminalTxn>> {
    return this.request<TerminalTxn>('/terminalTxns', { searchFilters: filters, pagination });
  }

  // Get single terminal transaction
  async getTerminalTxn(id: string): Promise<PlatformRequestResult<TerminalTxn>> {
    return this.request<TerminalTxn>(`/terminalTxns/${id}`);
  }

  // Create terminal transaction
  async createTerminalTxn(body: CreateTerminalTxnRequest): Promise<PlatformRequestResult<TerminalTxn>> {
    return this.request<TerminalTxn>('/terminalTxns', { method: 'POST', body });
  }

  // Update terminal transaction
  async updateTerminalTxn(id: string, body: Partial<CreateTerminalTxnRequest>): Promise<PlatformRequestResult<TerminalTxn>> {
    return this.request<TerminalTxn>(`/terminalTxns/${id}`, { method: 'PUT', body });
  }
}

// Factory function for creating client from config
export function createPlatformClient(apiKey: string, environment: 'test' | 'prod'): PlatformClient {
  return new PlatformClient({ apiKey, environment });
}
