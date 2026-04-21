'use server';

import { activePlatform } from '@/lib/config';
import { PlatformClient } from '@/lib/platform/client';
import type {
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  CreateCustomerRequest,
  PlatformSearchFilter,
  PlatformPagination,
  CreateInvoiceLineItemRequest,
  CreateCatalogItemRequest,
  PlatformRequestResult,
  CreateAlertRequest,
  CreateAlertTriggerRequest,
  CreateAlertActionRequest,
  Transaction,
  CreateTransactionRequest,
  UpdateTokenRequest,
  CreateTxnSessionRequest,
  CreateSubscriptionTokenRequest,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CreatePlanRequest,
  UpdatePlanRequest,
} from '@/lib/platform/types';
import type { PayrixConfig } from '@/lib/payrix/types';
import type { ServerActionResult } from '@/lib/payrix/types';
import { addToServerHistory } from '@/lib/storage';
import { saveTransactionResponse } from '@/lib/payrix/dal/transaction-responses';

interface PlatformActionContext {
  config: PayrixConfig;
  requestId: string;
  templateName?: string;
}

async function runPlatformAction<T>(
  context: PlatformActionContext,
  action: (client: PlatformClient) => Promise<PlatformRequestResult<T>>,
  endpoint: string,
  method: string,
  requestBody?: unknown
): Promise<ServerActionResult<T>> {
  const startTime = Date.now();
  const { config, requestId, templateName } = context;

  // Validate platform API key
  const platformCreds = activePlatform(config);
  if (!platformCreds.platformApiKey) {
    const errorEntry = {
      apiResponse: {
        data: undefined,
        error: 'Platform API key not configured. Please add it in Settings.',
        status: 401,
        statusText: 'Unauthorized',
      },
      historyEntry: {
        id: requestId,
        timestamp: new Date().toISOString(),
        endpoint,
        method,
        requestHeaders: {},
        request: requestBody ?? {},
        response: { error: 'Platform API key not configured' },
        status: 401,
        statusText: 'Unauthorized',
        duration: Date.now() - startTime,
        templateName,
        source: 'platform' as const,
      },
    };
    addToServerHistory(errorEntry.historyEntry);
    return errorEntry;
  }

  const client = new PlatformClient({
    apiKey: platformCreds.platformApiKey,
    environment: config.platformEnvironment,
  });

  try {
    const result = await action(client);
    const duration = Date.now() - startTime;

    const hasErrors = result.errors.length > 0;
    const status = hasErrors ? 400 : 200;
    const statusText = hasErrors ? 'Bad Request' : 'OK';
    // HistoryEntry.requestHeaders is Record<string, string>, but `search`
    // can repeat (string[]). Flatten repeated values with a newline so the
    // debug panel shows each header on its own line and the single-string
    // type stays intact.
    const redactedHeaders: Record<string, string> = Object.fromEntries(
      Object.entries(result.sentHeaders || {}).map(([key, value]) => {
        if (key.toUpperCase() === 'APIKEY') return [key, '[redacted]'];
        return [key, Array.isArray(value) ? value.join('\n') : value];
      })
    );

    const historyEntry = {
      id: requestId,
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      requestHeaders: redactedHeaders,
      request: requestBody ?? {},
      response: result.rawResponse ?? {
        response: {
          data: result.data,
          details: result.pagination ? { page: result.pagination } : {},
          errors: result.errors,
        },
      },
      status,
      statusText,
      duration,
      templateName,
      source: 'platform' as const,
    };

    addToServerHistory(historyEntry);

    // Save response to DB for persistence (including EMV/tags data)
    // Fire-and-forget: don't block the API response for DB write
    void saveTransactionResponse({
      endpoint,
      method,
      requestData: requestBody ?? {},
      responseData: result.rawResponse ?? { data: result.data, errors: result.errors },
      statusCode: status,
      statusText,
      duration,
      source: 'platform',
    }).catch((err) => {
      console.error('Failed to save platform response to DB:', err);
    });

    return {
      apiResponse: {
        data: hasErrors ? undefined : (result.data as T),
        error: hasErrors ? result.errors.map(e => e.message).join(', ') : undefined,
        status,
        statusText,
      },
      historyEntry,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const historyEntry = {
      id: requestId,
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      requestHeaders: { APIKEY: '[redacted]' },
      request: requestBody ?? {},
      response: { error: errorMessage },
      status: 500,
      statusText: 'Internal Server Error',
      duration,
      templateName,
      source: 'platform' as const,
    };

    addToServerHistory(historyEntry);

    return {
      apiResponse: {
        data: undefined,
        error: errorMessage,
        status: 500,
        statusText: 'Internal Server Error',
      },
      historyEntry,
    };
  }
}

// Invoice Actions
export async function listInvoicesAction(
  context: PlatformActionContext,
  filters?: PlatformSearchFilter[],
  pagination?: PlatformPagination
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listInvoices(filters, pagination),
    '/invoices',
    'GET'
  );
}

