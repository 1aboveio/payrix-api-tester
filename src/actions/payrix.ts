'use server';

import { PayrixClient } from '@/lib/payrix/client';
import type {
  ApiResponse,
  AuthorizationRequest,
  AuthorizationResponse,
  BinQueryRequest,
  BinQueryResponse,
  CompletionRequest,
  CompletionResponse,
  CreateLaneRequest,
  CreateLaneResponse,
  CreditRequest,
  CreditResponse,
  ForceRequest,
  ForceResponse,
  GetLaneResponse,
  HistoryEntry,
  ListLanesRequest,
  ListLanesResponse,
  PayrixConfig,
  PaymentType,
  ReceiptRequest,
  ReceiptResponse,
  RefundRequest,
  RefundResponse,
  ReturnRequest,
  ReturnResponse,
  ReversalRequest,
  ReversalResponse,
  SaleRequest,
  SaleResponse,
  ServerActionResult,
  TransactionQueryRequest,
  TransactionQueryResponse,
  VoidRequest,
  VoidResponse,
} from '@/lib/payrix/types';

const MAX_SERVER_HISTORY = 200;
const serverHistory: HistoryEntry[] = [];

interface BaseActionInput {
  config: PayrixConfig;
  templateName?: string;
}

interface LaneByIdInput extends BaseActionInput {
  laneId: string;
}

interface VoidInput extends BaseActionInput {
  transactionId: string;
  request?: VoidRequest;
}

interface ReturnInput extends BaseActionInput {
  transactionId: string;
  paymentType: PaymentType;
  request?: ReturnRequest;
}

interface ReversalInput extends BaseActionInput {
  transactionId: string;
  paymentType: PaymentType;
  request?: ReversalRequest;
}

interface CompletionInput extends BaseActionInput {
  transactionId: string;
  request?: CompletionRequest;
}

interface RefundInput extends BaseActionInput {
  transactionId: string;
  paymentType: PaymentType;
  request?: RefundRequest;
}

function createHistoryEntry(
  endpoint: string,
  method: string,
  request: unknown,
  response: ApiResponse<unknown>,
  duration: number
): HistoryEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    endpoint,
    method,
    request,
    response: response.data ?? response.error ?? null,
    status: response.status,
    statusText: response.statusText,
    duration,
  };
}

function validateConfig(config: PayrixConfig, requireAuthorization: boolean): string | null {
  if (!config.applicationId) return 'Missing tp-application-id (applicationId)';
  if (!config.applicationName) return 'Missing tp-application-name (applicationName)';
  if (!config.applicationVersion) return 'Missing tp-application-version (applicationVersion)';
  if (!config.expressAcceptorId) return 'Missing tp-express-acceptor-id (expressAcceptorId)';
  if (!config.expressAccountId) return 'Missing tp-express-account-id (expressAccountId)';
  if (!config.expressAccountToken) return 'Missing tp-express-account-token (expressAccountToken)';
  if (requireAuthorization && !config.tpAuthorization) return 'Missing tp-authorization';
  return null;
}

async function runAction<T>(
  input: BaseActionInput,
  endpoint: string,
  method: string,
  request: unknown,
  action: (client: PayrixClient) => Promise<ApiResponse<T>>,
  requireAuthorization: boolean = false
): Promise<ServerActionResult<T>> {
  const configError = validateConfig(input.config, requireAuthorization);
  if (configError) {
    const invalidResponse: ApiResponse<T> = {
      status: 400,
      statusText: 'Invalid Config',
      error: configError,
    };

    const historyEntry = createHistoryEntry(endpoint, method, request, invalidResponse, 0);
    if (input.templateName) historyEntry.templateName = input.templateName;
    serverHistory.unshift(historyEntry);
    serverHistory.splice(MAX_SERVER_HISTORY);

    return {
      apiResponse: invalidResponse,
      historyEntry,
    };
  }

  const client = new PayrixClient(input.config);
  const startedAt = Date.now();
  const apiResponse = await action(client);
  const duration = Date.now() - startedAt;

  const historyEntry = createHistoryEntry(endpoint, method, request, apiResponse as ApiResponse<unknown>, duration);
  if (input.templateName) historyEntry.templateName = input.templateName;
  serverHistory.unshift(historyEntry);
  serverHistory.splice(MAX_SERVER_HISTORY);

  return {
    apiResponse,
    historyEntry,
  };
}

