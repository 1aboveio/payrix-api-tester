# Sunmi Cloud Printer V2 Integration Guide

Official docs: https://developer.sunmi.com/docs/zh-CN/cdixeghjk491/xffdeghjk524

## Prerequisites

1. Register a developer app on [Sunmi Developer Portal](https://developer.sunmi.com)
2. Enable the **Cloud Printing** (云打印) capability for the app
3. Ensure your printer SN is assigned to your app's channel (contact Sunmi sales if needed)

## Configuration

| Environment Variable | Description |
|---|---|
| `SUNMI_APP_ID` | App ID from Sunmi developer portal |
| `SUNMI_APP_KEY` | App secret key for HMAC signing |

## Common Information

### Base URL

```
https://openapi.sunmi.com
```

- HTTPS required (TLS 1.2 or 1.3)
- HTTP/1.1 only (HTTP/2 not supported)

### Authentication Headers

All requests require these headers:

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Sunmi-Appid` | Your `SUNMI_APP_ID` |
| `Sunmi-Timestamp` | 10-digit Unix timestamp |
| `Sunmi-Nonce` | 6-digit random number |
| `Sunmi-Sign` | HMAC-SHA256 signature |
| `Source` | `openapi` (fixed value) |

### Signing Algorithm

```
Sunmi-Sign = HMAC-SHA256(jsonBody + appId + timestamp + nonce, appKey)
```

**TypeScript example:**

```typescript
import { createHmac } from 'node:crypto';

function sign(jsonBody: string, appId: string, timestamp: string, nonce: string, appKey: string): string {
  const signStr = jsonBody + appId + timestamp + nonce;
  return createHmac('sha256', appKey).update(signStr).digest('hex');
}
```

### Response Format

All responses follow:

```json
{
  "code": 1,
  "msg": "success",
  "data": null
}
```

`code: 1` = success. Any other code is an error.

### Error Codes

| Code | Message | Description |
|---|---|---|
| `1` | success | Request successful |
| `10000` | success | Request successful (gateway) |
| `20000` | missing params | Gateway missing required parameters |
| `20001` | expired | Request timestamp expired |
| `30000` | auth failed | Invalid APPID or IP not whitelisted |
| `30001` | no permission | Cloud printing capability not enabled |
| `40000` | sign failed | Signature verification failed |
| `50000` | server error | Internal server error |
| `10071400` | parameter error | Check parameter types |
| `10071701` | device is unknown | Invalid SN |
| `10071702` | device is bound | Device already bound |
| `10071703` | binding exception | Device binding error |
| `10071704` | not belong to this channel | SN not assigned to your channel |
| `10071705` | order has been push | Duplicate trade_no |
| `10071706` | order is unknown | Unknown order |

---

## API Endpoints

### 1. Bind Printer to Shop

Associates a printer with a shop ID for device grouping.

```
POST /v2/printer/open/open/device/bindShop
```

**Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `sn` | string | Yes | Printer serial number |
| `shop_id` | integer | Yes | Your shop ID (int64). Used for grouping devices. Pass any value you manage. |

**Example:**

```json
{ "sn": "N501P58U10200", "shop_id": 1 }
```

**Response:**

```json
{ "code": 1, "msg": "success", "data": null }
```

> **Note:** `shop_id` is your own identifier for grouping printers. Sunmi stores whatever value you pass. If you don't have shops, pass `""` — but then device list queries will only return devices with empty `shop_id`.

---

### 2. Unbind Printer from Shop

```
POST /v2/printer/open/open/device/unbindShop
```

**Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `sn` | string | Yes | Printer serial number |
| `shop_id` | integer | Yes | Must match the shop_id used during binding |

**Example:**

```json
{ "sn": "N501P58U10200", "shop_id": 1 }
```

---

### 3. Query Device Online Status (Connection Status, SN, Device List)

Query a single device or list all devices with pagination.

```
POST /v2/printer/open/open/device/onlineStatus
```

**Body (single device):**

| Field | Type | Required | Description |
|---|---|---|---|
| `sn` | string | Yes* | Printer SN. Required if `page_no`/`page_size` omitted. |

```json
{ "sn": "N501P58U10200" }
```

**Body (list all devices):**

| Field | Type | Required | Description |
|---|---|---|---|
| `page_no` | integer | Yes* | Page number (default 1). Required if `sn` omitted. |
| `page_size` | integer | Yes* | Items per page (default 100). Required if `sn` omitted. |

```json
{ "page_no": 1, "page_size": 100 }
```

**Response:**

```json
{
  "code": 1,
  "msg": "success",
  "data": {
    "list": [
      { "sn": "N501P58U10200", "is_online": 1 }
    ],
    "page": {
      "total": 1,
      "page_no": 1,
      "page_size": 100
    }
  }
}
```

| Field | Description |
|---|---|
| `is_online` | `0` = offline, `1` = online |

---

### 4. Push Print Content (Direct Push Mode)

Send receipt content to a printer. Content is UTF-8 text encoded as a **hex string**, with optional ESC/POS commands embedded.

```
POST /v2/printer/open/open/device/pushContent
```

**Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `sn` | string | Yes | Printer serial number |
| `trade_no` | string | Yes | Unique order ID (max 32 chars). Must be unique per print job. |
| `content` | string | Yes | Print content as UTF-8 hex string (see encoding below) |
| `count` | integer | Yes | Number of copies to print |
| `order_type` | integer | No | 1=new order, 2=cancel, 3=rush, 4=refund, 5=other |
| `media_text` | string | No | TTS voice text (choose one of media_text or media_url) |
| `media_url` | string | No | Voice file URL (MP3/WAV, 16bit mono 8000Hz) |
| `cycle` | integer | No | Voice play count (999=infinite, default 1) |

**Content encoding (TypeScript):**

```typescript
// Build content with ESC/POS commands
const parts: Buffer[] = [];

// ESC/POS: Initialize printer
parts.push(Buffer.from([0x1b, 0x40]));
// ESC/POS: Center align
parts.push(Buffer.from([0x1b, 0x61, 0x01]));
// ESC/POS: Double height + width
parts.push(Buffer.from([0x1b, 0x21, 0x30]));
// UTF-8 text
parts.push(Buffer.from('MY STORE\n', 'utf-8'));
// ESC/POS: Normal size
parts.push(Buffer.from([0x1b, 0x21, 0x00]));
// ESC/POS: Left align
parts.push(Buffer.from([0x1b, 0x61, 0x00]));
parts.push(Buffer.from('Item 1        $10.00\n', 'utf-8'));
// ESC/POS: Cut paper
parts.push(Buffer.from([0x1d, 0x56, 0x42, 0x00]));

// Convert to hex string for the API
const contentHex = Buffer.concat(parts).toString('hex');
```

**Common ESC/POS commands:**

| Command (hex) | Description |
|---|---|
| `1b 40` | Initialize printer |
| `1b 61 00` | Left align |
| `1b 61 01` | Center align |
| `1b 61 02` | Right align |
| `1b 21 00` | Normal text size |
| `1b 21 10` | Double height |
| `1b 21 20` | Double width |
| `1b 21 30` | Double height + width |
| `1d 56 42 00` | Cut paper |
| `0a` | Line feed |

**Example request:**

```json
{
  "sn": "N501P58U10200",
  "trade_no": "order_20260330_001",
  "count": 1,
  "content": "1b401b61011b2130e58d97e59bbde8b685e5b8821b21000a"
}
```

**Response:**

```json
{
  "code": 1,
  "msg": "success",
  "data": { "trade_no": "order_20260330_001" }
}
```

---

### 5. Query Print Status

Check whether a print job was printed.

```
POST /v2/printer/open/open/ticket/printStatus
```

**Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `trade_no` | string | Yes | The order ID used when pushing content |

**Response:**

```json
{
  "code": 1,
  "msg": "success",
  "data": {
    "sn": "N501P58U10200",
    "is_print": 1,
    "print_time": 1639621476
  }
}
```

| Field | Description |
|---|---|
| `is_print` | `0` = not printed, `1` = printed, `2` = deleted |
| `print_time` | Unix timestamp of print (0 if not printed) |

---

### 6. Clear Print Queue

Clear all cached print jobs on the cloud for a device.

```
POST /v2/printer/open/open/device/clearPrintJob
```

**Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `sn` | string | Yes | Printer serial number |

---

## Supported Models

| Printer | Model | Min Firmware | Min App Version |
|---|---|---|---|
| 58mm receipt printer | NT21x | 2.4.0 | 2.6.0 |
| 80mm kitchen printer | NT31x | 2.7.0 | 2.19.0 |
| 80mm barcode printer | NT32x | 4.1.19 | 4.1.32 |

## Test Print Example (TypeScript)

Full working example:

```typescript
import { createHmac } from 'node:crypto';

const APP_ID = process.env.SUNMI_APP_ID!;
const APP_KEY = process.env.SUNMI_APP_KEY!;
const PRINTER_SN = process.env.SUNMI_PRINTER_SN!;
const BASE_URL = 'https://openapi.sunmi.com';

function sign(jsonBody: string, appId: string, ts: string, nonce: string, appKey: string): string {
  return createHmac('sha256', appKey).update(jsonBody + appId + ts + nonce).digest('hex');
}

async function callApi(path: string, body: Record<string, unknown>) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = Math.random().toString().slice(2, 8);
  const jsonBody = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sunmi-Appid': APP_ID,
      'Sunmi-Timestamp': ts,
      'Sunmi-Nonce': nonce,
      'Sunmi-Sign': sign(jsonBody, APP_ID, ts, nonce, APP_KEY),
      'Source': 'openapi',
    },
    body: jsonBody,
  });

  return res.json();
}

