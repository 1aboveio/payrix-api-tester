import { BrowserPrinter } from './browser';
import { SunmiPrinter } from './sunmi';

import type { PrinterService } from './types';

export function getPrinterService(): PrinterService {
  if (SunmiPrinter.isAvailable()) {
    return new SunmiPrinter();
  }

  return new BrowserPrinter();
}

export * from './browser';
export * from './receipt-formatter';
export * from './sunmi';
export * from './types';
