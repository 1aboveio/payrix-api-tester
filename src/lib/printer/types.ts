export interface PrinterStatus {
  available: boolean;
  status?: string;
  model?: string;
}

export interface ReceiptData {
  merchantName?: string;
  transactionId?: string;
  status?: string;
  approvalCode?: string;
  cardType?: string;
  last4?: string;
  transactionAmount?: string;
  subTotalAmount?: string;
  tipAmount?: string;
  timestamp?: string;
}

export interface PrinterService {
  isAvailable(): boolean;
  getStatus(): Promise<PrinterStatus>;
  printReceipt(data: ReceiptData): Promise<void>;
  testPrint(): Promise<void>;
}

type SunmiCallback = (result?: unknown) => void;

export interface SunmiPrinterBridge {
  printText(text: string, callback?: SunmiCallback): void;
  setAlignment(alignment: 0 | 1 | 2, callback?: SunmiCallback): void;
  printQRCode(data: string, moduleSize: number, errorLevel: number, callback?: SunmiCallback): void;
  lineWrap(lines: number, callback?: SunmiCallback): void;
  autoOut(callback?: SunmiCallback): void;
  getStatus(callback?: SunmiCallback): unknown;
  getInfo?(callback?: SunmiCallback): unknown;
  setTextStyle?(bold: boolean, callback?: SunmiCallback): void;
  setFontSize?(size: number, callback?: SunmiCallback): void;
}

export interface SunmiBridge {
  printer?: SunmiPrinterBridge;
}

declare global {
  interface Window {
    sunmi?: SunmiBridge;
  }
}

export {};
