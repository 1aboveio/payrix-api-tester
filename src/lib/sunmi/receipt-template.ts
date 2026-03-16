import { formatCardLine, leftAlign, renderEscPosLinesToHex, type ReceiptLine } from './escpos-renderer';

export interface TriPosAmountNode {
  value?: string;
  amount?: string;
  currency?: string;
}

export interface TriPosAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  postalCode?: string;
  country?: string;
}

export interface TriPosMerchant {
  name?: string;
  merchantName?: string;
  address?: string | string[] | TriPosAddress;
  addr?: string;
  location?: string;
}

export interface TriPosSaleResponse {
  status?: string;
  responseMessage?: string;
  transactionType?: string;
  type?: string;
  transactionId?: string;
  transRefNo?: string;
  approvalCode?: string;
  authCode?: string;
  cardType?: string;
  last4?: string;
  card?: {
    type?: string;
    cardType?: string;
    last4?: string;
  };
  subTotalAmount?: string;
  subtotal?: string;
  subtotalAmount?: string;
  tax?: string;
  taxAmount?: string;
  tipAmount?: string;
  tip?: string;
  transactionAmount?: string;
  amount?: string;
  merchant?: TriPosMerchant;
  merchantName?: string;
  businessName?: string;
  merchantAddress?: string;
  merchantAddressLine1?: string;
  merchantAddressLine2?: string;
  merchantAddressLine3?: string;
  createdAt?: string;
  dateTime?: string;
  transactionDateTime?: string;
  timestamp?: string;
  createdDateTime?: string;
  [key: string]: unknown;
}

const RECEIPT_WIDTH = 48;

export function renderSaleReceipt(saleResponse: TriPosSaleResponse): Uint8Array {
  const header = buildHeaderLines(saleResponse);
  const transaction = buildTransactionLines(saleResponse);
  const amounts = buildAmountLines(saleResponse);
  const footer = buildFooterLines(saleResponse);

  const lines = [...header, ...transaction, ...amounts, ...footer];
  const hex = renderEscPosLinesToHex(lines);
  return decodeHex(hex);
}

function buildHeaderLines(saleResponse: TriPosSaleResponse): ReceiptLine[] {
  const merchantName = normalizeMerchantName(saleResponse);
  const timestamp = normalizeTimestamp(saleResponse);
  const addressLines = normalizeMerchantAddress(saleResponse);

  const lines: ReceiptLine[] = [
    { text: alignWidth(merchantName, RECEIPT_WIDTH), align: 1, font: 0x30 },
    { text: '-'.repeat(RECEIPT_WIDTH), align: 0, font: 0x00 },
  ];

  addressLines.forEach((line) => {
    lines.push({ text: alignWidth(line, RECEIPT_WIDTH), align: 1, font: 0x00 });
  });

  lines.push({ text: alignWidth('Transaction Receipt', RECEIPT_WIDTH), align: 0, font: 0x00 });
  lines.push({ text: alignWidth(timestamp, RECEIPT_WIDTH), align: 1, font: 0x00 });

  return lines;
}

function buildTransactionLines(saleResponse: TriPosSaleResponse): ReceiptLine[] {
  const transactionType = getTransactionType(saleResponse);
  const status = getStatus(saleResponse);
  const transactionId = getField(saleResponse, ['transactionId', 'transRefNo']) || '-';
  const cardType = getCardType(saleResponse);
  const last4 = getField(saleResponse, ['last4', 'panLast4', 'card.last4']);
  const approvalCode = getField(saleResponse, ['approvalCode', 'authCode', 'authcode', 'approval']) || '-';

  const lines: ReceiptLine[] = [
    { text: alignWidth(transactionType, RECEIPT_WIDTH), align: 0, font: 0x00 },
    { text: `Card: ${formatCardLine(cardType, last4)}`, align: 0, font: 0x00 },
    { text: `Authorization: ${approvalCode}`, align: 0, font: 0x00 },
    { text: `Transaction ID: ${transactionId}`, align: 0, font: 0x00 },
    { text: `Status: ${status}`, align: 0, font: 0x00 },
    { text: '-'.repeat(RECEIPT_WIDTH), align: 0, font: 0x00 },
  ];

  return lines;
}

function buildAmountLines(saleResponse: TriPosSaleResponse): ReceiptLine[] {
  const subtotal = normalizeAmount(
    getField(saleResponse, ['subTotalAmount', 'subtotal', 'subtotalAmount', 'subtotal_amount']) ?? '$0.00'
  );
  const tax = normalizeAmount(getField(saleResponse, ['tax', 'taxAmount', 'tax_amount']) ?? '0.00');
  const tip = normalizeAmount(getField(saleResponse, ['tipAmount', 'tip']) ?? '');
  const total = normalizeAmount(
    getField(saleResponse, ['transactionAmount', 'amount', 'totalAmount', 'total_amount']) ?? subtotal
  );

  const lines: ReceiptLine[] = [
    { text: formatAmountLine('Subtotal', subtotal), align: 0, font: 0x00 },
  ];

  if (tip && tip !== '-') {
    lines.push({ text: formatAmountLine('Tip', tip), align: 0, font: 0x00 });
  }

  lines.push(
    { text: formatAmountLine('Tax', tax), align: 0, font: 0x00 },
    { text: formatAmountLine('TOTAL', total), align: 0, font: 0x30 },
    { text: '-'.repeat(RECEIPT_WIDTH), align: 0, font: 0x00 },
  );

  return lines;
}

