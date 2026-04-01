# Payrix 前端存卡（Tokenization）与 PayFields 集成

本文档记录通过 Payrix Platform API 实现前端安全存卡的完整流程，基于实际 API 测试验证。

---

## 概述

用户支付卡信息不应由商户服务器直接接触，Payrix 提供两种方式实现前端 Tokenization：

| 方式 | 说明 | 开发量 |
|------|------|--------|
| **PayFields/PayFrame** | Payrix JS SDK，在商户页面嵌入安全 iframe | 中等 |
| **Invoice 支付页面** | Payrix hosted 页面，零代码 | 零 |

---

## 方式 1：PayFields 集成（推荐用于自定义 UI）

### 安全模型

```
APIKEY（公开）+ txnSessionKey（临时）= 前端安全调用

- APIKEY: 暴露在前端 JS 中，本身不足以完成敏感操作
- txnSessionKey: 后端生成，有时间和次数限制，防止 bot 滥用
- 卡号: 仅在 Payrix iframe/API 中传输，商户服务器不接触
```

### 完整流程

```
后端                                 前端
  │                                   │
  │ 1. POST /txnSessions ──────→     │
  │    返回 txnSessionKey             │
  │                                   │ 2. 初始化 PayFields SDK
  │                                   │    PayFields.init(apiKey, txnSessionKey)
  │                                   │
  │                                   │ 3. 用户在 iframe 中输入卡号
  │                                   │
  │                                   │ 4. POST /tokens
  │                                   │    Header: APIKEY + txnSessionKey
  │                                   │    → 返回 token hash
  │                                   │
  │ 5. 前端回传 token hash ←────     │
  │                                   │
  │ 6. POST /subscriptionTokens       │
  │    绑定 token 到 subscription     │
```

---

### Step 1 — 后端创建 txnSession

**POST `/txnSessions`**

```bash
curl -X POST 'https://test-api.payrix.com/txnSessions' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "login": "t1_log_xxxx",
    "merchant": "t1_mer_xxxx",
    "configurations": {
      "duration": 30,
      "maxTimesApproved": 1,
      "maxTimesUse": 3
    }
  }'
```

**响应：**
```json
{
  "id": "t1_tss_69cbebedaac856b4b45c478",
  "key": "926460d63e0e32bed152b90970ebab47",
  "status": "created",
  "durationAvailable": 30,
  "timesUsed": 0,
  "timesApproved": 0
}
```

**配置说明：**

| 字段 | 说明 |
|------|------|
| `duration` | session 有效分钟数，过期后自动失效 |
| `maxTimesApproved` | 最多允许几次成功交易/tokenization |
| `maxTimesUse` | 最多允许几次请求（含失败） |

---

### Step 2 — 前端创建 Token（存卡）

**POST `/tokens`**

前端携带 `APIKEY` + `txnSessionKey` 两个 header。

`customer` 字段是**必填**的，但支持三种传法——这解决了"新用户首次付款时没有 customer ID"的问题。

#### 模式 A：引用已有 Customer（回头客）

```bash
curl -X POST 'https://test-api.payrix.com/tokens' \
  -H 'APIKEY: {apiKey}' \
  -H 'txnSessionKey: {sessionKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "customer": "t1_cus_xxxx",
    "payment": {
      "method": 2,
      "number": "4111111111111111"
    },
    "expiration": "1228",
    "inactive": 0,
    "frozen": 0
  }'
```

#### 模式 B：嵌套创建 Customer + Token（新客户首次付款，推荐）

用户从 invoice 邮件链接打开付款页面时，没有 customer ID。传入 object 即可同时创建 customer 和 token：

```bash
curl -X POST 'https://test-api.payrix.com/tokens' \
  -H 'APIKEY: {apiKey}' \
  -H 'txnSessionKey: {sessionKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "customer": {
      "login": "t1_log_xxxx",
      "merchant": "t1_mer_xxxx",
      "first": "John",
      "last": "Doe",
      "email": "john@example.com"
    },
    "payment": {
      "method": 2,
      "number": "4111111111111111"
    },
    "expiration": "1230",
    "inactive": 0,
    "frozen": 0
  }'
```

