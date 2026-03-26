import { transactionQueryAction } from '@/actions/payrix';
import type { PayrixConfig, Transaction, TransactionQueryRequest } from '@/lib/payrix/types';

export interface TransactionQueryResult {
  data: Transaction[];
  raw: unknown;
  error?: string;
  pagination?: {
    limit: number;
    offset: number;
    total?: number;
    hasMore: boolean;
  };
}

function buildSearchHeader(filters: {
  startDate: string;
  endDate: string;
  transactionId?: string;
  referenceNumber?: string;
}): string | undefined {
  const parts: string[] = [];

  // Normalize dates (remove dashes for triPOS format)
  if (filters.startDate) {
    parts.push(`created[greater]=${filters.startDate.replace(/-/g, '')}`);
  }
  if (filters.endDate) {
    parts.push(`created[less]=${filters.endDate.replace(/-/g, '')}`);
  }
  if (filters.transactionId?.trim()) {
    parts.push(`transactionId[eq]=${encodeURIComponent(filters.transactionId.trim())}`);
  }
  if (filters.referenceNumber?.trim()) {
    parts.push(`referenceNumber[eq]=${encodeURIComponent(filters.referenceNumber.trim())}`);
  }

  return parts.length > 0 ? parts.join(';') : undefined;
}

export async function queryTransactions(
  config: PayrixConfig,
  filters: {
    terminalId: string;
    startDate: string;
    endDate: string;
    transactionId?: string;
    referenceNumber?: string;
    limit?: number;
    offset?: number;
  }
): Promise<TransactionQueryResult> {
  const request: TransactionQueryRequest = {
    terminalId: filters.terminalId,
  };

  // Build search header for date filters and other criteria
  const search = buildSearchHeader({
    startDate: filters.startDate,
    endDate: filters.endDate,
    transactionId: filters.transactionId,
    referenceNumber: filters.referenceNumber,
  });

  const result = await transactionQueryAction({
    config,
    request,
    limit: filters.limit ?? 10,
    offset: filters.offset ?? 0,
    search,
  });

  if (result.apiResponse.error) {
    return {
      data: [],
      raw: result.apiResponse.data ?? result.apiResponse.error,
      error: result.apiResponse.error,
    };
  }

  const response = result.apiResponse.data;
  const data = response?.transactions ?? response?.reportingData ?? [];

  // Try to extract pagination from response
  const total = response?.totalCount ?? data.length;
  const limit = filters.limit ?? 10;
  const offset = filters.offset ?? 0;

  return {
    data,
    raw: response,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + data.length < total,
    },
  };
}

export async function getTransactionById(
  config: PayrixConfig,
  transactionId: string
): Promise<TransactionQueryResult> {
  const request: TransactionQueryRequest = { transactionId };
  const result = await transactionQueryAction({ config, request });

  if (result.apiResponse.error) {
    return {
      data: [],
      raw: result.apiResponse.data ?? result.apiResponse.error,
      error: result.apiResponse.error,
    };
  }

  const response = result.apiResponse.data;
  return {
    data: response?.transactions ?? response?.reportingData ?? [],
    raw: response,
  };
}
