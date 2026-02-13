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
  DeleteLaneResponse,
  DisplayRequest,
  DisplayResponse,
  ForceRequest,
  ForceResponse,
  GetLaneResponse,
  HostStatusResponse,
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
  TransactionQueryRequest,
  TransactionQueryResponse,
  TriPosStatusResponse,
  VoidRequest,
  VoidResponse,
} from './types';

export interface RequestResult<T> {
  response: ApiResponse<T>;
  sentHeaders: Record<string, string>;
}

function buildHeaders(config: PayrixConfig, includeAuthorization: boolean, requestId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'tp-application-id': config.applicationId,
    'tp-application-name': config.applicationName,
    'tp-application-version': config.applicationVersion,
    'tp-request-id': requestId ?? crypto.randomUUID(),
    'tp-express-acceptor-id': config.expressAcceptorId,
    'tp-express-account-id': config.expressAccountId,
    'tp-express-account-token': config.expressAccountToken,
    'Content-Type': 'application/json',
  };

  if (includeAuthorization) {
    headers['tp-authorization'] = config.tpAuthorization;
  }

  return headers;
}

function getBaseUrl(environment: PayrixConfig['environment']): string {
  if (environment === 'cert') {
    return 'https://triposcert.vantiv.com';
  }

  // TODO: confirm final production host with Payrix docs.
  return 'https://tripos.vantiv.com';
}

interface RequestOptions<TBody> {
  endpoint: string;
  method?: 'GET' | 'POST' | 'DELETE';
  includeAuthorization?: boolean;
  requestId?: string;
  query?: Record<string, string | number | undefined>;
  body?: TBody;
}

export class PayrixClient {
  private readonly baseUrl: string;

  constructor(private readonly config: PayrixConfig) {
    this.baseUrl = getBaseUrl(config.environment);
  }

