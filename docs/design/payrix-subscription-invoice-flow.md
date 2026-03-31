# Payrix 订阅分期 + Invoice 完整流程

本文档记录通过 Payrix Platform API 创建分期订阅并关联 Invoice 的完整流程，基于实际 API 测试验证。

---

## 概述

Payrix 的分期/订阅付款涉及五个资源：

| 资源 | Endpoint | 说明 |
|------|----------|------|
| Plan（计划） | `/plans` | 定义付款频率、金额、类型 |
| Subscription（订阅） | `/subscriptions` | 将客户绑定到计划，设定起止日期 |
| Token（存卡） | `/tokens` | 保存客户支付卡信息，用于 CNP 自动扣款 |
| SubscriptionToken（绑卡） | `/subscriptionTokens` | 将 Token 关联到 Subscription |
| Invoice（账单） | `/invoices` | 展示层，关联 subscription 后按周期生成 |

### 资源关系图

```
Customer
  └── Token (存卡: 4111...1111, exp 12/28)
        │
        └── SubscriptionToken (绑定)
              │
              ├── Subscription (2026-04 ~ 2027-03)
              │     └── Plan ($29/月, installment, monthly)
              │
              └── Invoice (recurring, type=recurring)
                    └── InvoiceLineItem → InvoiceItem
```

---

## 完整流程

### Step 1 — 创建 Plan

**POST `/plans`**

```bash
curl -X POST 'https://test-api.payrix.com/plans' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "merchant": "t1_mer_xxxx",
    "name": "Monthly $29 Plan",
    "description": "12-month installment plan at $29/month",
    "type": "installment",
    "amount": 2900,
    "schedule": 3,
    "scheduleFactor": 1,
    "um": "actual",
    "maxFailures": 3
  }'
```

**必填字段：**

| 字段 | 说明 |
|------|------|
| `merchant` | ✅ merchant ID |
| `amount` | ✅ 每期金额（分），$29 = 2900 |
| `schedule` | ✅ 周期：`1`=日, `2`=周, `3`=月, `4`=年 |

**可选字段：**

| 字段 | 说明 |
|------|------|
| `name` | 计划名称 |
| `description` | 计划描述 |
| `type` | `installment`（分期）/ `recurring`（循环订阅） |
| `scheduleFactor` | 周期倍数（默认1），如 schedule=3 + factor=2 → 每2个月 |
| `um` | `actual`（实际金额，分）/ `percent`（百分比，基点） |
| `maxFailures` | 最大连续失败次数，超过后自动停用订阅 |

**实测结果：**
```json
{ "id": "t1_pln_69ca3dfb2cf629ecb7bc7d5" }
```

---

### Step 2 — 创建 Subscription

**POST `/subscriptions`**

```bash
curl -X POST 'https://test-api.payrix.com/subscriptions' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "plan": "t1_pln_xxxx",
    "start": 20260401,
    "finish": 20270331,
    "origin": 2,
    "txnDescription": "Monthly subscription payment"
  }'
```

**必填字段：**

| 字段 | 说明 |
|------|------|
| `plan` | ✅ 关联的 Plan ID |
| `start` | ✅ 开始日期（YYYYMMDD 整数） |

**可选字段：**

| 字段 | 说明 |
|------|------|
| `finish` | 结束日期（YYYYMMDD），不填则永续 |
| `origin` | 来源：`2`=eCommerce, `3`=邮件/电话 |
| `tax` | 每期税额（分） |
| `descriptor` | 交易描述符 |
| `txnDescription` | 交易描述 |

**注意事项：**
- `failures` 字段**不可手动设置**，API 会拒绝（`Cannot manually set failures counter`）
- `authentication` 在 spec 中标为 required，但实测传 `null` 或不传均可

**实测结果：**
```json
{ "id": "t1_sbn_69ca3e0f437aaca0548dbf4", "start": 20260401, "finish": 20270331 }
```

---

### Step 3 — 存卡 + 绑定到 Subscription（Card-Not-Present 自动扣款）

如需系统到期自动扣款（无需客户每次手动付款），需要先存卡再绑定到订阅。

**POST `/tokens`**（存卡）

```bash
curl -X POST 'https://test-api.payrix.com/tokens' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "customer": "t1_cus_xxxx",
    "payment": {
      "method": 2,
      "number": "4111111111111111"
    },
    "expiration": "1228",
    "name": "Visa ending 1111",
    "inactive": 0,
    "frozen": 0
  }'
```

> `status` 字段**不可设置**，自动为 `ready`。
> 响应中 `payment.number` 只返回后四位（`1111`），完整卡号不存储。

**POST `/subscriptionTokens`**（绑卡到订阅）

```bash
curl -X POST 'https://test-api.payrix.com/subscriptionTokens' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "subscription": "t1_sbn_xxxx",
    "token": "34cf40000c9c98620e950299320530a1"
  }'
```

> **关键坑：** `token` 字段必须用 **raw token hash**（响应中的 `token` 字段，如 `34cf4000...`），**不是** resource ID（`t1_tok_...`）。用 resource ID 会报 `no_such_record` 错误。

**实测结果：**
```json
Token:    { "id": "t1_tok_69ca41fcada79f207526dfb", "token": "34cf40000c9c98620e950299320530a1", "status": "ready" }
SubToken: { "id": "t1_stn_69ca421e9088f575e8afe8e", "subscription": "t1_sbn_...", "token": "34cf4000..." }
```

绑定后，Subscription 到期时 Payrix 会自动使用该卡扣款 $29/月。

---

### Step 4 — 创建 Invoice（关联 Subscription）

**POST `/invoices`**