export async function getInvoiceAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.getInvoice(id),
    `/invoices/${id}`,
    'GET'
  );
}

export async function createInvoiceAction(
  context: PlatformActionContext,
  body: CreateInvoiceRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createInvoice(body),
    '/invoices',
    'POST',
    body
  );
}

export async function updateInvoiceAction(
  context: PlatformActionContext,
  id: string,
  body: UpdateInvoiceRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.updateInvoice(id, body),
    `/invoices/${id}`,
    'PUT',
    body
  );
}

export async function deleteInvoiceAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.deleteInvoice(id),
    `/invoices/${id}`,
    'DELETE'
  );
}

// Merchant Actions
export async function listMerchantsAction(
  context: PlatformActionContext,
  filters?: PlatformSearchFilter[],
  pagination?: PlatformPagination
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listMerchants(filters, pagination),
    '/merchants',
    'GET'
  );
}

export async function getMerchantAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.getMerchant(id),
    `/merchants/${id}`,
    'GET'
  );
}

export async function getEntityAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.getEntity(id),
    `/entities/${id}`,
    'GET'
  );
}

// Customer Actions
export async function listCustomersAction(
  context: PlatformActionContext,
  filters?: PlatformSearchFilter[],
  pagination?: PlatformPagination
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listCustomers(filters, pagination),
    '/customers',
    'GET'
  );
}

export async function getCustomerAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.getCustomer(id),
    `/customers/${id}`,
    'GET'
  );
}

export async function createCustomerAction(
  context: PlatformActionContext,
  body: CreateCustomerRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createCustomer(body),
    '/customers',
    'POST',
    body
  );
}

// Invoice Item Actions
export async function listInvoiceItemsAction(
  context: PlatformActionContext,
  filters?: PlatformSearchFilter[],
  pagination?: PlatformPagination
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listInvoiceItems(filters, pagination),
    '/invoiceitems',
    'GET'
  );
}

export async function createInvoiceItemAction(
  context: PlatformActionContext,
  body: CreateInvoiceLineItemRequest & { invoice: string }
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createInvoiceItem(body),
    '/invoiceitems',
    'POST',
    body
  );
}

// Link invoice to catalog item (step 3 of invoice creation)
export async function createInvoiceLineItemAction(
  context: PlatformActionContext,
  body: CreateInvoiceLineItemRequest & { invoice: string }
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createInvoiceLineItem(body),
    '/invoiceLineItems',
    'POST',
    body
  );
}

// Create catalog item (step 1 of invoice creation)
export async function createCatalogItemAction(
  context: PlatformActionContext,
  body: CreateCatalogItemRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createCatalogItem(body),
    '/invoiceItems',
    'POST',
    body
  );
}

export async function deleteInvoiceItemAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.deleteInvoiceItem(id),
    `/invoiceitems/${id}`,
    'DELETE'
  );
}

// ============ Alert Actions ============

export async function listAlertsAction(
  context: PlatformActionContext,
  filters?: PlatformSearchFilter[],
  pagination?: PlatformPagination
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listAlerts(filters, pagination),
    '/alerts',
    'GET'
  );
}

