# Payrix 交易（Txn）API 流程

本文档记录通过 Payrix Platform API 进行交易创建、查询、退款等操作的完整流程。

---

## 概述

所有交易操作都通过同一个端点 `/txns`，通过 `type` 字段区分操作类型。退款、撤销等关联操作通过 `fortxn` 字段引用原始交易。

---

## 交易类型（type）

| type | 名称 | 说明 |
|------|------|------|
| `1` | Sale | 直接扣款（最常用） |
| `2` | Auth | 授权预留，不立即扣款 |
| `3` | Capture | 完成 Auth，实际扣款 |
| `4` | Reverse Auth | 撤销 Auth 或 Sale，释放预留金额 |
| `5` | Refund | 退款（全额或部分），需引用原始交易 |
| `7` | eCheck Sale | 电子支票扣款 |
| `8` | eCheck Refund | 电子支票退款 |
| `14` | Incremental Auth | 增量授权 |

---

## 交易状态（status）

| status | 说明 | 可执行操作 |
|--------|------|-----------|
| `0` | Pending | 处理中 |
| `1` | Approved | 已授权 | 可撤销 (type=4) |
| `2` | Failed | 失败 | — |
| `3` | Captured | 已捕获 | 可退款 (type=5) |
| `4` | Settled | 已清算 | 可退款 (type=5) |
| `5` | Returned | 已退款 | — |

> `refunded` 字段记录已退款金额（分），支持部分退款。

---

## Step 1 — 创建 Sale 交易

**POST `/txns`**

### 使用已保存 Token 付款

```bash
curl -X POST 'https://test-api.payrix.com/txns' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "merchant": "t1_mer_xxxx",
    "mid": "01170981",
    "token": "t1_tok_xxxx",
    "type": 1,
    "total": 2000,
    "tax": 100,
    "currency": "USD",
    "fundingCurrency": "USD",
    "origin": 2,
    "swiped": 0,
    "allowPartial": 0,
    "pin": 0,
    "signature": 0,
    "unattended": 0,
    "debtRepayment": 0,
    "authentication": null,
    "unauthReason": "customerCancelled",
    "fortxn": null,
    "description": "Coffee Order",
    "order": "INV-001"
  }'
# → response.data[0].id (t1_txn_...)
# → response.data[0].approved (实际授权金额)
# → response.data[0].status (1=Approved, 2=Failed)
```

### 使用原始卡号付款（PayFrame/PayFields 场景）

```bash
curl -X POST 'https://test-api.payrix.com/txns' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "merchant": "t1_mer_xxxx",
    "mid": "01170981",
    "payment": {
      "method": 2,
      "number": "4111111111111111",
      "last4": "1111"
    },
    "expiration": "1228",
    "type": 1,
    "total": 2000,
    "currency": "USD",
    "fundingCurrency": "USD",
    "origin": 2,
    "swiped": 0,
    "allowPartial": 0,
    "pin": 0,
    "signature": 0,
    "unattended": 0,
    "debtRepayment": 0,
    "authentication": null,
    "unauthReason": "customerCancelled",
    "fortxn": null
  }'
```

**必填字段说明：**

| 字段 | 说明 |
|------|------|
| `merchant` | merchant ID |
| `mid` | 处理器分配的 Merchant ID |
| `type` | 交易类型（见上表） |
| `total` | 总金额（分） |
| `currency` | 货币，如 `USD` |
| `fundingCurrency` | 入账货币，通常同 `currency` |
| `origin` | 来源：`1`=终端, `2`=eCommerce, `8`=PayFrame |
| `swiped` | 是否刷卡：`0`/`1` |
| `allowPartial` | 是否允许部分授权：`0`/`1` |
| `pin` | 是否 PIN 验证：`0`/`1` |
| `signature` | 是否签名：`0`/`1` |
| `unattended` | 是否无人值守终端：`0`/`1` |
| `debtRepayment` | 是否债务偿还：`0`/`1` |
| `authentication` | 3DS token（无则 `null`） |
| `unauthReason` | 撤销原因，默认 `customerCancelled` |
| `fortxn` | 关联原始交易 ID（新建时为 `null`） |
| `payment` 或 `token` | 二选一：卡对象或已保存 token ID |

**origin 可选值：**

| 值 | 说明 |
|----|------|
| `1` | 信用卡终端 |
| `2` | eCommerce |
| `3` | 邮件/电话订单 |
| `4` | Apple Pay |
| `8` | PayFrame |
| `12` | Invoice 支付 |

---

## Step 2 — Auth + Capture 两步流

**先授权（不扣款）：**

```bash
# type=2: Auth
curl -X POST 'https://test-api.payrix.com/txns' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "merchant": "t1_mer_xxxx",
    "mid": "01170981",
    "token": "t1_tok_xxxx",
    "type": 2,
    "total": 2000,
    "currency": "USD",
    "fundingCurrency": "USD",
    "origin": 2,
    "swiped": 0,
    "allowPartial": 0,
    "pin": 0,
    "signature": 0,
    "unattended": 0,
    "debtRepayment": 0,
    "authentication": null,
    "unauthReason": "customerCancelled",
    "fortxn": null
  }'
# → authTxnId
```

**再捕获（实际扣款）：**

