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
  Login,
  ApiKey,
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
  Token,
  UpdateTokenRequest,
  TxnSession,
  CreateTxnSessionRequest,
  Subscription,
  Plan,
  SubscriptionToken,
  CreateSubscriptionTokenRequest,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CreatePlanRequest,
  UpdatePlanRequest,
} from './types';
import type { TerminalTxn, CreateTerminalTxnRequest } from '@/lib/platform/types';
import { collectHeadersForDisplay, searchHeaderEntries } from './search';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import { URL } from 'node:url';

/**
 * Send an HTTP request using node's low-level http/https modules. Unlike
 * `fetch` (undici), this preserves repeated headers on the wire — each
 * entry in an array-valued header goes out as its own header line. Payrix
 * expects one `search:` header per filter, so this matters.
 */
function sendHttpRequest(
  url: string,
  init: {
    method: string;
    headers: Record<string, string | string[]>;
    body?: string;
    timeoutMs?: number;
  },
): Promise<{ status: number; statusText: string; text: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const transport = isHttps ? httpsRequest : httpRequest;
    const req = transport(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        method: init.method,
        path: parsed.pathname + parsed.search,
        headers: init.headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? '',
            text: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );
    req.on('error', reject);
    if (init.timeoutMs) {
      req.setTimeout(init.timeoutMs, () => {
        req.destroy(new Error(`timeout after ${init.timeoutMs}ms`));
      });
    }
    if (init.body !== undefined) req.write(init.body);
    req.end();
  });
}

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

  /**
   * Build the header record for the outgoing request. Each search filter
   * becomes its own `search` entry — node's http.request preserves array-
   * valued headers on the wire, so multiple filters go out as separate
   * `search:` lines rather than a single combined header. The same record
   * is passed to sentHeaders for history/debug display.
   */
  private buildHeaders(
    searchFilters?: PlatformSearchFilter[],
  ): { record: Record<string, string | string[]> } {
    const entries: [string, string][] = [
      ['APIKEY', this.apiKey],
      ['Content-Type', 'application/json'],
      ...searchHeaderEntries(searchFilters),
    ];
    return { record: collectHeadersForDisplay(entries) };
  }

  private buildQueryParams(pagination?: PlatformPagination): string {
    const params = new URLSearchParams();
    if (pagination) {
      // Use offset if provided, otherwise calculate from page
      const limit = pagination.limit ?? 25;
      const offset = pagination.offset ?? ((pagination.page ?? 1) - 1) * limit;
      params.set('page[offset]', String(offset));
      params.set('page[limit]', String(limit));
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
    
    const { record: headerRecord } = this.buildHeaders(searchFilters);

    try {
      // Use node's low-level http.request so array-valued headers
      // (e.g. three separate `search` entries) actually go on the wire as
      // distinct header lines. fetch / undici collapses them with ", ",
      // which Payrix doesn't parse back into multiple filters.
      const response = await sendHttpRequest(url, {
        method,
        headers: headerRecord,
        body: body ? JSON.stringify(body) : undefined,
        timeoutMs: 30000,
      });

      let rawResponse: unknown = null;
      try {
        rawResponse = response.text ? JSON.parse(response.text) : null;
      } catch {
        rawResponse = null;
      }

      const ok = response.status >= 200 && response.status < 300;

      // Handle non-ok responses
      if (!ok) {
        const errors: PlatformApiError[] = (rawResponse as { response?: { errors?: PlatformApiError[] } } | null)?.response?.errors || [
          { message: `HTTP ${response.status}: ${response.statusText}` }
        ];
        return {
          data: [],
          errors,
          rawResponse,
          sentHeaders: headerRecord,
        };
      }

      // Parse envelope
      const envelope = rawResponse as PlatformApiEnvelope<T> | null;

      if (!envelope?.response) {
        return {
          data: [],
          errors: [{ message: 'Invalid response format from Platform API' }],
          rawResponse,
          sentHeaders: headerRecord,
        };
      }

      return {
        data: envelope.response.data || [],
        pagination: envelope.response.details?.page,
        errors: envelope.response.errors || [],
        rawResponse,
        sentHeaders: headerRecord,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message?.includes('timeout')) {
          return {
            data: [],
            errors: [{ message: 'Request timed out after 30 seconds' }],
            rawResponse: null,
            sentHeaders: headerRecord,
          };
        }
        return {
          data: [],
          errors: [{ message: `Network error: ${error.message}` }],
          rawResponse: null,
          sentHeaders: headerRecord,
        };
      }
      return {
        data: [],
        errors: [{ message: 'Unknown error occurred' }],
        rawResponse: null,
        sentHeaders: headerRecord,
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

  // ============ API Key Methods ============

  /**
   * Get API keys associated with the current API key.
   * The first API key's login field is the login ID associated with this API key.
   */
  async getApiKeys(): Promise<PlatformRequestResult<ApiKey>> {
    return this.request<ApiKey>('/apikeys');
  }

  // ============ Login Methods ============

  /**
   * Get a specific login by ID
   */
  async getLogin(id: string): Promise<PlatformRequestResult<Login>> {
    return this.request<Login>(`/logins/${id}`);
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
    return this.request<Transaction>('/txns?expand[payment][]=&expand[token][]=', { searchFilters: filters, pagination });
  }

  // Get single transaction
  async getTransaction(id: string): Promise<PlatformRequestResult<Transaction>> {
    return this.request<Transaction>(`/txns/${id}`);
  }

  // Create transaction
  async createTransaction(body: CreateTransactionRequest): Promise<PlatformRequestResult<Transaction>> {
    return this.request<Transaction>('/txns', { method: 'POST', body });
  }

  // Update transaction
  async updateTransaction(id: string, body: Record<string, unknown>): Promise<PlatformRequestResult<Transaction>> {
    return this.request<Transaction>(`/txns/${id}`, { method: 'PUT', body });
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

  // ============ Token Methods ============

  // List tokens (expand[payment][] exposes payment.number = last4)
  async listTokens(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<Token>> {
    return this.request<Token>('/tokens?expand[payment][]', { searchFilters: filters, pagination });
  }

  // Get single token
  async getToken(id: string): Promise<PlatformRequestResult<Token>> {
    return this.request<Token>(`/tokens/${id}?expand[payment][]`);
  }

  // Update token (freeze/unfreeze, deactivate)
  async updateToken(id: string, body: UpdateTokenRequest): Promise<PlatformRequestResult<Token>> {
    return this.request<Token>(`/tokens/${id}`, { method: 'PUT', body });
  }

  // Delete token
  async deleteToken(id: string): Promise<PlatformRequestResult<Token>> {
    return this.request<Token>(`/tokens/${id}`, { method: 'DELETE' });
  }

  // ============ TxnSession Methods ============

  // Create txnSession (for PayFields SDK)
  async createTxnSession(body: CreateTxnSessionRequest): Promise<PlatformRequestResult<TxnSession>> {
    return this.request<TxnSession>('/txnSessions', { method: 'POST', body });
  }

  // ============ Subscription Methods ============

  // List subscriptions
  async listSubscriptions(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<Subscription>> {
    return this.request<Subscription>('/subscriptions', { searchFilters: filters, pagination });
  }

  // Get single subscription (embed subscriptionTokens for bound token data)
  async getSubscription(id: string): Promise<PlatformRequestResult<Subscription>> {
    return this.request<Subscription>(`/subscriptions/${id}?embed=subscriptionTokens`);
  }

  // Create subscription
  async createSubscription(body: CreateSubscriptionRequest): Promise<PlatformRequestResult<Subscription>> {
    return this.request<Subscription>('/subscriptions', { method: 'POST', body });
  }

  // Update subscription
  async updateSubscription(id: string, body: UpdateSubscriptionRequest): Promise<PlatformRequestResult<Subscription>> {
    return this.request<Subscription>(`/subscriptions/${id}`, { method: 'PUT', body });
  }

  // Delete subscription
  async deleteSubscription(id: string): Promise<PlatformRequestResult<Subscription>> {
    return this.request<Subscription>(`/subscriptions/${id}`, { method: 'DELETE' });
  }

  // ============ Plan Methods ============

  // Get single plan
  async getPlan(id: string): Promise<PlatformRequestResult<Plan>> {
    return this.request<Plan>(`/plans/${id}`);
  }

  // Create plan
  async createPlan(body: CreatePlanRequest): Promise<PlatformRequestResult<Plan>> {
    return this.request<Plan>('/plans', { method: 'POST', body });
  }

  // Update plan
  async updatePlan(id: string, body: UpdatePlanRequest): Promise<PlatformRequestResult<Plan>> {
    return this.request<Plan>(`/plans/${id}`, { method: 'PUT', body });
  }

  // Delete plan
  async deletePlan(id: string): Promise<PlatformRequestResult<Plan>> {
    return this.request<Plan>(`/plans/${id}`, { method: 'DELETE' });
  }

  // ============ Subscription Token Methods ============

  // List subscription tokens
  async listSubscriptionTokens(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<SubscriptionToken>> {
    return this.request<SubscriptionToken>('/subscriptionTokens', { searchFilters: filters, pagination });
  }

  // Create subscription token (bind token to subscription)
  async createSubscriptionToken(body: CreateSubscriptionTokenRequest): Promise<PlatformRequestResult<SubscriptionToken>> {
    return this.request<SubscriptionToken>('/subscriptionTokens', { method: 'POST', body });
  }

  // Delete subscription token (unbind token from subscription)
  async deleteSubscriptionToken(id: string): Promise<PlatformRequestResult<SubscriptionToken>> {
    return this.request<SubscriptionToken>(`/subscriptionTokens/${id}`, { method: 'DELETE' });
  }

  // ============ Plan Methods ============
  async listPlans(
    filters?: PlatformSearchFilter[],
    pagination?: PlatformPagination
  ): Promise<PlatformRequestResult<Plan>> {
    return this.request<Plan>('/plans', { searchFilters: filters, pagination });
  }
}

// Factory function for creating client from config
export function createPlatformClient(apiKey: string, environment: 'test' | 'prod'): PlatformClient {
  return new PlatformClient({ apiKey, environment });
}