**响应同时返回新创建的 customer 和 token：**
```json
{
  "id": "t1_tok_69cc091c1ffc9ae4d7a146c",
  "token": "8bd54ff53a8bbde8088faf1392783d86",
  "status": "ready",
  "customer": {
    "id": "t1_cus_69cc091c215fc7aa3bf4f7c",
    "first": "John",
    "last": "Doe",
    "email": "john@example.com"
  },
  "payment": { "number": "1111", "bin": "411111", "method": 2 }
}
```

#### 模式 C：仅邮箱创建 Customer（最小信息）

仅知道邮箱时（如 invoice 的 `emails` 字段）：

```bash
curl -X POST 'https://test-api.payrix.com/tokens' \
  -H 'APIKEY: {apiKey}' \
  -H 'txnSessionKey: {sessionKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "customer": {
      "login": "t1_log_xxxx",
      "merchant": "t1_mer_xxxx",
      "email": "customer@example.com"
    },
    "payment": {
      "method": 2,
      "number": "4000000000000002"
    },
    "expiration": "1230",
    "inactive": 0,
    "frozen": 0
  }'
```

> `first`/`last` 不传也能成功创建。

#### `customer` 字段传法汇总

| 方式 | `customer` 值 | 场景 |
|------|---------------|------|
| 引用已有 | `"t1_cus_xxx"` (string) | 回头客，已有 customer ID |
| 嵌套完整创建 | `{ login, merchant, first, last, email }` (object) | 新客户首次付款 |
| 嵌套最小创建 | `{ login, merchant, email }` (object) | 仅知道邮箱 |
| 不传 | ❌ 报错 `no_such_record` | 不允许 |

> 完整卡号不存储，响应仅返回后四位。

**其他字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `customer` | ✅ | Customer ID (string) 或 Customer 对象 (nested create) |
| `payment.method` | ✅ | `2` = 信用卡 |
| `payment.number` | ✅ | 完整卡号（仅在创建时传输） |
| `expiration` | | 格式 `MMYY`，如 `1228` |
| `name` | | Token 备注名 |
| `inactive` | ✅ | `0` = 激活 |
| `frozen` | ✅ | `0` = 未冻结 |
| `status` | ❌ | **不可设置**，自动为 `ready` |

#### 典型 Invoice 支付流程

```
1. 商户创建 invoice → 发送邮件链接
2. 用户打开链接 → PayFields 页面
3. 用户输入卡号 + 姓名 + 邮箱
4. 前端 POST /tokens（模式 B nested create）
   → 同时创建 customer + token
5. 后端拿到 token hash + customer ID
   → POST /subscriptionTokens 绑定自动扣款
   → 或 POST /txns 直接扣款
```

---

### Step 3 — 后端绑定 Token 到 Subscription

**POST `/subscriptionTokens`**

```bash
curl -X POST 'https://test-api.payrix.com/subscriptionTokens' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "subscription": "t1_sbn_xxxx",
    "token": "589cb25053ee90c2c18890c0a88f41ee"
  }'
```

> **关键：** `token` 字段用 **raw hash**（`589cb250...`），不是 resource ID（`t1_tok_...`）。

---

### ACH Token（银行账户存储）

除信用卡外，也可以 tokenize 银行账户用于 ACH direct debit：

```bash
curl -X POST 'https://test-api.payrix.com/tokens' \
  -H 'APIKEY: {apiKey}' \
  -H 'txnSessionKey: {sessionKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "customer": {
      "login": "t1_log_xxxx",
      "merchant": "t1_mer_xxxx",
      "email": "customer@example.com"
    },
    "payment": {
      "method": 8,
      "number": "123456789",
      "routing": "021000021"
    },
    "inactive": 0,
    "frozen": 0
  }'
```

**信用卡 vs ACH Token 区别：**

| 字段 | 信用卡 | ACH |
|------|--------|-----|
| `payment.method` | `2` | `8`(checking) / `9`(savings) / `10`(corpChecking) / `11`(corpSavings) |
| `payment.number` | 卡号 | 银行账号 |
| `payment.routing` | 不需要 | ✅ 必填（银行路由号） |
| `expiration` | ✅ MMYY | 不需要 |
| 交易 type | `1`(Sale) / `2`(Auth) | `7`(eCheck Sale) |

---

### 或：用 Token 直接发起交易

**POST `/txns`**

