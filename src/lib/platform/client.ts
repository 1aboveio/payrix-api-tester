import type {
  PlatformApiEnvelope,
  PlatformApiError,
  PlatformSearchFilter,
  PlatformPagination,
  PlatformRequestResult,
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceItem,
  InvoiceLineItem,
  CreateInvoiceLineItemRequest,
  Merchant,
  Customer,
  CreateCustomerRequest,
} from './types';

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
    const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const headers = this.buildHeaders(searchFilters);
    
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
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
  }

  // Invoice methods
  async listInvoices(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<Invoice>> {
    return this.request<Invoice>('/invoices', { searchFilters: filters, pagination });
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
  ): Promise<PlatformRequestResult<InvoiceItem>> {
    return this.request<InvoiceItem>('/invoiceitems', { searchFilters: filters, pagination });
  }

  async createInvoiceItem(body: CreateInvoiceLineItemRequest & { invoice: string }): Promise<PlatformRequestResult<InvoiceLineItem>> {
    return this.request<InvoiceLineItem>('/invoiceitems', { method: 'POST', body });
  }

  // Merchant methods
  async listMerchants(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<Merchant>> {
    return this.request<Merchant>('/merchants', { searchFilters: filters, pagination });
  }

  async getMerchant(id: string): Promise<PlatformRequestResult<Merchant>> {
    return this.request<Merchant>(`/merchants/${id}`);
  }

  // Customer methods
  async listCustomers(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<Customer>> {
    return this.request<Customer>('/customers', { searchFilters: filters, pagination });
  }

  async createCustomer(body: CreateCustomerRequest): Promise<PlatformRequestResult<Customer>> {
    return this.request<Customer>('/customers', { method: 'POST', body });
  }
}

// Factory function for creating client from config
export function createPlatformClient(apiKey: string, environment: 'test' | 'prod'): PlatformClient {
  return new PlatformClient({ apiKey, environment });
}
