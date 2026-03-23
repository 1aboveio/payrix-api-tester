'use server';

import { PlatformClient } from '@/lib/platform/client';
import type { PlatformRequestResult, PlatformSearchFilter, PlatformPagination } from '@/lib/platform/types';
import type { PayrixConfig } from '@/lib/payrix/types';
import type { ServerActionResult } from '@/lib/payrix/types';
import type { TerminalTxn, CreateTerminalTxnRequest } from '@/lib/platform/types';
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

  if (!config.platformApiKey) {
    const historyEntry = {
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
    };
    addToServerHistory(historyEntry);
    return {
      apiResponse: {
        data: undefined,
        error: 'Platform API key not configured. Please add it in Settings.',
        status: 401,
        statusText: 'Unauthorized',
      },
      historyEntry,
    };
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
    const redactedHeaders = Object.fromEntries(
      Object.entries(result.sentHeaders || {}).map(([key, value]) => [
        key,
        key.toUpperCase() === 'APIKEY' ? '[redacted]' : value,
      ])
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
        error: hasErrors ? result.errors.map((e) => e.message).join(', ') : undefined,
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

export async function createTerminalTxnAction(
  context: PlatformActionContext,
  body: CreateTerminalTxnRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createTerminalTxn(body),
    '/terminalTxns',
    'POST'
  );
}