```bash
# type=3: Capture，fortxn 引用 Auth 的 txn id
curl -X POST 'https://test-api.payrix.com/txns' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "merchant": "t1_mer_xxxx",
    "mid": "01170981",
    "token": "t1_tok_xxxx",
    "type": 3,
    "total": 2000,
    "currency": "USD",
    "fundingCurrency": "USD",
    "origin": 2,
    "swiped": 0,
    "allowPartial": 0,
    "pin": 0,
    "signature": 0,
    "unattended": 0,
    "debtRepayment": 0,
    "authentication": null,
    "unauthReason": "customerCancelled",
    "fortxn": "{authTxnId}"
  }'
```

---

## Step 3 — 退款

**全额退款：**

```bash
curl -X POST 'https://test-api.payrix.com/txns' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "merchant": "t1_mer_xxxx",
    "mid": "01170981",
    "token": "t1_tok_xxxx",
    "type": 5,
    "total": 2000,
    "currency": "USD",
    "fundingCurrency": "USD",
    "origin": 2,
    "swiped": 0,
    "allowPartial": 0,
    "pin": 0,
    "signature": 0,
    "unattended": 0,
    "debtRepayment": 0,
    "authentication": null,
    "unauthReason": "customerCancelled",
    "fortxn": "{originalTxnId}"
  }'
```

**部分退款：** 仅将 `total` 改为部分金额，其余不变。

> 退款条件：原始交易 `status` 必须为 `3`（Captured）或 `4`（Settled）。

---

## Step 4 — 撤销授权

适用于尚未扣款的 Auth（status=1）：

```bash
curl -X POST 'https://test-api.payrix.com/txns' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "merchant": "t1_mer_xxxx",
    "mid": "01170981",
    "token": "t1_tok_xxxx",
    "type": 4,
    "total": 2000,
    "currency": "USD",
    "fundingCurrency": "USD",
    "origin": 2,
    "swiped": 0,
    "allowPartial": 0,
    "pin": 0,
    "signature": 0,
    "unattended": 0,
    "debtRepayment": 0,
    "authentication": null,
    "unauthReason": "customerCancelled",
    "fortxn": "{authTxnId}"
  }'
```

---

## Step 5 — 查询交易

**查询单个交易：**

```bash
curl -X GET 'https://test-api.payrix.com/txns/{txnId}' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json'
```

**列表查询（含过滤）：**

```bash
# 按 merchant 查询
curl -X GET 'https://test-api.payrix.com/txns' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -H 'search[merchant][equals]: t1_mer_xxxx'

# 按类型查询 Sale
curl -X GET 'https://test-api.payrix.com/txns' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -H 'search[type][equals]: 1'

# 按状态查询已清算
curl -X GET 'https://test-api.payrix.com/txns' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -H 'search[status][equals]: 4'

# 时间范围查询
curl -X GET 'https://test-api.payrix.com/txns' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -H 'search[created][greater]: 2026-03-01 00:00:00'
```

**关键响应字段：**

| 字段 | 说明 |
|------|------|
| `id` | 交易 ID（`t1_txn_...`） |
| `type` | 交易类型 |
| `status` | 当前状态 |
| `total` | 请求金额（分） |
| `approved` | 实际授权金额（分） |
| `refunded` | 已退款金额（分） |
| `fortxn` | 关联的原始交易 ID |
| `payment` | 支付方式 ID（`t1_pmt_...`） |
| `token` | 关联 token ID（如使用 token 付款） |
| `tax` | 税额（分） |
| `authCode` | 授权码 |
| `captured` | 捕获时间 |
| `settled` | 清算时间 |

---

## txnSessions（可选：PayFrame 前端集成）

如果使用 Payrix PayFrame 进行前端卡号采集，需要先创建 txnSession 获取 session key：

```bash
curl -X POST 'https://test-api.payrix.com/txnSessions' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "login": "t1_log_xxxx",
    "merchant": "t1_mer_xxxx",
    "configurations": {
      "duration": 8,
      "maxTimesApproved": 1,
      "maxTimesUse": 1
    }
  }'
# → session key，用于 PayFrame 前端加密传输卡号
```

---

## Endpoint 汇总

| 操作 | Method | Endpoint |
|------|--------|----------|
| 创建交易（Sale/Auth/Refund 等） | POST | `/txns` |
| 查询单个交易 | GET | `/txns/{id}` |
| 查询交易列表 | GET | `/txns` |
| 创建 txnSession | POST | `/txnSessions` |
| 查询 txnSession | GET | `/txnSessions/{id}` |

---

## 环境信息

| 环境 | API Base URL |
|------|-------------|
| 测试 | `https://test-api.payrix.com` |
| 生产 | `https://api.payrix.com` |

---

## 实测数据（测试环境）

```
Merchant: t1_mer_698c31dc827d9dd16bc1830

# Sale → Refund（全额）
t1_txn_69a4ff52873215a5e567bae  type=1(Sale)    total=2000  status=4(Settled)  refunded=2000
t1_txn_69a54ad480186d6955b9121  type=5(Refund)  total=2000  status=3  fortxn=t1_txn_69a4ff52...

# Sale → Partial Refund
t1_txn_69a6874304a0e427c1d2387  type=1(Sale)    total=2000  status=4(Settled)  refunded=1000
t1_txn_69ae43ec6f1a6379874e810  type=5(Refund)  total=1000  status=4  fortxn=t1_txn_69a687...

# Sale → ReverseAuth
t1_txn_69ae716197bac35fb2da20d  type=1(Sale)    total=4000  approved=2700  status=4
t1_txn_69ae725dd539ec8c0895007  type=4(RevAuth)  total=1300  status=1  fortxn=t1_txn_69ae71...
```
