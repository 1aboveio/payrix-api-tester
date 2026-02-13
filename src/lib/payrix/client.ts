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
  ListLanesRequest,
  ListLanesResponse,
  PayrixConfig,
  PayrixHeaders,
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
  TransactionQueryRequest,
  TransactionQueryResponse,
  VoidRequest,
  VoidResponse,
} from './types';

function buildHeaders(config: PayrixConfig, includeAuthorization: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    'tp-application-id': config.applicationId,
    'tp-application-name': config.applicationName,
    'tp-application-version': config.applicationVersion,
    'tp-request-id': crypto.randomUUID(),
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
  method?: 'GET' | 'POST';
  includeAuthorization?: boolean;
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

  private async request<TResponse, TBody = undefined>(options: RequestOptions<TBody>): Promise<ApiResponse<TResponse>> {
    try {
      const response = await fetch(this.buildUrl(options.endpoint, options.query), {
        method: options.method ?? 'POST',
        headers: buildHeaders(this.config, options.includeAuthorization ?? false),
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        cache: 'no-store',
      });

      const rawText = await response.text();
      const payload = rawText ? (JSON.parse(rawText) as TResponse) : undefined;

      return {
        data: payload,
        status: response.status,
        statusText: response.statusText,
        error: response.ok ? undefined : `Request failed with status ${response.status}`,
      };
    } catch (error) {
      return {
        status: 500,
        statusText: 'Client Error',
        error: error instanceof Error ? error.message : 'Unknown client error',
      };
    }
  }

  async createLane(request: CreateLaneRequest): Promise<ApiResponse<CreateLaneResponse>> {
    return this.request<CreateLaneResponse, CreateLaneRequest>({
      endpoint: '/cloudapi/v1/lanes',
      method: 'POST',
      body: request,
    });
  }

  async listLanes(request: ListLanesRequest = {}): Promise<ApiResponse<ListLanesResponse>> {
    return this.request<ListLanesResponse>({
      endpoint: '/cloudapi/v1/lanes',
      method: 'GET',
      query: {
        pageNumber: request.pageNumber,
        pageSize: request.pageSize,
      },
    });
  }

  async getLane(laneId: string): Promise<ApiResponse<GetLaneResponse>> {
    return this.request<GetLaneResponse>({
      endpoint: `/cloudapi/v1/lanes/${encodeURIComponent(laneId)}`,
      method: 'GET',
    });
  }

  async sale(request: SaleRequest): Promise<ApiResponse<SaleResponse>> {
    return this.request<SaleResponse, SaleRequest>({
      endpoint: '/api/v1/sale',
      includeAuthorization: true,
      method: 'POST',
      body: request,
    });
  }

  async transactionQuery(request: TransactionQueryRequest): Promise<ApiResponse<TransactionQueryResponse>> {
    return this.request<TransactionQueryResponse, TransactionQueryRequest>({
      endpoint: '/api/v1/transactionQuery',
      includeAuthorization: true,
      method: 'POST',
      body: request,
    });
  }

  async voidTransaction(transactionId: string, request: VoidRequest = {}): Promise<ApiResponse<VoidResponse>> {
    return this.request<VoidResponse, VoidRequest>({
      endpoint: `/api/v1/void/${encodeURIComponent(transactionId)}`,
      includeAuthorization: true,
      method: 'POST',
      body: request,
    });
  }

  async returnTransaction(
    transactionId: string,
    paymentType: PaymentType,
    request: ReturnRequest = {}
  ): Promise<ApiResponse<ReturnResponse>> {
    return this.request<ReturnResponse, ReturnRequest>({
      endpoint: `/api/v1/sale/${encodeURIComponent(transactionId)}/return/${encodeURIComponent(paymentType)}`,
      includeAuthorization: true,
      method: 'POST',
      body: request,
    });
  }

  async reversal(
    transactionId: string,
    paymentType: PaymentType,
    request: ReversalRequest = {}
  ): Promise<ApiResponse<ReversalResponse>> {
    return this.request<ReversalResponse, ReversalRequest>({
      endpoint: `/api/v1/reversal/${encodeURIComponent(transactionId)}/${encodeURIComponent(paymentType)}`,
      includeAuthorization: true,
      method: 'POST',
      body: request,
    });
  }

  async credit(request: CreditRequest): Promise<ApiResponse<CreditResponse>> {
    return this.request<CreditResponse, CreditRequest>({
      endpoint: '/api/v1/credit',
      includeAuthorization: true,
      method: 'POST',
      body: request,
    });
  }

  async receipt(request: ReceiptRequest): Promise<ApiResponse<ReceiptResponse>> {
    return this.request<ReceiptResponse, ReceiptRequest>({
      endpoint: '/api/v1/receipt',
      includeAuthorization: true,
      method: 'POST',
      body: request,
    });
  }

  async authorization(request: AuthorizationRequest): Promise<ApiResponse<AuthorizationResponse>> {
    return this.request<AuthorizationResponse, AuthorizationRequest>({
      endpoint: '/api/v1/authorization',
      includeAuthorization: true,
      method: 'POST',
      body: request,
    });
  }

  async completion(
    transactionId: string,
    request: CompletionRequest = {}
  ): Promise<ApiResponse<CompletionResponse>> {
    return this.request<CompletionResponse, CompletionRequest>({
      endpoint: `/api/v1/sale/${encodeURIComponent(transactionId)}/completion`,
      includeAuthorization: true,
      method: 'POST',
      body: request,
    });
  }

  async refund(
    transactionId: string,
    paymentType: PaymentType,
    request: RefundRequest = {}
  ): Promise<ApiResponse<RefundResponse>> {
    return this.request<RefundResponse, RefundRequest>({
      endpoint: `/api/v1/sale/${encodeURIComponent(transactionId)}/refund/${encodeURIComponent(paymentType)}`,
      includeAuthorization: true,
      method: 'POST',
      body: request,
    });
  }

  async force(request: ForceRequest): Promise<ApiResponse<ForceResponse>> {
    return this.request<ForceResponse, ForceRequest>({
      endpoint: '/api/v1/force',
      includeAuthorization: true,
      method: 'POST',
      body: request,
    });
  }

  async binQuery(request: BinQueryRequest): Promise<ApiResponse<BinQueryResponse>> {
    return this.request<BinQueryResponse, BinQueryRequest>({
      endpoint: '/api/v1/binQuery',
      includeAuthorization: true,
      method: 'POST',
      body: request,
    });
  }
}