// Bind printer
await callApi('/v2/printer/open/open/device/bindShop', { sn: PRINTER_SN, shop_id: 1 });

// Print a receipt
const parts: Buffer[] = [];
parts.push(Buffer.from([0x1b, 0x40]));           // Init
parts.push(Buffer.from([0x1b, 0x61, 0x01]));     // Center
parts.push(Buffer.from([0x1b, 0x21, 0x30]));     // Large text
parts.push(Buffer.from('TEST PRINT\n', 'utf-8'));
parts.push(Buffer.from([0x1b, 0x21, 0x00]));     // Normal
parts.push(Buffer.from('================================\n', 'utf-8'));
parts.push(Buffer.from([0x1b, 0x61, 0x00]));     // Left align
parts.push(Buffer.from('Item 1              $10.00\n', 'utf-8'));
parts.push(Buffer.from('Item 2               $5.00\n', 'utf-8'));
parts.push(Buffer.from('================================\n', 'utf-8'));
parts.push(Buffer.from('TOTAL               $15.00\n', 'utf-8'));
parts.push(Buffer.from('\n\n\n'));
parts.push(Buffer.from([0x1d, 0x56, 0x42, 0x00])); // Cut

await callApi('/v2/printer/open/open/device/pushContent', {
  sn: PRINTER_SN,
  trade_no: 'test_' + Date.now(),
  count: 1,
  content: Buffer.concat(parts).toString('hex'),
});
```
