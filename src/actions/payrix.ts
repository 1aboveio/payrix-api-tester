'use server';

import { PayrixClient } from '@/lib/payrix/client';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import type { RequestResult } from '@/lib/payrix/client';
import type {
  ApiResponse,
  AuthorizationRequest,
  AuthorizationResponse,
  BinQueryRequest,
  BinQueryResponse,
  CancelResponse,
  CompletionRequest,
  CompletionResponse,
  CreateLaneRequest,
  CreateLaneResponse,
  CreditRequest,
  CreditResponse,
  DisplayRequest,
  DisplayResponse,
  ForceRequest,
  ForceResponse,
  GetLaneResponse,
  HostStatusResponse,
  HttpMethod,
  HistoryEntry,
  IdleRequest,
  IdleResponse,
  InputResponse,
  LaneConnectionStatusResponse,
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
  SelectionResponse,
  SignatureResponse,
  ServerActionResult,
  TransactionQueryRequest,
  TransactionQueryResponse,
  TriPosStatusResponse,
  VoidRequest,
  VoidResponse,
} from '@/lib/payrix/types';
import { getServerHistory as getPlatformServerHistory } from '@/lib/storage';
import { saveTransactionResponse } from '@/lib/payrix/dal/transaction-responses';
import { SunmiCloudClient } from '@/lib/sunmi/client';
import { renderSaleReceipt } from '@/lib/sunmi/receipt-template';

const MAX_SERVER_HISTORY = 200;
const serverHistory: HistoryEntry[] = [];

interface BaseActionInput {
  config: PayrixConfig;
  templateName?: string;
  requestId?: string;
  httpMethod?: HttpMethod;
}

interface LaneByIdInput extends BaseActionInput {
  laneId: string;
  promptType?: string;
  formatType?: string;
  form?: string;
  text?: string;
  multiLineText?: string;
  options?: string;
  header?: string;
  subHeader?: string;
}

interface EchoInput extends BaseActionInput {
  echo: string;
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
  paymentAccountId: string;
  request: RefundRequest;
}

export interface PrintSaleReceiptResult {
  attempted: boolean;
  printed: boolean;
  skipped: boolean;
  reason: string;
  error?: string;
  printerSerial?: string;
  queued?: boolean;
}

export interface PrintSaleReceiptInput {
  saleResponse: SaleResponse;
  merchantName?: string;
}

interface SaleActionResponse extends SaleResponse {
  printOutcome?: PrintSaleReceiptResult;
}

const PRINT_SUCCESS_CODE = '0';
const PRINT_SUCCESS_RESPONSE_CODES: ReadonlySet<string> = new Set(['0', '00', '5', '05']);

