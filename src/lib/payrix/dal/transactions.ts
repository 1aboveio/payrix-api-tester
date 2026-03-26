import { transactionQueryAction } from '@/actions/payrix';
import type { PayrixConfig, Transaction, TransactionQueryRequest } from '@/lib/payrix/types';

export interface TransactionQueryResult {
  data: Transaction[];
  raw: unknown;
  error?: string;
  hasMore?: boolean;
}

export async function queryTransactions(
  config: PayrixConfig,
  filters: {
    terminalId: string;
    startDate: string;
    endDate: string;
    transactionId?: string;
    referenceNumber?: string;
    maxPageSize?: number;
    offset?: number;
  }
): Promise<TransactionQueryResult> {
  const normalizeDate = (value: string) => value.replace(/-/g, '');

  const request: TransactionQueryRequest = {
    terminalId: filters.terminalId,
    startDate: normalizeDate(filters.startDate),
    endDate: normalizeDate(filters.endDate),
    pageSize: filters.maxPageSize,
  };

  if (filters.transactionId?.trim()) {
    request.transactionId = filters.transactionId.trim();
  }
  if (filters.referenceNumber?.trim()) {
    request.referenceNumber = filters.referenceNumber.trim();
  }
  if (filters.offset !== undefined) {
    request.offset = filters.offset;
  }

  const result = await transactionQueryAction({ config, request });

  if (result.apiResponse.error) {
    return {
      data: [],
      raw: result.apiResponse.data ?? result.apiResponse.error,
      error: result.apiResponse.error,
    };
  }

  const response = result.apiResponse.data;
  const transactions = response?.transactions ?? response?.reportingData ?? [];
  const pageSize = filters.maxPageSize ?? 100;
  return {
    data: transactions,
    raw: response,
    hasMore: transactions.length === pageSize,
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
