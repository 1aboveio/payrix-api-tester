import type { SaleResponse } from '@/lib/payrix/types';

import type { ReceiptData } from './types';

export function formatReceipt(sale: SaleResponse, config?: { merchantName?: string }): ReceiptData {
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
