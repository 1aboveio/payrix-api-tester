'use server';

import { getTransactionResponses, getTransactionResponsesByRef, type TransactionResponseData } from '@/lib/payrix/dal/transaction-responses';

export async function getStoredTransactionResponses(transactionId: string): Promise<TransactionResponseData[]> {
  'use server';
  return getTransactionResponses(transactionId);
}

export async function getStoredResponsesByReference(referenceNum: string): Promise<TransactionResponseData[]> {
  'use server';
  return getTransactionResponsesByRef(referenceNum);
}
