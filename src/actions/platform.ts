'use server';

import { PlatformClient } from '@/lib/platform/client';
import type {
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  CreateCustomerRequest,
  PlatformSearchFilter,
  PlatformPagination,
} from '@/lib/platform/types';
import type { PayrixConfig } from '@/lib/payrix/types';
import type { ServerActionResult } from '@/lib/payrix/types';
import { addToServerHistory } from '@/lib/storage';

interface PlatformActionContext {
  config: PayrixConfig;
  requestId: string;
  templateName?: string;
}

async function runPlatformAction<T>(
  context: PlatformActionContext,
  action: (client: PlatformClient) => Promise<{
    data: T[];
    errors: Array<{ message: string; field?: string }>;
    pagination?: { current: number; limit: number; total: number };
  }>,
  endpoint: string,
  method: string,
  requestBody?: unknown
): Promise<ServerActionResult<T>> {
  const startTime = Date.now();
  const { config, requestId, templateName } = context;

  // Validate platform API key
  if (!config.platformApiKey) {
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
    apiKey: config.platformApiKey,
    environment: config.platformEnvironment,
  });

  try {
    const result = await action(client);
    const duration = Date.now() - startTime;

    const hasErrors = result.errors.length > 0;
    const status = hasErrors ? 400 : 200;
    const statusText = hasErrors ? 'Bad Request' : 'OK';

    const historyEntry = {
      id: requestId,
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      requestHeaders: { APIKEY: '[redacted]' },
      request: requestBody ?? {},
      response: hasErrors ? { errors: result.errors } : result.data,
      status,
      statusText,
      duration,
      templateName,
      source: 'platform' as const,
    };

    addToServerHistory(historyEntry);

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
  filters?: PlatformSearchFilter[]
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.listInvoiceItems(filters),
    '/invoiceitems',
    'GET'
  );
}