function normalizeText(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isDeclinedStatus(status: string): boolean {
  return ['declined', 'decline', 'failed', 'error', 'rejected', 'void', 'cancelled'].some((value) => status.includes(value));
}

function isSuccessfulStatus(status: string): boolean {
  return ['approved', 'success', 'completed', 'captured', 'approved.', 'partial'].some((value) => status.includes(value));
}

function isResponseCodeSuccessful(responseCode: string | undefined): boolean {
  const code = normalizeText(responseCode);
  if (!code) return true;
  return PRINT_SUCCESS_RESPONSE_CODES.has(code);
}

export function isSuccessfulSaleResponse(saleResponse: SaleResponse): boolean {
  if (saleResponse.success === false) {
    return false;
  }

  if (!isResponseCodeSuccessful(saleResponse.responseCode)) {
    return false;
  }

  const status = normalizeText(saleResponse.status);
  const responseMessage = normalizeText(saleResponse.responseMessage);

  if (isDeclinedStatus(status) || isDeclinedStatus(responseMessage)) {
    return false;
  }

  if (isSuccessfulStatus(status) || isSuccessfulStatus(responseMessage)) {
    return true;
  }

  return saleResponse.success === true || Boolean(saleResponse.transactionId);
}

export function isResponseCodePrintable(responseCode: string | undefined): boolean {
  return isResponseCodeSuccessful(responseCode);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function buildAutoPrintOutcome(saleResponse: SaleResponse): PrintSaleReceiptResult {
  if (!isSuccessfulSaleResponse(saleResponse)) {
    return {
      attempted: false,
      printed: false,
      skipped: true,
      reason: 'Sale not successful; skipping receipt print.',
    };
  }

  if (!saleResponse.transactionId) {
    return {
      attempted: false,
      printed: false,
      skipped: true,
      reason: 'Missing transactionId; cannot print receipt.',
    };
  }

  const printerSerial = process.env.SUNMI_PRINTER_SN;
  if (!printerSerial) {
    return {
      attempted: false,
      printed: false,
      skipped: true,
      reason: 'SUNMI_PRINTER_SN is not configured.',
    };
  }

  return {
    attempted: true,
    printed: false,
    skipped: false,
    queued: true,
    reason: 'Receipt print queued for async processing.',
    printerSerial,
  };
}

async function printSaleReceiptViaCloud(
  saleResponse: SaleResponse,
  merchantName: string | undefined,
  force = false
): Promise<PrintSaleReceiptResult> {
  if (!force && !isSuccessfulSaleResponse(saleResponse)) {
    return buildAutoPrintOutcome(saleResponse);
  }

  if (!saleResponse.transactionId) {
    return {
      attempted: false,
      printed: false,
      skipped: true,
      reason: 'Missing transactionId; cannot print receipt.',
    };
  }

  const printerSerial = process.env.SUNMI_PRINTER_SN;
  if (!printerSerial) {
    return {
      attempted: false,
      printed: false,
      skipped: true,
      reason: 'SUNMI_PRINTER_SN is not configured.',
    };
  }

  const client = SunmiCloudClient.fromEnv();
  const receipt = renderSaleReceipt({
    ...(saleResponse as Record<string, unknown>),
    merchantName,
    transactionType: 'SALE',
  });

  try {
    const response = await client.print(printerSerial, toHex(receipt));

    if (response.code !== PRINT_SUCCESS_CODE) {
      return {
        attempted: true,
        printed: false,
        skipped: false,
        reason: `Printer rejected the request (${response.code}): ${response.msg}`,
        printerSerial,
      };
    }

    return {
      attempted: true,
      printed: true,
      skipped: false,
      reason: 'Receipt sent to shared Sunmi printer.',
      printerSerial,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      attempted: true,
      printed: false,
      skipped: false,
      reason: 'Failed to send print job to printer.',
      error: message,
    };
  }
}

function createHistoryEntry(
  endpoint: string,
  method: HttpMethod,
  requestHeaders: Record<string, string>,
  request: unknown,
  response: ApiResponse<unknown>,
  duration: number
): HistoryEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    endpoint,
    method,
    requestHeaders,
    request,
    response: {
      status: response.status,
      statusText: response.statusText,
      data: response.data ?? null,
      error: response.error,
    },
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

// Extract transactionId from request (explicit identifier)
function extractTransactionIdFromRequest(request: unknown): string | undefined {
  if (!request || typeof request !== 'object') return undefined;
  const r = request as Record<string, unknown>;
  // Use explicit transactionId from request if provided
  if (typeof r.transactionId === 'string') return r.transactionId;
  if (typeof r.transaction_id === 'string') return r.transaction_id;
  return undefined;
}

// Extract transactionId from API response (various response shapes)
function extractTransactionIdFromResponse(response: unknown): string | undefined {
  if (!response || typeof response !== 'object') return undefined;
  const r = response as Record<string, unknown>;
  // SaleResponse, AuthorizationResponse, etc. - single transaction
  if (typeof r.transactionId === 'string') return r.transactionId;
  // transactionQuery: only link when exactly one result is returned
  const txns = r.transactions as Array<Record<string, unknown>> | undefined;
  if (txns && txns.length === 1 && typeof txns[0].transactionId === 'string') {
    return txns[0].transactionId;
  }
  // Multi-transaction results should not be linked to a single id
  return undefined;
}

// Extract referenceNumber from request
function extractReferenceNumber(request: unknown): string | undefined {
  if (!request || typeof request !== 'object') return undefined;
  const r = request as Record<string, unknown>;
  if (typeof r.referenceNumber === 'string') return r.referenceNumber;
  if (typeof r.referenceNum === 'string') return r.referenceNum;
  return undefined;
}

async function runAction<T>(
  input: BaseActionInput,
  endpoint: string,
  method: HttpMethod,
  request: unknown,
  action: (client: PayrixClient, requestId?: string) => Promise<RequestResult<T>>,
  requireAuthorization: boolean = false
): Promise<ServerActionResult<T>> {
  const effectiveMethod = input.httpMethod ?? method;
  const configError = validateConfig(input.config, requireAuthorization);
  const previewHeaders = buildHeaderPreview(input.config, requireAuthorization, input.requestId);

  if (configError) {
    const invalidResponse: ApiResponse<T> = {
      status: 400,
      statusText: 'Invalid Config',
      error: configError,
    };

    const historyEntry = createHistoryEntry(endpoint, effectiveMethod, previewHeaders, request, invalidResponse, 0);
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
  const actionResult =
    effectiveMethod === method
      ? await action(client, input.requestId)
      : await client.rawRequest<T, unknown>(endpoint, effectiveMethod, requireAuthorization, request, input.requestId);
  const duration = Date.now() - startedAt;

  const historyEntry = createHistoryEntry(
    endpoint,
    effectiveMethod,
    actionResult.sentHeaders,
    request,
    actionResult.response as ApiResponse<unknown>,
    duration
  );
  if (input.templateName) historyEntry.templateName = input.templateName;
  serverHistory.unshift(historyEntry);
  serverHistory.splice(MAX_SERVER_HISTORY);

  // Save response to DB for persistence (including EMV/tags data)
  // Fire-and-forget: don't block the API response for DB write
  const responseData = actionResult.response.data ?? actionResult.response.error;
  // Use request's explicit transactionId if provided, otherwise fall back to response (for single-tx responses)
  const transactionId = extractTransactionIdFromRequest(request) ?? extractTransactionIdFromResponse(responseData);
  const referenceNum = extractReferenceNumber(request);
  void saveTransactionResponse({
    transactionId,
    referenceNum,
    endpoint,
    method: effectiveMethod,
    requestData: request,
    responseData,
    statusCode: actionResult.response.status,
    statusText: actionResult.response.statusText,
    duration,
    source: 'tripos',
  }).catch((err) => {
    console.error('Failed to save transaction response to DB:', err);
  });

  return {
    apiResponse: actionResult.response,
    historyEntry,
  };
}

export async function createLaneAction(
  input: BaseActionInput & { request: CreateLaneRequest }
): Promise<ServerActionResult<CreateLaneResponse>> {
  return runAction(input, '/cloudapi/v1/lanes', 'POST', input.request, (client, requestId) => client.createLane(input.request, requestId));
}

export async function listLanesAction(
  input: BaseActionInput & { request?: ListLanesRequest }
): Promise<ServerActionResult<ListLanesResponse>> {
  return runAction(input, '/cloudapi/v1/lanes', 'GET', input.request ?? {}, (client, requestId) => client.listLanes(input.request, requestId));
}

export async function getLaneAction(input: LaneByIdInput): Promise<ServerActionResult<GetLaneResponse>> {
  return runAction(input, `/cloudapi/v1/lanes/${input.laneId}`, 'GET', { laneId: input.laneId }, (client, requestId) =>
    client.getLane(input.laneId, requestId)
  );
}

export async function saleAction(
  input: BaseActionInput & { request: SaleRequest }
): Promise<ServerActionResult<SaleActionResponse>> {
  const result = await runAction(input, '/api/v1/sale', 'POST', input.request, (client, requestId) =>
    client.sale(input.request, requestId),
  true
  );

  const saleResponse = result.apiResponse.data;
  if (!saleResponse || typeof saleResponse !== 'object') {
    return result as ServerActionResult<SaleActionResponse>;
  }

  const printOutcome = buildAutoPrintOutcome(saleResponse as SaleResponse);
  if (printOutcome.attempted && printOutcome.queued) {
    void printSaleReceiptViaCloud(saleResponse as SaleResponse, input.config.expressAccountId, true).then((outcome) => {
      if (outcome.printed) {
        console.info('Receipt auto-printed successfully.', {
          transactionId: saleResponse.transactionId,
          printerSerial: outcome.printerSerial,
        });
      } else {
        console.warn('Receipt auto-print outcome:', {
          transactionId: saleResponse.transactionId,
          reason: outcome.reason,
          error: outcome.error,
        });
      }
    });
  }

  const enrichedResponse = {
    ...saleResponse,
    printOutcome: {
      ...printOutcome,
      queued: printOutcome.queued,
    },
  } as SaleActionResponse;

  return {
    ...result,
    apiResponse: {
      ...result.apiResponse,
      data: enrichedResponse,
    },
  };
}

export async function printSaleReceiptAction(input: PrintSaleReceiptInput): Promise<PrintSaleReceiptResult> {
  return printSaleReceiptViaCloud(input.saleResponse, input.merchantName, true);
}

export async function transactionQueryAction(
  input: BaseActionInput & { request: TransactionQueryRequest }
): Promise<ServerActionResult<TransactionQueryResponse>> {
  return runAction(input, '/api/v1/transactionQuery', 'POST', input.request, (client, requestId) =>
    client.transactionQuery(input.request, requestId),
    true
  );
}

export async function voidAction(input: VoidInput): Promise<ServerActionResult<VoidResponse>> {
  return runAction(input, `/api/v1/void/${input.transactionId}`, 'POST', input.request ?? {}, (client, requestId) =>
    client.voidTransaction(input.transactionId, input.request ?? {}, requestId),
    true
  );
}

export async function cancelAction(input: LaneByIdInput): Promise<ServerActionResult<CancelResponse>> {
  return runAction(
    input,
    '/api/v1/cancel',
    'POST',
    { laneId: input.laneId },
    (client, requestId) => client.cancel(input.laneId, requestId),
    true
  );
}

export async function returnAction(input: ReturnInput): Promise<ServerActionResult<ReturnResponse>> {
  return runAction(
    input,
    `/api/v1/return/${input.transactionId}/${input.paymentType}`,
    'POST',
    input.request ?? {},
    (client, requestId) => client.returnTransaction(input.transactionId, input.paymentType, input.request ?? {}, requestId),
    true
  );
}

export async function reversalAction(input: ReversalInput): Promise<ServerActionResult<ReversalResponse>> {
  return runAction(
    input,
    `/api/v1/reversal/${input.transactionId}/${input.paymentType}`,
    'POST',
    input.request ?? {},
    (client, requestId) => client.reversal(input.transactionId, input.paymentType, input.request ?? {}, requestId),
    true
  );
}

export async function creditAction(
  input: BaseActionInput & { request: CreditRequest }
): Promise<ServerActionResult<CreditResponse>> {
  return runAction(
    input,
    `/api/v1/refund/${input.request.paymentAccountId}`,
    'POST',
    input.request,
    (client, requestId) => client.credit(input.request, requestId),
    true
  );
}

export async function receiptAction(
  input: BaseActionInput & { request: ReceiptRequest }
): Promise<ServerActionResult<ReceiptResponse>> {
  return runAction(input, '/api/v1/receipt', 'POST', input.request, (client, requestId) => client.receipt(input.request, requestId), true);
}

export async function authorizationAction(
  input: BaseActionInput & { request: AuthorizationRequest }
): Promise<ServerActionResult<AuthorizationResponse>> {
  return runAction(input, '/api/v1/authorization', 'POST', input.request, (client, requestId) => client.authorization(input.request, requestId), true);
}

export async function completionAction(input: CompletionInput): Promise<ServerActionResult<CompletionResponse>> {
  return runAction(
    input,
    `/api/v1/authorization/${input.transactionId}/completion`,
    'POST',
    { transactionId: input.transactionId, ...input.request },
    (client, requestId) => client.completion(input.transactionId, input.request ?? {}, requestId),
    true
  );
}

export async function refundAction(input: RefundInput): Promise<ServerActionResult<RefundResponse>> {
  return runAction(
    input,
    `/api/v1/refund/${input.paymentAccountId}`,
    'POST',
    input.request,
    (client, requestId) => client.refund(input.paymentAccountId, input.request, requestId),
    true
  );
}

export async function forceAction(
  input: BaseActionInput & { request: ForceRequest }
): Promise<ServerActionResult<ForceResponse>> {
  return runAction(input, '/api/v1/force/credit', 'POST', input.request, (client, requestId) => client.force(input.request, requestId), true);
}

export async function binQueryAction(
  input: BaseActionInput & { request: BinQueryRequest }
): Promise<ServerActionResult<BinQueryResponse>> {
  return runAction(
    input,
    `/api/v1/binQuery/${input.request.laneId}`,
    'GET',
    input.request,
    (client, requestId) => client.binQuery(input.request, requestId),
    true
  );
}

export async function displayAction(
  input: BaseActionInput & { request: DisplayRequest }
): Promise<ServerActionResult<DisplayResponse>> {
  return runAction(input, '/api/v1/display', 'POST', input.request, (client, requestId) => client.display(input.request, requestId), true);
}

export async function idleAction(
  input: BaseActionInput & { request: IdleRequest }
): Promise<ServerActionResult<IdleResponse>> {
  return runAction(input, '/api/v1/idle', 'POST', input.request, (client, requestId) => client.idle(input.request, requestId), true);
}

export async function inputStatusAction(input: LaneByIdInput): Promise<ServerActionResult<InputResponse>> {
  return runAction(input, `/api/v1/input/${input.laneId}`, 'GET', { laneId: input.laneId, promptType: input.promptType, formatType: input.formatType }, (client, requestId) =>
    client.input(input.laneId, input.promptType, input.formatType, requestId),
    true
  );
}

export async function selectionStatusAction(input: LaneByIdInput): Promise<ServerActionResult<SelectionResponse>> {
  return runAction(input, `/api/v1/selection/${input.laneId}`, 'GET', { laneId: input.laneId, form: input.form, text: input.text, multiLineText: input.multiLineText, options: input.options }, (client, requestId) =>
    client.selection(input.laneId, input.form, input.text, input.multiLineText, input.options, requestId),
    true
  );
}

export async function signatureStatusAction(input: LaneByIdInput): Promise<ServerActionResult<SignatureResponse>> {
  return runAction(input, `/api/v1/signature/${input.laneId}`, 'GET', { laneId: input.laneId, form: input.form, header: input.header, subHeader: input.subHeader, text: input.text }, (client, requestId) =>
    client.signature(input.laneId, input.form, input.header, input.subHeader, input.text, requestId),
    true
  );
}

export async function hostStatusAction(input: BaseActionInput): Promise<ServerActionResult<HostStatusResponse>> {
  return runAction(input, '/api/v1/status/host', 'GET', {}, (client, requestId) => client.hostStatus(requestId), true);
}

export async function triPosStatusAction(input: EchoInput): Promise<ServerActionResult<TriPosStatusResponse>> {
  return runAction(input, `/api/v1/status/triPOS/${input.echo}`, 'GET', { echo: input.echo }, (client, requestId) =>
    client.triPosStatus(input.echo, requestId),
    true
  );
}

export async function laneConnectionStatusAction(
  input: LaneByIdInput
): Promise<ServerActionResult<LaneConnectionStatusResponse>> {
  return runAction(
    input,
    `/cloudapi/v1/lanes/${input.laneId}/connectionstatus`,
    'GET',
    { laneId: input.laneId },
    (client, requestId) => client.laneConnectionStatus(input.laneId, requestId)
  );
}

export async function getServerHistoryAction(): Promise<HistoryEntry[]> {
  const merged = [...serverHistory, ...getPlatformServerHistory()];
  const byId = new Map<string, HistoryEntry>();
  merged.forEach((entry) => byId.set(entry.id, entry));
  return Array.from(byId.values()).sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}
