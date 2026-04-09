import { PrinterService, PrinterStatus, ReceiptData } from './types';

export class SunmiPrinter implements PrinterService {
  static isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return typeof window.sunmi?.printer !== 'undefined';
  }

  isAvailable(): boolean {
    return SunmiPrinter.isAvailable();
  }

  async getStatus(): Promise<PrinterStatus> {
    if (!this.isAvailable()) {
      return { available: false, status: 'unknown' };
    }

    return new Promise((resolve) => {
      window.sunmi!.printer!.getStatus((result) => {
        if (result.code !== 0) {
          resolve({ available: false, status: 'offline' });
          return;
        }

        const statusMap: Record<string, PrinterStatus['status']> = {
          '0': 'ready',
          '1': 'no-paper',
          '2': 'overheated',
          '3': 'offline',
        };

        resolve({
          available: result.data === '0',
          status: statusMap[result.data ?? ''] ?? 'unknown',
        });
      });
    });
  }

  async printReceipt(data: ReceiptData): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Sunmi printer not available');
    }

    const printer = window.sunmi!.printer!;

    // Helper to promisify callback-based methods
    const printCmd = (fn: (cb: (result: { code: number; msg?: string }) => void) => void): Promise<void> => {
      return new Promise((resolve, reject) => {
        fn((result) => {
          if (result.code !== 0) {
            reject(new Error(result.msg || `Printer error: ${result.code}`));
          } else {
            resolve();
          }
        });
      });
    };

    // Format amounts
    const formatAmount = (amount?: string) => {
      if (!amount) return '$0.00';
      const num = parseFloat(amount);
      return `$${num.toFixed(2)}`;
    };

    const merchantName = data.merchantName ?? 'Payrix Merchant';
    const timestamp = data.timestamp
      ? new Date(data.timestamp).toLocaleString()
      : new Date().toLocaleString();

    // Build receipt
    await printCmd((cb) => printer.setAlignment!(1, cb)); // Center
    await printCmd((cb) => printer.printText!(`${merchantName}\n`, cb));
    await printCmd((cb) => printer.printText!('================================\n', cb));

    await printCmd((cb) => printer.setAlignment!(0, cb)); // Left
    await printCmd((cb) => printer.printText!(`Transaction ID: ${data.transactionId ?? 'N/A'}\n`, cb));
    await printCmd((cb) => printer.printText!(`Status: ${data.status ?? 'Unknown'}\n`, cb));
    await printCmd((cb) => printer.printText!(`Card: ${data.cardType ?? 'N/A'} ****${data.last4 ?? '****'}\n`, cb));
    if (data.approvalCode) {
      await printCmd((cb) => printer.printText!(`Approval: ${data.approvalCode}\n`, cb));
    }

    await printCmd((cb) => printer.printText!('================================\n', cb));

    // Amounts
    const subtotal = formatAmount(data.subTotalAmount);
    const tip = formatAmount(data.tipAmount);
    const total = formatAmount(data.transactionAmount);

    await printCmd((cb) => printer.printText!(`Subtotal:${' '.repeat(20 - subtotal.length)}${subtotal}\n`, cb));
    await printCmd((cb) => printer.printText!(`Tip:${' '.repeat(25 - tip.length)}${tip}\n`, cb));
    await printCmd((cb) => printer.printText!(`TOTAL:${' '.repeat(23 - total.length)}${total}\n`, cb));

    await printCmd((cb) => printer.printText!('================================\n', cb));

    // Footer
    await printCmd((cb) => printer.setAlignment!(1, cb)); // Center
    await printCmd((cb) => printer.printText!('Thank you!\n', cb));

    // QR code with transaction ID
    const txnId = data.transactionId;
    if (txnId) {
      await printCmd((cb) => printer.printQRCode!(txnId, 6, 0, cb));
    }

    await printCmd((cb) => printer.printText!(`\n${timestamp}\n`, cb));
    await printCmd((cb) => printer.printText!('================================\n', cb));

    // Feed and cut
    await printCmd((cb) => printer.lineWrap!(3, cb));
  }

  async testPrint(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Sunmi printer not available');
    }

    const printer = window.sunmi!.printer!;

    const printCmd = (fn: (cb: (result: { code: number; msg?: string }) => void) => void): Promise<void> => {
      return new Promise((resolve, reject) => {
        fn((result) => {
          if (result.code !== 0) {
            reject(new Error(result.msg || `Printer error: ${result.code}`));
          } else {
            resolve();
          }
        });
      });
    };

    await printCmd((cb) => printer.setAlignment!(1, cb));
    await printCmd((cb) => printer.printText!('=== SUNMI PRINTER TEST ===\n', cb));
    await printCmd((cb) => printer.setAlignment!(0, cb));
    await printCmd((cb) => printer.printText!('Printer is working correctly!\n', cb));
    await printCmd((cb) => printer.printText!('Transaction printing ready.\n', cb));
    await printCmd((cb) => printer.lineWrap!(3, cb));
  }
}