export async function getAlertAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.getAlert(id),
    `/alerts/${id}`,
    'GET'
  );
}

export async function createAlertAction(
  context: PlatformActionContext,
  body: CreateAlertRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createAlert(body),
    '/alerts',
    'POST',
    body
  );
}

export async function updateAlertAction(
  context: PlatformActionContext,
  id: string,
  body: Partial<CreateAlertRequest>
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.updateAlert(id, body),
    `/alerts/${id}`,
    'PUT',
    body
  );
}

export async function deleteAlertAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.deleteAlert(id),
    `/alerts/${id}`,
    'DELETE'
  );
}

// Alert Trigger Actions
export async function listAlertTriggersAction(
  context: PlatformActionContext,
  filters?: PlatformSearchFilter[],
  pagination?: PlatformPagination
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listAlertTriggers(filters, pagination),
    '/alerttriggers',
    'GET'
  );
}

export async function createAlertTriggerAction(
  context: PlatformActionContext,
  body: CreateAlertTriggerRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createAlertTrigger(body),
    '/alerttriggers',
    'POST',
    body
  );
}

export async function deleteAlertTriggerAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.deleteAlertTrigger(id),
    `/alerttriggers/${id}`,
    'DELETE'
  );
}

// Alert Action Actions
export async function listAlertActionsAction(
  context: PlatformActionContext,
  filters?: PlatformSearchFilter[],
  pagination?: PlatformPagination
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listAlertActions(filters, pagination),
    '/alertactions',
    'GET'
  );
}

export async function createAlertActionAction(
  context: PlatformActionContext,
  body: CreateAlertActionRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createAlertAction(body),
    '/alertactions',
    'POST',
    body
  );
}

export async function deleteAlertActionAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.deleteAlertAction(id),
    `/alertactions/${id}`,
    'DELETE'
  );
}

// ============ Transaction Actions ============

export async function listTransactionsAction(
  context: PlatformActionContext,
  filters?: PlatformSearchFilter[],
  pagination?: PlatformPagination
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listTransactions(filters, pagination),
    '/txns',
    'GET'
  );
}

export async function getTransactionAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.getTransaction(id),
    `/txns/${id}`,
    'GET'
  );
}

export async function createTransactionAction(
  context: PlatformActionContext,
  body: CreateTransactionRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createTransaction(body),
    '/txns',
    'POST'
  );
}

export async function updateTransactionAction(
  context: PlatformActionContext,
  id: string,
  body: Record<string, unknown>
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.updateTransaction(id, body),
    `/txns/${id}`,
    'PUT',
    body
  );
}

// Terminal Transaction Actions
export async function listTerminalTxnsAction(
  context: PlatformActionContext,
  filters?: PlatformSearchFilter[],
  pagination?: PlatformPagination
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listTerminalTxns(filters, pagination),
    '/terminalTxns',
    'GET'
  );
}

export async function getTerminalTxnAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.getTerminalTxn(id),
    `/terminalTxns/${id}`,
    'GET'
  );
}

// ============ Token Actions ============

export async function listTokensAction(
  context: PlatformActionContext,
  filters?: PlatformSearchFilter[],
  pagination?: PlatformPagination
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listTokens(filters, pagination),
    '/tokens',
    'GET'
  );
}

export async function getTokenAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.getToken(id),
    `/tokens/${id}`,
    'GET'
  );
}

export async function updateTokenAction(
  context: PlatformActionContext,
  id: string,
  body: UpdateTokenRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.updateToken(id, body),
    `/tokens/${id}`,
    'PUT',
    body
  );
}

export async function deleteTokenAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.deleteToken(id),
    `/tokens/${id}`,
    'DELETE'
  );
}

// ============ TxnSession Actions ============

export async function createTxnSessionAction(
  context: PlatformActionContext,
  body: CreateTxnSessionRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createTxnSession(body),
    '/txnSessions',
    'POST',
    body
  );
}

// ============ Customer Creation Action (for Token Flow) ============

