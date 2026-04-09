import { PrinterService, PrinterStatus, ReceiptData } from './types';

export class BrowserPrinter implements PrinterService {
  static isAvailable(): boolean {
    return typeof window !== 'undefined';
  }

  isAvailable(): boolean {
    return BrowserPrinter.isAvailable();
  }

  async getStatus(): Promise<PrinterStatus> {
    return { available: true, status: 'ready' };
  }

  async printReceipt(data: ReceiptData): Promise<void> {
    const formatAmount = (amount?: string) => {
      if (!amount) return '$0.00';
      const num = parseFloat(amount);
      return `$${num.toFixed(2)}`;
    };

    const merchantName = data.merchantName ?? 'Payrix Merchant';
    const timestamp = data.timestamp
      ? new Date(data.timestamp).toLocaleString()
      : new Date().toLocaleString();

    const subtotal = formatAmount(data.subTotalAmount);
    const tip = formatAmount(data.tipAmount);
    const total = formatAmount(data.transactionAmount);

    const receiptContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      max-width: 300px;
      margin: 0 auto;
      padding: 20px;
    }
    .center { text-align: center; }
    .line { border-top: 1px dashed #000; margin: 10px 0; }
    .row { display: flex; justify-content: space-between; }
    .total { font-weight: bold; font-size: 16px; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="center">
    <h2>${merchantName}</h2>
  </div>
  <div class="line"></div>
  <p><strong>Transaction ID:</strong> ${data.transactionId ?? 'N/A'}</p>
  <p><strong>Status:</strong> ${data.status ?? 'Unknown'}</p>
  <p><strong>Card:</strong> ${data.cardType ?? 'N/A'} ****${data.last4 ?? '****'}</p>
  ${data.approvalCode ? `<p><strong>Approval:</strong> ${data.approvalCode}</p>` : ''}
  <div class="line"></div>
  <div class="row"><span>Subtotal:</span><span>${subtotal}</span></div>
  <div class="row"><span>Tip:</span><span>${tip}</span></div>
  <div class="row total"><span>TOTAL:</span><span>${total}</span></div>
  <div class="line"></div>
  <div class="center">
    <p>Thank you!</p>
    <p>${timestamp}</p>
  </div>
  <div class="no-print" style="margin-top: 20px; text-align: center;">
    <button onclick="window.print()">Print Receipt</button>
  </div>
</body>
</html>
    `.trim();

    // Open receipt in new window
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      throw new Error('Failed to open print window. Please allow popups.');
    }

    printWindow.document.write(receiptContent);
    printWindow.document.close();

    // Auto-trigger print after a short delay to allow rendering
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  }

  async testPrint(): Promise<void> {
    const testContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Print</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      max-width: 300px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
    }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h2>=== PRINTER TEST ===</h2>
  <p>Printer is working correctly!</p>
  <p>Transaction printing ready.</p>
  <div class="no-print" style="margin-top: 20px;">
    <button onclick="window.print()">Print Test</button>
  </div>
</body>
</html>
    `.trim();

    const printWindow = window.open('', '_blank', 'width=400,height=400');
    if (!printWindow) {
      throw new Error('Failed to open print window. Please allow popups.');
    }

    printWindow.document.write(testContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  }
}
