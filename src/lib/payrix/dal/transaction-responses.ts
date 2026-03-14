import prisma from './prisma';

export interface TransactionResponseData {
  id: string;
  transactionId?: string;
  referenceNum?: string;
  endpoint: string;
  method: string;
  requestData: unknown;
  responseData: unknown;
  statusCode: number;
  statusText: string;
  duration?: number;
  source: 'tripos' | 'platform';
  createdAt: Date;
}

export interface SaveTransactionResponseInput {
  transactionId?: string;
  referenceNum?: string;
  endpoint: string;
  method: string;
  requestData: unknown;
  responseData: unknown;
  statusCode: number;
  statusText: string;
  duration?: number;
  source: 'tripos' | 'platform';
}

export async function saveTransactionResponse(input: SaveTransactionResponseInput): Promise<void> {
  await prisma.transactionResponse.create({
    data: {
      transactionId: input.transactionId ?? null,
      referenceNum: input.referenceNum ?? null,
      endpoint: input.endpoint,
      method: input.method,
      requestData: JSON.stringify(input.requestData),
      responseData: JSON.stringify(input.responseData),
      statusCode: input.statusCode,
      statusText: input.statusText,
      duration: input.duration ?? null,
      source: input.source,
    },
  });
}

export async function getTransactionResponses(transactionId: string): Promise<TransactionResponseData[]> {
  const responses = await prisma.transactionResponse.findMany({
    where: { transactionId },
    orderBy: { createdAt: 'desc' },
  });

  return responses.map((r) => ({
    id: r.id,
    transactionId: r.transactionId ?? undefined,
    referenceNum: r.referenceNum ?? undefined,
    endpoint: r.endpoint,
    method: r.method,
    requestData: JSON.parse(r.requestData),
    responseData: JSON.parse(r.responseData),
    statusCode: r.statusCode,
    statusText: r.statusText,
    duration: r.duration ?? undefined,
    source: r.source as 'tripos' | 'platform',
    createdAt: r.createdAt,
  }));
}

export async function getTransactionResponsesByRef(referenceNum: string): Promise<TransactionResponseData[]> {
  const responses = await prisma.transactionResponse.findMany({
    where: { referenceNum },
    orderBy: { createdAt: 'desc' },
  });

  return responses.map((r) => ({
    id: r.id,
    transactionId: r.transactionId ?? undefined,
    referenceNum: r.referenceNum ?? undefined,
    endpoint: r.endpoint,
    method: r.method,
    requestData: JSON.parse(r.requestData),
    responseData: JSON.parse(r.responseData),
    statusCode: r.statusCode,
    statusText: r.statusText,
    duration: r.duration ?? undefined,
    source: r.source as 'tripos' | 'platform',
    createdAt: r.createdAt,
  }));
}