export async function createCustomerFromEmailAction(
  context: PlatformActionContext,
  body: CreateCustomerRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createCustomer(body),
    '/customers',
    'POST',
    body
  );
}

// ============ Subscription Actions ============

export async function listSubscriptionsAction(
  context: PlatformActionContext,
  filters?: PlatformSearchFilter[],
  pagination?: PlatformPagination
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listSubscriptions(filters, pagination),
    '/subscriptions',
    'GET'
  );
}

export async function getSubscriptionAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.getSubscription(id),
    `/subscriptions/${id}`,
    'GET'
  );
}

export async function createSubscriptionAction(
  context: PlatformActionContext,
  body: CreateSubscriptionRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createSubscription(body),
    '/subscriptions',
    'POST',
    body
  );
}

export async function updateSubscriptionAction(
  context: PlatformActionContext,
  id: string,
  body: UpdateSubscriptionRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.updateSubscription(id, body),
    `/subscriptions/${id}`,
    'PUT',
    body
  );
}

export async function deleteSubscriptionAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.deleteSubscription(id),
    `/subscriptions/${id}`,
    'DELETE'
  );
}

// ============ Plan Actions ============

export async function listPlansAction(
  context: PlatformActionContext,
  filters?: PlatformSearchFilter[],
  pagination?: PlatformPagination
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listPlans(filters, pagination),
    '/plans',
    'GET'
  );
}

export async function getPlanAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.getPlan(id),
    `/plans/${id}`,
    'GET'
  );
}

export async function createPlanAction(
  context: PlatformActionContext,
  body: CreatePlanRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createPlan(body),
    '/plans',
    'POST',
    body
  );
}

export async function updatePlanAction(
  context: PlatformActionContext,
  id: string,
  body: UpdatePlanRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.updatePlan(id, body),
    `/plans/${id}`,
    'PUT',
    body
  );
}

export async function deletePlanAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.deletePlan(id),
    `/plans/${id}`,
    'DELETE'
  );
}

// ============ Subscription Token Actions ============

export async function listSubscriptionTokensAction(
  context: PlatformActionContext,
  filters?: PlatformSearchFilter[],
  pagination?: PlatformPagination
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listSubscriptionTokens(filters, pagination),
    '/subscriptionTokens',
    'GET'
  );
}

export async function createSubscriptionTokenAction(
  context: PlatformActionContext,
  body: CreateSubscriptionTokenRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createSubscriptionToken(body),
    '/subscriptionTokens',
    'POST',
    body
  );
}

export async function deleteSubscriptionTokenAction(
  context: PlatformActionContext,
  id: string
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.deleteSubscriptionToken(id),
    `/subscriptionTokens/${id}`,
    'DELETE'
  );
}

// ============ Resolve Credentials Action ============

/**
 * Resolve Platform Login and Merchant from API key.
 * This action is called when the user enters their API key in settings
 * and wants to auto-populate the login and merchant fields.
 */
export async function resolvePlatformCredentialsAction(
  apiKey: string,
  environment: 'test' | 'prod'
): Promise<{ success: boolean; login?: string; merchant?: string; error?: string }> {
  try {
    const client = new PlatformClient({ apiKey, environment });

    // Get API keys to find the login associated with this API key
    const apiKeyResult = await client.getApiKeys();
    if (apiKeyResult.errors.length > 0 || apiKeyResult.data.length === 0) {
      return {
        success: false,
        error: apiKeyResult.errors[0]?.message || 'Could not find API key information',
      };
    }
    const loginId = apiKeyResult.data[0].login;

    // Get merchants accessible to this login
    const merchantResult = await client.listMerchants([], { page: 1, limit: 1 });
    if (merchantResult.errors.length > 0 || merchantResult.data.length === 0) {
      return {
        success: false,
        login: loginId,
        error: merchantResult.errors[0]?.message || 'Could not find merchant for this login',
      };
    }
    const merchantId = merchantResult.data[0].id;

    return {
      success: true,
      login: loginId,
      merchant: merchantId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error resolving credentials',
    };
  }
}