```bash
curl -X POST 'https://test-api.payrix.com/invoices' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "login": "t1_log_xxxx",
    "merchant": "t1_mer_xxxx",
    "customer": "t1_cus_xxxx",
    "subscription": "t1_sbn_xxxx",
    "number": "SUB-2026-001",
    "title": "Monthly Subscription - $29/mo x 12",
    "message": "Your monthly subscription invoice.",
    "emails": "customer@example.com",
    "type": "recurring",
    "status": "pending",
    "dueDate": 20260401,
    "allowedPaymentMethods": "visa|masterCard|amex|discover"
  }'
```

关键：`type` 设为 `recurring`，并通过 `subscription` 字段关联订阅。

**实测结果：**
```json
{ "id": "t1_inv_69ca3e1c5265ec44ebf8c42", "total": 0, "type": "recurring", "status": "pending" }
```

---

### Step 5 — 添加行项目

**POST `/invoiceItems`**（创建商品目录项）

```bash
curl -X POST 'https://test-api.payrix.com/invoiceItems' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "login": "t1_log_xxxx",
    "item": "Monthly Subscription",
    "description": "Monthly subscription fee",
    "price": 2900
  }'
```

**POST `/invoiceLineItems`**（添加到 Invoice）

```bash
curl -X POST 'https://test-api.payrix.com/invoiceLineItems' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "invoice": "t1_inv_xxxx",
    "invoiceItem": "t1_ini_xxxx",
    "quantity": 1,
    "price": 2900
  }'
```

添加后 invoice 的 `total` 自动更新为 2900（$29.00）。

---

### Step 6 — 获取支付链接

```
https://test-portal.payrix.com/invoices/pay/{invoice.id}
```

实测链接：
```
https://test-portal.payrix.com/invoices/pay/t1_inv_69ca3e1c5265ec44ebf8c42
```

---

## 实测创建记录

| 资源 | ID | 说明 |
|------|-----|------|
| Plan | `t1_pln_69ca3dfb2cf629ecb7bc7d5` | $29/月, installment, 每月 |
| Subscription | `t1_sbn_69ca3e0f437aaca0548dbf4` | 2026-04-01 ~ 2027-03-31 |
| Token | `t1_tok_69ca41fcada79f207526dfb` | Visa 4111, exp 12/28, status=ready |
| Token hash | `34cf40000c9c98620e950299320530a1` | 用于绑定 subscriptionTokens |
| SubscriptionToken | `t1_stn_69ca421e9088f575e8afe8e` | Token ↔ Subscription 关联 |
| Invoice | `t1_inv_69ca3e1c5265ec44ebf8c42` | recurring, $29.00, pending |
| Invoice Item | `t1_ini_69ca3e290340b572fb177b4` | "Monthly Subscription" $29 |
| Line Item | `t1_ili_69ca3e34287538c758d6fb8` | qty=1, price=2900 |

---

## API 调用中发现的问题

| 问题 | 说明 |
|------|------|
| `failures` 不可设置 | POST /subscriptions 时传入 `failures` 会报 `field_restricted` |
| `authentication` 非必填 | spec 标注 required，但实测不传也能创建成功 |
| Invoice `total` 不可设置 | 仅通过 line items 自动计算 |
| Invoice `emailStatus` 不可设置 | 自动设为 `pending` |
| Token `status` 不可设置 | 自动设为 `ready`，传入会报 `field_restricted` |
| subscriptionTokens 用 hash 不用 ID | `token` 字段必须传 raw hash（`34cf4...`），传 `t1_tok_...` 报 `no_such_record` |

---

## 分期 vs 循环订阅对比

| 维度 | 分期（installment） | 循环订阅（recurring） |
|------|---------------------|----------------------|
| Plan type | `installment` | `recurring` |
| 有明确结束日期 | ✅ 通常有 `finish` | 可选，可永续 |
| 金额 | 固定每期金额 | 固定每期金额 |
| 用途 | 大额分期付款（如设备采购） | 持续服务订阅（如 SaaS 月费） |
| Invoice type | `recurring` | `recurring` |

两者在 API 层面的唯一区别是 Plan 的 `type` 字段。Invoice 和 Subscription 的创建方式完全一致。

---

## 两种付款模式对比

| 模式 | 说明 | 是否需要 Token |
|------|------|---------------|
| **Invoice 手动付款** | 客户打开支付链接，手动输卡付款 | 否 |
| **Subscription 自动扣款** | 系统到期自动从绑定的卡扣款 | 是（Token + SubscriptionToken） |

可以同时使用两种模式：创建 recurring invoice 供客户查看账单详情 + 绑定 token 实现自动扣款。

---

## Endpoint 汇总

| 操作 | Method | Endpoint |
|------|--------|----------|
| 创建计划 | POST | `/plans` |
| 查询计划 | GET | `/plans` / `/plans/{id}` |
| 创建订阅 | POST | `/subscriptions` |
| 查询订阅（含绑卡） | GET | `/subscriptions/{id}?embed=subscriptionTokens` |
| 存卡（创建 Token） | POST | `/tokens` |
| 查询 Token | GET | `/tokens` / `/tokens/{id}` |
| 绑卡到订阅 | POST | `/subscriptionTokens` |
| 解绑 | DELETE | `/subscriptionTokens/{id}` |
| 创建 Invoice | POST | `/invoices` |
| 创建商品 | POST | `/invoiceItems` |
| 添加行项目 | POST | `/invoiceLineItems` |

---

## 环境信息

| 环境 | API Base URL | 支付页面 |
|------|-------------|---------|
| 测试 | `https://test-api.payrix.com` | `https://test-portal.payrix.com/invoices/pay/{id}` |
| 生产 | `https://api.payrix.com` | `https://portal.payrix.com/invoices/pay/{id}` |