  private buildUrl(path: string, query?: RequestOptions<unknown>['query']): string {
    const url = new URL(path, this.baseUrl);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async request<TResponse, TBody = undefined>(options: RequestOptions<TBody>): Promise<RequestResult<TResponse>> {
    const headers = buildHeaders(this.config, options.includeAuthorization ?? false, options.requestId);

    try {
      const response = await fetch(this.buildUrl(options.endpoint, options.query), {
        method: options.method ?? 'POST',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        cache: 'no-store',
      });

      const rawText = await response.text();
      const payload = rawText ? (JSON.parse(rawText) as TResponse) : undefined;

      return {
        response: {
          data: payload,
          status: response.status,
          statusText: response.statusText,
          error: response.ok ? undefined : `Request failed with status ${response.status}`,
        },
        sentHeaders: headers,
      };
    } catch (error) {
      return {
        response: {
          status: 500,
          statusText: 'Client Error',
          error: error instanceof Error ? error.message : 'Unknown client error',
        },
        sentHeaders: headers,
      };
    }
  }

  // --- Lane Management (Lane API: /cloudapi/v1/lanes) ---

  async createLane(request: CreateLaneRequest, requestId?: string): Promise<RequestResult<CreateLaneResponse>> {
    return this.request<CreateLaneResponse, CreateLaneRequest>({
      endpoint: '/cloudapi/v1/lanes',
      method: 'POST',
      body: request,
      requestId,
    });
  }

  async deleteLane(laneId: string, requestId?: string): Promise<RequestResult<DeleteLaneResponse>> {
    return this.request<DeleteLaneResponse>({
      endpoint: `/cloudapi/v1/lanes/${encodeURIComponent(laneId)}`,
      method: 'DELETE',
      requestId,
    });
  }

  async listLanes(request: ListLanesRequest = {}, requestId?: string): Promise<RequestResult<ListLanesResponse>> {
    return this.request<ListLanesResponse>({
      endpoint: '/cloudapi/v1/lanes',
      method: 'GET',
      query: {
        pageNumber: request.pageNumber,
        pageSize: request.pageSize,
      },
      requestId,
    });
  }

  async getLane(laneId: string, requestId?: string): Promise<RequestResult<GetLaneResponse>> {
    return this.request<GetLaneResponse>({
      endpoint: `/cloudapi/v1/lanes/${encodeURIComponent(laneId)}`,
      method: 'GET',
      requestId,
    });
  }

  // --- Transaction API: /api/v1/... ---

  async sale(request: SaleRequest, requestId?: string): Promise<RequestResult<SaleResponse>> {
    return this.request<SaleResponse, SaleRequest>({
      endpoint: '/api/v1/sale',
      includeAuthorization: true,
      method: 'POST',
      body: request,
      requestId,
    });
  }

  async authorization(request: AuthorizationRequest, requestId?: string): Promise<RequestResult<AuthorizationResponse>> {
    return this.request<AuthorizationResponse, AuthorizationRequest>({
      endpoint: '/api/v1/authorization',
      includeAuthorization: true,
      method: 'POST',
      body: request,
      requestId,
    });
  }

  async completion(transactionId: string, request: CompletionRequest, requestId?: string): Promise<RequestResult<CompletionResponse>> {
    return this.request<CompletionResponse, CompletionRequest>({
      endpoint: `/api/v1/authorization/${encodeURIComponent(transactionId)}/completion`,
      includeAuthorization: true,
      method: 'POST',
      body: request,
      requestId,
    });
  }

  async refund(paymentAccountId: string, request: RefundRequest, requestId?: string): Promise<RequestResult<RefundResponse>> {
    return this.request<RefundResponse, RefundRequest>({
      endpoint: `/api/v1/refund/${encodeURIComponent(paymentAccountId)}`,
      includeAuthorization: true,
      method: 'POST',
      body: request,
      requestId,
    });
  }

  async returnTransaction(transactionId: string, paymentType: PaymentType, request: ReturnRequest, requestId?: string): Promise<RequestResult<ReturnResponse>> {
    return this.request<ReturnResponse, ReturnRequest>({
      endpoint: `/api/v1/return/${encodeURIComponent(transactionId)}/${encodeURIComponent(paymentType)}`,
      includeAuthorization: true,
      method: 'POST',
      body: request,
      requestId,
    });
  }

  async reversal(transactionId: string, paymentType: PaymentType, request: ReversalRequest, requestId?: string): Promise<RequestResult<ReversalResponse>> {
    return this.request<ReversalResponse, ReversalRequest>({
      endpoint: `/api/v1/reversal/${encodeURIComponent(transactionId)}/${encodeURIComponent(paymentType)}`,
      includeAuthorization: true,
      method: 'POST',
      body: request,
      requestId,
    });
  }

  async voidTransaction(transactionId: string, request: VoidRequest, requestId?: string): Promise<RequestResult<VoidResponse>> {
    return this.request<VoidResponse, VoidRequest>({
      endpoint: `/api/v1/void/${encodeURIComponent(transactionId)}`,
      includeAuthorization: true,
      method: 'POST',
      body: request,
      requestId,
    });
  }

  async force(request: ForceRequest, requestId?: string): Promise<RequestResult<ForceResponse>> {
    return this.request<ForceResponse, ForceRequest>({
      endpoint: '/api/v1/force/credit',
      includeAuthorization: true,
      method: 'POST',
      body: request,
      requestId,
    });
  }

  async binQuery(request: BinQueryRequest, requestId?: string): Promise<RequestResult<BinQueryResponse>> {
    const query: Record<string, string | number | undefined> = {};
    if (request.invokeManualEntry !== undefined) {
      query.invokeManualEntry = request.invokeManualEntry ? 'true' : 'false';
    }
    if (request.isCscSupported !== undefined) {
      query.isCscSupported = request.isCscSupported ? 'true' : 'false';
    }
    return this.request<BinQueryResponse>({
      endpoint: `/api/v1/binQuery/${encodeURIComponent(request.laneId)}`,
      includeAuthorization: true,
      method: 'GET',
      query,
      requestId,
    });
  }

  async transactionQuery(request: TransactionQueryRequest, requestId?: string): Promise<RequestResult<TransactionQueryResponse>> {
    return this.request<TransactionQueryResponse, TransactionQueryRequest>({
      endpoint: '/api/v1/transactionQuery',
      includeAuthorization: true,
      method: 'POST',
      body: request,
      requestId,
    });
  }

  // --- Deprecated: use refund() instead ---
  async credit(request: CreditRequest, requestId?: string): Promise<RequestResult<CreditResponse>> {
    return this.request<CreditResponse, CreditRequest>({
      endpoint: `/api/v1/refund/${encodeURIComponent(request.paymentAccountId)}`,
      includeAuthorization: true,
      method: 'POST',
      body: request,
      requestId,
    });
  }

  async receipt(request: ReceiptRequest, requestId?: string): Promise<RequestResult<ReceiptResponse>> {
    return this.request<ReceiptResponse, ReceiptRequest>({
      endpoint: '/api/v1/receipt',
      includeAuthorization: true,
      method: 'POST',
      body: request,
      requestId,
    });
  }

  // --- Utility / Device Interaction ---

  async display(request: DisplayRequest, requestId?: string): Promise<RequestResult<DisplayResponse>> {
    return this.request<DisplayResponse, DisplayRequest>({
      endpoint: '/api/v1/display',
      includeAuthorization: true,
      method: 'POST',
      body: request,
      requestId,
    });
  }

  async idle(request: IdleRequest, requestId?: string): Promise<RequestResult<IdleResponse>> {
    return this.request<IdleResponse, IdleRequest>({
      endpoint: '/api/v1/idle',
      includeAuthorization: true,
      method: 'POST',
      body: request,
      requestId,
    });
  }

  async input(laneId: string, requestId?: string): Promise<RequestResult<InputResponse>> {
    return this.request<InputResponse>({
      endpoint: `/api/v1/input/${encodeURIComponent(laneId)}`,
      includeAuthorization: true,
      method: 'GET',
      requestId,
    });
  }

  async selection(laneId: string, requestId?: string): Promise<RequestResult<SelectionResponse>> {
    return this.request<SelectionResponse>({
      endpoint: `/api/v1/selection/${encodeURIComponent(laneId)}`,
      includeAuthorization: true,
      method: 'GET',
      requestId,
    });
  }

  async signature(laneId: string, requestId?: string): Promise<RequestResult<SignatureResponse>> {
    return this.request<SignatureResponse>({
      endpoint: `/api/v1/signature/${encodeURIComponent(laneId)}`,
      includeAuthorization: true,
      method: 'GET',
      requestId,
    });
  }

  // --- Status ---

  async hostStatus(requestId?: string): Promise<RequestResult<HostStatusResponse>> {
    return this.request<HostStatusResponse>({
      endpoint: '/api/v1/status/host',
      includeAuthorization: true,
      method: 'GET',
      requestId,
    });
  }

  async triPosStatus(echo: string, requestId?: string): Promise<RequestResult<TriPosStatusResponse>> {
    return this.request<TriPosStatusResponse>({
      endpoint: `/api/v1/status/triPOS/${encodeURIComponent(echo)}`,
      includeAuthorization: true,
      method: 'GET',
      requestId,
    });
  }

  async laneConnectionStatus(laneId: string, requestId?: string): Promise<RequestResult<LaneConnectionStatusResponse>> {
    return this.request<LaneConnectionStatusResponse>({
      endpoint: `/cloudapi/v1/lanes/${encodeURIComponent(laneId)}/connectionstatus`,
      method: 'GET',
      requestId,
    });
  }
}
