import type { PrinterService, PrinterStatus, ReceiptData } from './types';

const RECEIPT_WIDTH_PX = 302;

export class BrowserPrinter implements PrinterService {
  isAvailable(): boolean {
    return true;
  }

  async getStatus(): Promise<PrinterStatus> {
    return { available: true, status: 'ready' };
  }

  async printReceipt(data: ReceiptData): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Browser printing is only available in client-side environments.');
    }

    const html = this.buildReceiptPageHtml(data, 'Receipt');
    await this.printHtml(html);
  }

  async testPrint(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Browser printing is only available in client-side environments.');
    }

    const html = this.buildTestPageHtml();
    await this.printHtml(html);
  }

  private async printHtml(html: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';

      const cleanup = (): void => {
        window.setTimeout(() => {
          iframe.remove();
          resolve();
        }, 300);
      };

      iframe.onload = () => {
        const contentWindow = iframe.contentWindow;
        if (!contentWindow) {
          iframe.remove();
          reject(new Error('Failed to load print frame window.'));
          return;
        }

        contentWindow.focus();
        contentWindow.print();
        window.setTimeout(cleanup, 500);
      };

      iframe.onerror = () => {
        iframe.remove();
        reject(new Error('Failed to load printable content.'));
      };

      iframe.srcdoc = html;
      document.body.appendChild(iframe);
    });
  }

  private buildReceiptPageHtml(data: ReceiptData, title: string): string {
    const merchant = data.merchantName ?? 'Payrix Merchant';
    const transactionId = data.transactionId ?? '-';
    const status = data.status ?? '-';
    const approvalCode = data.approvalCode ?? '-';
    const card = `${data.cardType ?? 'CARD'} ${data.last4 ? `****${data.last4}` : ''}`.trim();
    const subtotal = data.subTotalAmount ?? data.transactionAmount ?? '-';
    const tip = data.tipAmount;
    const total = data.transactionAmount ?? '-';
    const timestamp = data.timestamp ?? new Date().toISOString();

    const amountRows = [
      this.amountLine('Subtotal', subtotal),
      tip && tip.trim() !== '' ? this.amountLine('Tip', tip) : '',
      this.amountLine('TOTAL', total, true),
    ]
      .filter((line) => line !== '')
      .join('');

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${this.escapeHtml(title)}</title>
  <style>
    @media print {
      body { margin: 0; }
    }
    body {
      margin: 0;
      padding: 16px;
      font-family: "Courier New", Courier, monospace;
      width: ${RECEIPT_WIDTH_PX}px;
      color: #000;
      background: #fff;
      font-size: 12px;
      line-height: 1.5;
    }
    .center { text-align: center; }
    .divider {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
    .bold { font-weight: 700; }
    .meta {
      margin-top: 8px;
      text-align: center;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="center bold">${this.escapeHtml(merchant)}</div>
  <div class="divider"></div>
  <div>Transaction ID: ${this.escapeHtml(transactionId)}</div>
  <div>Status: ${this.escapeHtml(status)}</div>
  <div>Card: ${this.escapeHtml(card)}</div>
  <div>Approval: ${this.escapeHtml(approvalCode)}</div>
  <div class="divider"></div>
  ${amountRows}
  <div class="divider"></div>
  <div class="center">Thank you!</div>
  <div class="center">QR: ${this.escapeHtml(transactionId)}</div>
  <div class="meta">${this.escapeHtml(timestamp)}</div>
</body>
</html>`;
  }

  private buildTestPageHtml(): string {
    const now = new Date().toISOString();
    return this.buildReceiptPageHtml(
      {
        merchantName: 'Payrix Merchant',
        transactionId: 'TEST-PRINT',
        status: 'approved',
        approvalCode: 'TEST01',
        cardType: 'VISA',
        last4: '0000',
        transactionAmount: '$0.00',
        subTotalAmount: '$0.00',
        tipAmount: '$0.00',
        timestamp: now,
      },
      'Test Print'
    );
  }

  private amountLine(label: string, value: string, bold = false): string {
    return `<div class="row ${bold ? 'bold' : ''}"><span>${this.escapeHtml(label)}</span><span>${this.escapeHtml(value)}</span></div>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
