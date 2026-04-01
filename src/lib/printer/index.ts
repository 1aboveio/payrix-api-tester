import { PrinterService } from './types';
import { SunmiPrinter } from './sunmi';
import { BrowserPrinter } from './browser';

export function getPrinterService(): PrinterService {
  if (SunmiPrinter.isAvailable()) {
    return new SunmiPrinter();
  }
  return new BrowserPrinter();
}

export * from './types';
export { SunmiPrinter } from './sunmi';
export { BrowserPrinter } from './browser';
