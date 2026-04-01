import { ReceiptData } from './types';

// SaleResponse type from payrix
interface SaleResponse {
  transactionId?: string;
  status?: string;
  approvalCode?: string;
  cardType?: string;
  last4?: string;
  transactionAmount?: string;
  subTotalAmount?: string;
  tipAmount?: string;
  [key: string]: unknown;
}

export function formatReceipt(
  sale: SaleResponse,
  config?: { merchantName?: string }
): ReceiptData {
  return {
    merchantName: config?.merchantName ?? 'Payrix Merchant',
    transactionId: sale.transactionId,
    status: sale.status,
    approvalCode: sale.approvalCode,
    cardType: sale.cardType,
    last4: sale.last4,
    transactionAmount: sale.transactionAmount,
    subTotalAmount: sale.subTotalAmount,
    tipAmount: sale.tipAmount,
    timestamp: new Date().toISOString(),
  };
}
