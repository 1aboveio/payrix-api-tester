import type { PrinterService, PrinterStatus, ReceiptData, SunmiPrinterBridge } from './types';

const STATUS_MAP: Record<number, string> = {
  1: 'ready',
  2: 'preparing',
  3: 'communication-error',
  4: 'no-paper',
  5: 'overheated',
  6: 'cover-open',
  7: 'cutter-error',
  8: 'cutter-recovered',
  9: 'black-mark-not-detected',
  505: 'not-detected',
  507: 'updating-firmware',
};

export class SunmiPrinter implements PrinterService {
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean(window.sunmi?.printer);
  }

  isAvailable(): boolean {
    return SunmiPrinter.isAvailable();
  }

  async getStatus(): Promise<PrinterStatus> {
    if (!this.isAvailable()) {
      return { available: false, status: 'unavailable' };
    }

    try {
      const printer = this.getPrinter();
      const statusRaw = await this.callBridge((done) => printer.getStatus(done), 'get status', 1000);
      const infoRaw = printer.getInfo ? await this.callBridge((done) => printer.getInfo?.(done), 'get info', 1000) : undefined;

      return {
        available: true,
        status: this.mapStatus(statusRaw),
        model: this.extractModel(infoRaw),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      return { available: false, status: message };
    }
  }

  async printReceipt(data: ReceiptData): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Sunmi printer is not available on this device.');
    }

    const printer = this.getPrinter();
    const merchantName = data.merchantName ?? 'Payrix Merchant';
    const divider = `${'-'.repeat(32)}\n`;
    const transactionId = data.transactionId ?? '-';
    const status = data.status ?? '-';
    const card = `${data.cardType ?? 'CARD'} ${data.last4 ? `****${data.last4}` : ''}`.trim();
    const approval = data.approvalCode ?? '-';
    const subtotal = data.subTotalAmount ?? data.transactionAmount ?? '-';
    const tip = data.tipAmount;
    const total = data.transactionAmount ?? '-';
    const timestamp = data.timestamp ?? new Date().toISOString();

    try {
      await this.setAlignment(1);
      await this.setBold(true);
      await this.setFontSize(32);
      await this.printText(`${merchantName}\n`);
      await this.setFontSize(24);
      await this.setBold(false);
      await this.printText(divider);

      await this.setAlignment(0);
      await this.printText(`Transaction ID: ${transactionId}\n`);
      await this.printText(`Status: ${status}\n`);
      await this.printText(`Card: ${card}\n`);
      await this.printText(`Approval: ${approval}\n`);
      await this.printText(divider);

      await this.setAlignment(2);
      await this.printText(`${this.formatAmountLine('Subtotal', subtotal)}\n`);
      if (tip && tip.trim() !== '') {
        await this.printText(`${this.formatAmountLine('Tip', tip)}\n`);
      }
      await this.setBold(true);
      await this.printText(`${this.formatAmountLine('TOTAL', total)}\n`);
      await this.setBold(false);
      await this.setAlignment(1);
      await this.printText(divider);
      await this.printText('Thank you!\n');
      if (transactionId !== '-') {
        await this.printQRCode(transactionId, 6, 2);
      }
      await this.printText(`\n${timestamp}\n`);
      await this.lineWrap(3);
      await this.autoOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new Error(`Failed to print receipt on Sunmi printer: ${message}`);
    }
  }

  async testPrint(): Promise<void> {
    const status = await this.getStatus();
    if (!status.available) {
      throw new Error(`Sunmi printer unavailable: ${status.status ?? 'unknown'}`);
    }

    const printer = this.getPrinter();
    const infoRaw = printer.getInfo ? await this.callBridge((done) => printer.getInfo?.(done), 'get info', 1000) : undefined;
    const model = status.model ?? this.extractModel(infoRaw) ?? 'Unknown model';
    const time = new Date().toISOString();

    try {
      await this.setAlignment(1);
      await this.setBold(true);
      await this.printText('Sunmi Test Print\n');
      await this.setBold(false);
      await this.printText(`${'-'.repeat(32)}\n`);
      await this.setAlignment(0);
      await this.printText(`Model: ${model}\n`);
      await this.printText(`Status: ${status.status ?? 'ready'}\n`);
      await this.printText(`Time: ${time}\n`);
      await this.lineWrap(2);
      await this.autoOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new Error(`Failed to print Sunmi test receipt: ${message}`);
    }
  }

  private getPrinter(): SunmiPrinterBridge {
    const printer = window.sunmi?.printer;
    if (!printer) {
      throw new Error('Sunmi JS bridge is not available.');
    }
    return printer;
  }

  private callBridge(
    action: (callback: (result?: unknown) => void) => unknown,
    description: string,
    timeoutMs = 1500
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      let completed = false;
      const timer = window.setTimeout(() => {
        if (!completed) {
          completed = true;
          reject(new Error(`${description}: timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      const done = (result?: unknown): void => {
        if (completed) {
          return;
        }
        completed = true;
        window.clearTimeout(timer);
        if (this.isBridgeError(result)) {
          reject(new Error(`${description}: ${this.toErrorMessage(result)}`));
          return;
        }
        resolve(result);
      };

      try {
        const immediate = action(done);
        if (typeof immediate !== 'undefined') {
          done(immediate);
        }
      } catch (error) {
        window.clearTimeout(timer);
        const message = error instanceof Error ? error.message : 'unknown error';
        reject(new Error(`${description}: ${message}`));
      }
    });
  }

  private async setAlignment(alignment: 0 | 1 | 2): Promise<void> {
    const printer = this.getPrinter();
    await this.callBridge((done) => printer.setAlignment(alignment, done), 'set alignment');
  }

  private async setBold(enabled: boolean): Promise<void> {
    const printer = this.getPrinter();
    if (!printer.setTextStyle) {
      return;
    }
    await this.callBridge((done) => printer.setTextStyle?.(enabled, done), 'set text style');
  }

  private async setFontSize(size: number): Promise<void> {
    const printer = this.getPrinter();
    if (!printer.setFontSize) {
      return;
    }
    await this.callBridge((done) => printer.setFontSize?.(size, done), 'set font size');
  }

  private async printText(text: string): Promise<void> {
    const printer = this.getPrinter();
    await this.callBridge((done) => printer.printText(text, done), 'print text');
  }

  private async printQRCode(data: string, moduleSize: number, errorLevel: number): Promise<void> {
    const printer = this.getPrinter();
    await this.callBridge((done) => printer.printQRCode(data, moduleSize, errorLevel, done), 'print QR code');
  }

  private async lineWrap(lines: number): Promise<void> {
    const printer = this.getPrinter();
    await this.callBridge((done) => printer.lineWrap(lines, done), 'line wrap');
  }

  private async autoOut(): Promise<void> {
    const printer = this.getPrinter();
    await this.callBridge((done) => printer.autoOut(done), 'auto out');
  }

  private mapStatus(raw: unknown): string | undefined {
    if (typeof raw === 'number') {
      return STATUS_MAP[raw] ?? `code-${raw}`;
    }

    if (typeof raw === 'string') {
      return raw.trim() || undefined;
    }

    if (raw && typeof raw === 'object') {
      const record = raw as Record<string, unknown>;
      if (typeof record.status === 'string' && record.status.trim() !== '') {
        return record.status;
      }
      if (typeof record.code === 'number') {
        return STATUS_MAP[record.code] ?? `code-${record.code}`;
      }
      if (typeof record.state === 'string' && record.state.trim() !== '') {
        return record.state;
      }
    }

    return 'ready';
  }

  private extractModel(raw: unknown): string | undefined {
    if (typeof raw === 'string') {
      return raw.trim() || undefined;
    }

    if (raw && typeof raw === 'object') {
      const record = raw as Record<string, unknown>;
      const candidate = record.model ?? record.deviceModel ?? record.printerModel ?? record.name;
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        return candidate;
      }
    }

    return undefined;
  }

  private isBridgeError(result: unknown): boolean {
    if (!result || typeof result !== 'object') {
      return false;
    }

    const record = result as Record<string, unknown>;
    if (record.success === false) {
      return true;
    }

    const error = record.error;
    return typeof error === 'string' && error.trim() !== '';
  }

  private toErrorMessage(result: unknown): string {
    if (!result || typeof result !== 'object') {
      return 'unknown bridge error';
    }

    const record = result as Record<string, unknown>;
    if (typeof record.error === 'string' && record.error.trim() !== '') {
      return record.error;
    }
    if (typeof record.message === 'string' && record.message.trim() !== '') {
      return record.message;
    }

    return 'unknown bridge error';
  }

  private formatAmountLine(label: string, amount: string): string {
    const line = `${label}: ${amount}`;
    return line.length >= 32 ? line : line.padStart(32);
  }
}
