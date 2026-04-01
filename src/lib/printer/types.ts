export interface PrinterStatus {
  available: boolean;
  status?: 'ready' | 'offline' | 'no-paper' | 'overheated' | 'unknown';
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

// Sunmi JS Bridge types
declare global {
  interface Window {
    sunmi?: {
      printer?: {
        printText: (text: string, callback: (result: { code: number; msg?: string }) => void) => void;
        setAlignment: (alignment: 0 | 1 | 2, callback: (result: { code: number; msg?: string }) => void) => void;
        printBarCode: (
          data: string,
          type: number,
          height: number,
          width: number,
          textPosition: number,
          callback: (result: { code: number; msg?: string }) => void
        ) => void;
        printQRCode: (
          data: string,
          moduleSize: number,
          errorLevel: number,
          callback: (result: { code: number; msg?: string }) => void
        ) => void;
        lineWrap: (lines: number, callback: (result: { code: number; msg?: string }) => void) => void;
        getStatus: (callback: (result: { code: number; data?: string }) => void) => void;
        getInfo: (callback: (result: { code: number; data?: { model?: string; firmware?: string } }) => void) => void;
      };
    };
  }
}
