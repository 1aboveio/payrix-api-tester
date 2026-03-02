# Design: Sunmi Printer Integration

**Issue:** #15
**Author:** Alo
**Status:** Draft — awaiting review
**Date:** 2026-03-02

---

## Goal

Integrate Sunmi's built-in thermal printer with the payrix-api-tester so that after a successful triPOS sale, the user can print a receipt directly from the Sunmi device.

## Context

- **payrix-api-tester** is a Next.js 16 app (React 19, App Router)
- Sunmi devices (V2, V1s, etc.) have a built-in thermal printer accessible via a **JS Bridge** injected into the device's WebView
- The JS Bridge exposes `window.sunmi.printer` with methods for text printing, alignment, barcodes, QR codes, and paper control
- The app already has a `SaleResponse` type with all fields needed for a receipt

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Sale Page (existing)                           │
│  ┌───────────┐   ┌──────────────────────────┐   │
│  │ Sale Form │──▶│ ApiResultPanel            │   │
│  └───────────┘   │  + [Print Receipt] button │   │
│                  └──────────┬───────────────┘   │
│                             │                   │
│                             ▼                   │
│  ┌──────────────────────────────────────────┐   │
│  │ PrinterService (interface)               │   │
│  │  ├─ SunmiPrinter (JS Bridge)            │   │
│  │  └─ BrowserPrinter (window.print)       │   │
│  └──────────────────────────────────────────┘   │
│                             │                   │
│                             ▼                   │
│  ┌──────────────────────────────────────────┐   │
│  │ ReceiptFormatter                         │   │
│  │  SaleResponse → printer commands         │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Sunmi JS Bridge API

The Sunmi JS SDK is loaded via script tag and exposes `window.sunmi.printer`:

| Method | Description |
|--------|-------------|
| `printText(text, callback)` | Print text (use `\n` for line feed) |
| `setAlignment(0\|1\|2, cb)` | 0=left, 1=center, 2=right |
| `printBarCode(data, type, h, w, textPos, cb)` | Print barcode |
| `printQRCode(data, moduleSize, errorLevel, cb)` | Print QR code |
| `printTable(columns, cb)` | Print tabular data |
| `lineWrap(lines, cb)` | Feed blank lines |
| `getStatus()` | Returns printer status |
| `getInfo()` | Returns printer info (model, firmware) |
| `autoOut()` | Cut/feed paper out |

**SDK loading:** `<script src="https://developer.sunmi.com/h5sdk/printer.js" async />`

**Device detection:** Check `navigator.userAgent` for `/sunmi/i` or check `typeof window.sunmi !== 'undefined'` after SDK loads.

> **Note:** The exact SDK URL needs confirmation on a real device. The demo at `h5.sunmi.com/printer-sdk/demo.html` confirms the API shape. If the bridge is already injected by the device WebView, no script tag may be needed.

## File Plan

### New Files

**`src/lib/printer/types.ts`** — Shared printer types

```typescript
export interface PrinterStatus {
  available: boolean;
  status?: string;     // 'ready' | 'offline' | 'no-paper' | 'overheated'
  model?: string;
}

export interface PrinterService {
  isAvailable(): boolean;
  getStatus(): Promise<PrinterStatus>;
  printReceipt(data: ReceiptData): Promise<void>;
  testPrint(): Promise<void>;
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
```

**`src/lib/printer/sunmi.ts`** — Sunmi JS Bridge wrapper

- Implements `PrinterService`
- Wraps callback-based Sunmi API in Promises
- Checks `window.sunmi?.printer` for availability
- Handles error states (offline, no paper, overheated)

**`src/lib/printer/browser.ts`** — Browser print fallback

- Implements `PrinterService`
- Uses `window.print()` with print-specific CSS in a hidden iframe
- Always "available" on non-Sunmi devices

**`src/lib/printer/index.ts`** — Factory

```typescript
export function getPrinterService(): PrinterService {
  if (SunmiPrinter.isAvailable()) return new SunmiPrinter();
  return new BrowserPrinter();
}
```

**`src/lib/printer/receipt-formatter.ts`** — Maps SaleResponse → ReceiptData

```typescript
export function formatReceipt(
  sale: SaleResponse,
  config?: { merchantName?: string }
): ReceiptData {
  return {
    merchantName: config?.merchantName ?? 'Payrix Merchant',
    transactionId: sale.transactionId,
    status: sale.status,
    approvalCode: sale.approvalCode,
    cardType: sale.cardType,
    last4: sale.last4,
    transactionAmount: sale.transactionAmount,
    subTotalAmount: sale.subTotalAmount,
    tipAmount: sale.tipAmount,
    timestamp: new Date().toISOString(),
  };
}
```

**`src/components/printer/sunmi-sdk-loader.tsx`** — Dynamic SDK loader (client component)

**`src/components/printer/print-receipt-button.tsx`** — Reusable print button (client component)

### Modified Files

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Add `<SunmiSdkLoader />` in body |
| `src/app/transactions/sale/page.tsx` | Add `<PrintReceiptButton />` to quick actions |
| `src/app/settings/page.tsx` | Add printer settings section (status, test print, merchant name) |
| `src/lib/payrix/types.ts` | Add `Window` type augmentation for `window.sunmi` |

## Receipt Layout

```
================================
      Payrix Merchant
================================
Transaction ID: TXN-12345
Status: Approved
Card: VISA ****1234
Approval: 123456
================================
Subtotal:              $10.00
Tip:                    $2.00
TOTAL:                 $12.00
================================
        Thank you!
      [QR: TXN-12345]

2026-03-02 15:30:00
================================
```

## Implementation PRs

| PR | Scope | Owner | Depends On |
|----|-------|-------|------------|
| 1  | Printer service layer + types + receipt formatter | Alo | — |
| 2  | UI integration (button, SDK loader, settings) | Cory | PR 1 |
| 3  | Polish (branding, error UX, browser fallback refinement) | First to finish | PR 2 |

## Open Questions

1. **SDK URL** — `https://developer.sunmi.com/h5sdk/printer.js` is from the demo page. Needs verification on actual Sunmi hardware. The bridge may already be injected by the device WebView (no script tag needed).

2. **Test environment** — Do we have a physical Sunmi device? If not, we need a mock/console mode for development.

3. **Receipt customization** — Standard layout sufficient, or need logo/branding? (Sunmi supports bitmap printing for logos.)

4. **Auto-print** — Should we add a setting to auto-print after every successful sale?

## Edge Cases

- **No Sunmi device** → graceful fallback to browser print (never crashes)
- **Paper out / overheated** → check `getStatus()` before printing, show user-friendly toast
- **SDK load failure** → timeout after 5s, fall back to browser print
- **Type safety** → full TypeScript augmentation for `window.sunmi` bridge