```bash
curl -X POST 'https://test-api.payrix.com/txns' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "merchant": "t1_mer_xxxx",
    "token": "589cb25053ee90c2c18890c0a88f41ee",
    "type": 1,
    "total": 2900,
    "origin": 2,
    ...
  }'
```

---

## 方式 2：Invoice 支付页面（零代码）

不需要集成任何 SDK，直接发送 invoice 支付链接：

```
https://test-portal.payrix.com/invoices/pay/{invoice.id}
```

Payrix hosted 页面自带：
- 卡号输入框（PCI 合规）
- 多种支付方式（由 `allowedPaymentMethods` 控制）
- 账单详情展示

适用于不需要自定义 UI 的场景。

---

## 前端 PayFields JS SDK 集成示例

```html
<!-- 引入 PayFields SDK -->
<script src="https://test-api.payrix.com/payfieldsjs"></script>

<form id="payment-form">
  <!-- PayFields 自动将这些 div 替换为安全 iframe -->
  <div id="payFields-ccnumber"></div>
  <div id="payFields-ccexp"></div>
  <div id="payFields-cvv"></div>
  <button type="submit">Save Card</button>
</form>

<script>
  // 后端传入的 session key
  PayFields.config.apiKey = '{apiKey}';
  PayFields.config.txnSessionKey = '{txnSessionKey}';
  PayFields.config.merchant = '{merchantId}';

  // 仅 tokenize，不发起交易
  PayFields.config.mode = 'token';
  PayFields.config.customer = '{customerId}';

  PayFields.onSuccess = function(response) {
    // response.token = raw token hash
    // 发送到后端绑定 subscription
    console.log('Token:', response.token);
  };

  PayFields.onFailure = function(response) {
    console.error('Failed:', response);
  };
</script>
```

> 注意：以上 JS SDK 示例为典型 PayFields 集成模式，具体 API 以 Payrix 官方文档为准。SDK URL 在测试环境为 `test-api.payrix.com/payfieldsjs`。

---

## 实测验证结果

| 测试 | 结果 |
|------|------|
| `POST /txnSessions` 创建 session key | ✅ |
| 仅 txnSessionKey（无 APIKEY）创建 token | ❌ `invalid_auth` |
| APIKEY + txnSessionKey 创建 token | ✅ |
| Token `status` 手动设置 | ❌ `field_restricted`，自动为 `ready` |
| txnSession duration/maxTimes 配置 | ✅ 正常生效 |
| Token 不传 `customer` | ❌ 报 `no_such_record`，customer 必填 |
| Token `customer` 传 object（nested create） | ✅ 同时创建 customer + token |
| Token `customer` 仅传 email（最小创建） | ✅ first/last 可省略 |

---

## API 调用中发现的问题

| 问题 | 说明 |
|------|------|
| 仅 txnSessionKey 不足 | 必须同时携带 APIKEY，txnSessionKey 只是附加安全层 |
| Token `status` 不可设置 | 自动为 `ready`，传入报 `field_restricted` |
| `payment.method` 需匹配卡 BIN | Visa=2, 卡号与 method 不匹配报 `txn_type_payment_method_mismatch` |
| `subscriptionTokens.token` 用 hash | 传 `t1_tok_...` resource ID 报 `no_such_record` |
| `customer` 必填但支持 nested create | 传 object 可同时创建 customer，解决新用户无 ID 问题 |

---

## Endpoint 汇总

| 操作 | Method | Endpoint | 调用方 |
|------|--------|----------|--------|
| 创建 txnSession | POST | `/txnSessions` | 后端 |
| 查询 txnSession | GET | `/txnSessions/{id}` | 后端 |
| 创建 Token（存卡） | POST | `/tokens` | 前端（APIKEY + txnSessionKey） |
| 查询 Token | GET | `/tokens/{id}` | 后端 |
| 绑定 Token 到 Subscription | POST | `/subscriptionTokens` | 后端 |
| 用 Token 发起交易 | POST | `/txns` | 后端 |

---

## 环境信息

| 环境 | API / SDK | 支付页面 |
|------|-----------|---------|
| 测试 | `https://test-api.payrix.com` | `https://test-portal.payrix.com/invoices/pay/{id}` |
| 生产 | `https://api.payrix.com` | `https://portal.payrix.com/invoices/pay/{id}` |
