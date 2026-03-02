/**
 * Printer service types and interfaces
 * Stub implementation - PR 1 will provide actual SunmiPrinter implementation
 */

export interface PrinterStatus {
  available: boolean;
  status?: string;
  error?: string;
}

export interface PrinterReceiptData {
  transactionId: string;
  status: string;
  cardType?: string;
  last4?: string;
  approvalCode?: string;
  transactionAmount: string;
  subTotalAmount?: string;
  tipAmount?: string;
  merchantName?: string;
  laneId?: string;
  timestamp?: string;
}

export interface PrinterService {
  /** Check if printer is available and get status */
  getStatus(): Promise<PrinterStatus>;
  /** Print a receipt from sale response data */
  printReceipt(data: PrinterReceiptData): Promise<void>;
  /** Check if this printer implementation is available in current environment */
  isAvailable(): boolean;
}

/** Factory function to get the appropriate printer service */
export function getPrinterService(): PrinterService {
  // For now, return a stub that always returns unavailable
  // PR 1 will implement SunmiPrinter and BrowserPrinter
  return new StubPrinterService();
}

/** Stub printer service for development until PR 1 is ready */
class StubPrinterService implements PrinterService {
  isAvailable(): boolean {
    return false;
  }

  async getStatus(): Promise<PrinterStatus> {
    return { available: false, status: 'stub' };
  }

  async printReceipt(_data: PrinterReceiptData): Promise<void> {
    console.log('[StubPrinter] Would print receipt:', _data);
    throw new Error('Printer not implemented yet');
  }
}
