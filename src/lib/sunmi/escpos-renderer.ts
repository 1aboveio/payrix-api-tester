import type { ReceiptData } from './types';

export const ESC = 0x1b;
const GS = 0x1d;
const LINE_FEED = 0x0a;

export type EscPosAlign = 0 | 1 | 2;

export type EscPosFontMode = 0x00 | 0x10 | 0x20 | 0x30;

export interface ReceiptLine {
  text: string;
  align?: EscPosAlign;
  font?: EscPosFontMode;
}

const LINE_WIDTH = 32;
const DEFAULT_ENCODING = 'utf-8';

export function renderReceiptToEscPosHex(receipt: ReceiptData): string {
  const merchantName = receipt.merchantName?.trim() || 'Payrix Merchant';
  const timestamp = receipt.timestamp?.trim() || new Date().toISOString();
  const transactionId = receipt.transactionId?.trim() || '-';
  const status = receipt.status?.trim() || '-';
  const approvalCode = receipt.approvalCode?.trim() || '-';
  const cardLine = formatCardLine(receipt.cardType, receipt.last4);
  const subTotal = receipt.subTotalAmount?.trim() || receipt.transactionAmount?.trim() || '0.00';
  const tip = receipt.tipAmount?.trim();
  const total = receipt.transactionAmount?.trim() || '0.00';

  const lines: ReceiptLine[] = [
    { text: merchantName, align: 1, font: 0x30 },
    { text: '-'.repeat(LINE_WIDTH), align: 0, font: 0x00 },
    { text: 'SALE RECEIPT', align: 0, font: 0x00 },
    { text: `Transaction ID: ${transactionId}`, align: 0, font: 0x00 },
    { text: `Status: ${status}`, align: 0, font: 0x00 },
    { text: `Card: ${cardLine}`, align: 0, font: 0x00 },
    { text: `Approval: ${approvalCode}`, align: 0, font: 0x00 },
    { text: '-'.repeat(LINE_WIDTH), align: 0, font: 0x00 },
    { text: formatAmountLine('Subtotal', subTotal), align: 0, font: 0x00 },
  ];

  if (tip && tip.length > 0) {
    lines.push({ text: formatAmountLine('Tip', tip), align: 0, font: 0x00 });
  }

  lines.push(
    { text: formatAmountLine('TOTAL', total), align: 0, font: 0x30 },
    { text: '-'.repeat(LINE_WIDTH), align: 0, font: 0x00 },
    { text: 'Thank you!', align: 1, font: 0x00 },
    { text: timestamp, align: 1, font: 0x00 },
  );

  return renderEscPosLinesToHex(lines);
}

export function renderEscPosLinesToHex(lines: ReceiptLine[]): string {
  const bytes = encodeEscPosLines(lines);
  bytes.push(LINE_FEED);
  bytes.push(GS, 0x56, 0x01);

  return toHexString(bytes);
}

export function encodeEscPosLines(lines: ReceiptLine[]): number[] {
  const bytes: number[] = [];

  for (const line of lines) {
    const alignment = line.align ?? 0;
    const font = line.font ?? 0x00;
    bytes.push(ESC, 0x61, alignment);
    bytes.push(ESC, 0x21, font);
    bytes.push(...encodeText(line.text));
    bytes.push(LINE_FEED);
  }

  return bytes;
}

export function encodeText(text: string): number[] {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(text));
}

export function formatAmountLine(label: string, value: string): string {
  const left = `${label}:`;
  const minPadding = 1;
  const right = value;

  if (left.length + right.length + minPadding >= LINE_WIDTH) {
    return `${left} ${right}`;
  }

  return `${left}${' '.repeat(LINE_WIDTH - left.length - right.length)}${right}`;
}

export function formatCardLine(cardType: string | undefined, last4?: string): string {
  const normalizedCardType = cardType?.trim() || 'CARD';
  if (!last4) {
    return normalizedCardType;
  }

  return `${normalizedCardType} ****${last4}`.trim();
}

function toHexString(bytes: number[]): string {
  return bytes
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export function toUtf8Hex(text: string): string {
  return encodeText(text)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export function padRight(value: string, totalWidth: number, paddingChar = ' '): string {
  if (value.length >= totalWidth) {
    return value;
  }

  return value + paddingChar.repeat(totalWidth - value.length);
}

export function leftAlign(value: string, width: number): string {
  return padRight(value, width);
}

export function alignCenter(value: string, width: number): string {
  if (value.length >= width) {
    return value;
  }

  const leftPadding = Math.floor((width - value.length) / 2);
  const rightPadding = width - value.length - leftPadding;

  return `${' '.repeat(leftPadding)}${value}${' '.repeat(rightPadding)}`;
}

export function normalizeLineWidth(value: string, width = LINE_WIDTH): string {
  return leftAlign(value, width);
}

export { DEFAULT_ENCODING };
