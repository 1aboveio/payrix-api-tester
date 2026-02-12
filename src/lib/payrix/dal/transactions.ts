import { transactionQueryAction } from '@/actions/payrix';
import type { PayrixConfig, Transaction, TransactionQueryRequest } from '@/lib/payrix/types';

export interface TransactionQueryResult {
  data: Transaction[];
  raw: unknown;
  error?: string;
}

export async function queryTransactions(
  config: PayrixConfig,
  filters: {
    terminalId: string;
    startDate: string;
    endDate: string;
    transactionId?: string;
    referenceNumber?: string;
  }
): Promise<TransactionQueryResult> {
  const normalizeDate = (value: string) => value.replace(/-/g, '');

  const request: TransactionQueryRequest = {
    terminalId: filters.terminalId,
    startDate: normalizeDate(filters.startDate),
    endDate: normalizeDate(filters.endDate),
  };

  if (filters.transactionId?.trim()) {
    request.transactionId = filters.transactionId.trim();
  }
  if (filters.referenceNumber?.trim()) {
    request.referenceNumber = filters.referenceNumber.trim();
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
  return {
    data: response?.transactions ?? response?.reportingData ?? [],
    raw: response,
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