export async function createLaneAction(
  input: BaseActionInput & { request: CreateLaneRequest }
): Promise<ServerActionResult<CreateLaneResponse>> {
  return runAction(input, '/cloudapi/v1/lanes', 'POST', input.request, (client) => client.createLane(input.request));
}

export async function listLanesAction(
  input: BaseActionInput & { request?: ListLanesRequest }
): Promise<ServerActionResult<ListLanesResponse>> {
  return runAction(input, '/cloudapi/v1/lanes', 'GET', input.request ?? {}, (client) => client.listLanes(input.request));
}

export async function getLaneAction(input: LaneByIdInput): Promise<ServerActionResult<GetLaneResponse>> {
  return runAction(input, `/cloudapi/v1/lanes/${input.laneId}`, 'GET', { laneId: input.laneId }, (client) =>
    client.getLane(input.laneId)
  );
}

export async function saleAction(
  input: BaseActionInput & { request: SaleRequest }
): Promise<ServerActionResult<SaleResponse>> {
  return runAction(input, '/api/v1/sale', 'POST', input.request, (client) => client.sale(input.request), true);
}

export async function transactionQueryAction(
  input: BaseActionInput & { request: TransactionQueryRequest }
): Promise<ServerActionResult<TransactionQueryResponse>> {
  return runAction(input, '/api/v1/transactionQuery', 'POST', input.request, (client) =>
    client.transactionQuery(input.request),
    true
  );
}

export async function voidAction(input: VoidInput): Promise<ServerActionResult<VoidResponse>> {
  return runAction(input, `/api/v1/void/${input.transactionId}`, 'POST', input.request ?? {}, (client) =>
    client.voidTransaction(input.transactionId, input.request),
    true
  );
}

export async function returnAction(input: ReturnInput): Promise<ServerActionResult<ReturnResponse>> {
  return runAction(
    input,
    `/api/v1/sale/${input.transactionId}/return/${input.paymentType}`,
    'POST',
    input.request ?? {},
    (client) => client.returnTransaction(input.transactionId, input.paymentType, input.request),
    true
  );
}

export async function reversalAction(input: ReversalInput): Promise<ServerActionResult<ReversalResponse>> {
  return runAction(
    input,
    `/api/v1/reversal/${input.transactionId}/${input.paymentType}`,
    'POST',
    input.request ?? {},
    (client) => client.reversal(input.transactionId, input.paymentType, input.request),
    true
  );
}

export async function creditAction(
  input: BaseActionInput & { request: CreditRequest }
): Promise<ServerActionResult<CreditResponse>> {
  return runAction(input, '/api/v1/credit', 'POST', input.request, (client) => client.credit(input.request), true);
}

export async function receiptAction(
  input: BaseActionInput & { request: ReceiptRequest }
): Promise<ServerActionResult<ReceiptResponse>> {
  return runAction(input, '/api/v1/receipt', 'POST', input.request, (client) => client.receipt(input.request), true);
}

export async function authorizationAction(
  input: BaseActionInput & { request: AuthorizationRequest }
): Promise<ServerActionResult<AuthorizationResponse>> {
  return runAction(input, '/api/v1/authorization', 'POST', input.request, (client) => client.authorization(input.request), true);
}

export async function completionAction(input: CompletionInput): Promise<ServerActionResult<CompletionResponse>> {
  return runAction(
    input,
    `/api/v1/sale/${input.transactionId}/completion`,
    'POST',
    { transactionId: input.transactionId, ...input.request },
    (client) => client.completion(input.transactionId, input.request),
    true
  );
}

export async function refundAction(input: RefundInput): Promise<ServerActionResult<RefundResponse>> {
  return runAction(
    input,
    `/api/v1/sale/${input.transactionId}/refund/${input.paymentType}`,
    'POST',
    input.request ?? {},
    (client) => client.refund(input.transactionId, input.paymentType, input.request),
    true
  );
}

export async function forceAction(
  input: BaseActionInput & { request: ForceRequest }
): Promise<ServerActionResult<ForceResponse>> {
  return runAction(input, '/api/v1/force', 'POST', input.request, (client) => client.force(input.request), true);
}

export async function binQueryAction(
  input: BaseActionInput & { request: BinQueryRequest }
): Promise<ServerActionResult<BinQueryResponse>> {
  return runAction(input, '/api/v1/binQuery', 'POST', input.request, (client) => client.binQuery(input.request), true);
}

export async function getServerHistoryAction(): Promise<HistoryEntry[]> {
  return serverHistory;
}