function buildFooterLines(saleResponse: TriPosSaleResponse): ReceiptLine[] {
  const isDeclined = isDeclinedStatus(getStatus(saleResponse));
  const lines: ReceiptLine[] = [
    { text: alignWidth('Thank you', RECEIPT_WIDTH), align: 1, font: 0x00 },
    { text: alignWidth('Thank you for your business.', RECEIPT_WIDTH), align: 1, font: 0x00 },
  ];

  if (isDeclined) {
    lines.unshift({ text: alignWidth('DECLINED TRANSACTION', RECEIPT_WIDTH), align: 0, font: 0x30 });
  }

  if (isRefundTransaction(saleResponse)) {
    lines.push({ text: alignWidth('Return policy: ', RECEIPT_WIDTH), align: 1, font: 0x00 });
    lines.push({ text: alignWidth('Refunds may require signature and ID.', RECEIPT_WIDTH), align: 1, font: 0x00 });
  } else {
    lines.push({ text: alignWidth('No cash refunds without receipt.', RECEIPT_WIDTH), align: 1, font: 0x00 });
  }

  return lines;
}

function normalizeTimestamp(saleResponse: TriPosSaleResponse): string {
  return (
    getField(saleResponse, ['transactionDateTime', 'createdAt', 'dateTime', 'timestamp', 'createdDateTime']) ||
    new Date().toISOString()
  );
}

function getTransactionType(saleResponse: TriPosSaleResponse): string {
  const raw = getField(saleResponse, ['transactionType', 'type'])?.toUpperCase() || '';
  if (isRefundTransaction(saleResponse)) {
    return 'REFUND RECEIPT';
  }
  if (isDeclinedStatus(getStatus(saleResponse))) {
    return 'DECLINED RECEIPT';
  }

  if (!raw) {
    return 'SALE RECEIPT';
  }

  return `${raw} RECEIPT`;
}

function getStatus(saleResponse: TriPosSaleResponse): string {
  const raw = getField(saleResponse, ['status', 'responseMessage', 'state'])?.trim() || '';
  if (!raw) {
    return 'UNKNOWN';
  }

  if (isDeclinedStatus(raw)) {
    return raw;
  }

  if (isApprovedStatus(raw)) {
    return 'APPROVED';
  }

  return raw;
}

function isRefundTransaction(saleResponse: TriPosSaleResponse): boolean {
  const type = getField(saleResponse, ['transactionType', 'type'])?.toLowerCase() || '';
  return type.includes('refund') || type.includes('return');
}

function isDeclinedStatus(status: string): boolean {
  const value = status.toLowerCase();
  if (/not[\s_\-]*approved/.test(value)) {
    return true;
  }

  return ['decline', 'declined', 'failed', 'error', 'rejected', 'void', 'cancelled'].some((valueToCheck) => value.includes(valueToCheck));
}

function isApprovedStatus(status: string): boolean {
  return status.toLowerCase().includes('approved');
}

function getCardType(saleResponse: TriPosSaleResponse): string {
  return (
    getField(saleResponse, ['cardType', 'card.type']) ||
    saleResponse.card?.type ||
    saleResponse.card?.cardType ||
    'CARD'
  );
}

function normalizeMerchantName(saleResponse: TriPosSaleResponse): string {
  const merchant =
    getField(saleResponse, ['merchantName', 'merchant.name', 'businessName']) ||
    saleResponse.merchant?.name ||
    saleResponse.merchant?.merchantName ||
    'Payrix Merchant';

  return merchant;
}

function normalizeMerchantAddress(saleResponse: TriPosSaleResponse): string[] {
  const address =
    saleResponse.merchantAddress ||
    saleResponse.merchant?.address ||
    saleResponse.merchant?.addr ||
    saleResponse.merchant?.location;

  if (!address) {
    return [];
  }

  if (typeof address === 'string') {
    return [address].filter(Boolean);
  }

  if (Array.isArray(address)) {
    return address.map((line) => String(line).trim()).filter(Boolean);
  }

  if (typeof address === 'object') {
    const { line1, line2, city, state, zip, postalCode, country } = address as TriPosAddress;
    const lines: string[] = [line1, line2, city, state, zip || postalCode, country]
      .filter((value): value is string => Boolean(value && typeof value === 'string' && value.trim() !== ''))
      .map((value) => value.trim());

    return lines;
  }

  return [];
}

function getField(obj: TriPosSaleResponse, keys: string[]): string | undefined {
  for (const key of keys) {
    if (key.includes('.')) {
      const path = key.split('.');
      const found = path.reduce<unknown>((acc, segment) => {
        if (!acc || typeof acc !== 'object') {
          return undefined;
        }

        return (acc as Record<string, unknown>)[segment];
      }, obj as unknown);
      if (typeof found === 'string' && found.trim() !== '') {
        return found.trim();
      }
      continue;
    }

    const value = (obj as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }

  return undefined;
}

function normalizeAmount(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '-';
  }

  if (/^\$?\d+(\.\d{1,2})?$/.test(trimmed)) {
    return trimmed.startsWith('$') ? trimmed : `$${trimmed}`;
  }

  return trimmed;
}

function formatAmountLine(label: string, amount: string): string {
  const value = amount || '-';
  const left = `${label}:`;

  if (left.length + value.length + 1 >= RECEIPT_WIDTH) {
    return `${left} ${value}`;
  }

  return `${left}${' '.repeat(RECEIPT_WIDTH - left.length - value.length)}${value}`;
}

function alignWidth(value: string, width: number): string {
  return leftAlign(value, width);
}

function decodeHex(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
  if (clean.length % 2 !== 0) {
    throw new Error('Invalid hex length for receipt bytes');
  }

  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}
