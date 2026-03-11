# Payrix Invoice 创建与支付流程

本文档记录通过 Payrix Platform API 创建 Invoice、添加行项目、处理税费并获取支付页面链接的完整流程。

---

## 概述

Payrix Invoice 涉及三个独立资源：

| 资源 | Endpoint | 说明 |
|------|----------|------|
| Invoice Item（商品目录） | `/invoiceItems` | 预先创建的可复用商品，绑定到 login |
| Invoice（账单） | `/invoices` | 主体资源，包含 tax、status、支付方式等 |
| Invoice Line Item（行项目） | `/invoiceLineItems` | 将商品与 invoice 关联，含数量和单价 |

> ⚠️ 注意大小写：`/invoiceItems`、`/invoiceLineItems`（驼峰命名）——全小写会返回 404。

---

## 前置：获取 `login` ID

Invoice 的 `login` 字段必填。通过 embed merchant entity 一步获取，无需额外请求。

```bash
curl -X GET 'https://test-api.payrix.com/merchants/{merchantId}?embed=entity' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json'
```

从响应中取：`response.data[0].entity.login`

---

## Step 1 — 创建商品目录项（按需）

如需在 invoice 中添加行项目，需先在商品目录中创建或查询已有商品。

### 创建

```bash
curl -X POST 'https://test-api.payrix.com/invoiceItems' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "login": "t1_log_xxxx",
    "item": "Latte",
    "description": "Hot latte 16oz",
    "price": 550,
    "um": "each"
  }'
```

响应取：`response.data[0].id`（格式 `t1_ini_...`）

### 查询已有商品

```bash
curl -X GET 'https://test-api.payrix.com/invoiceItems' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -H 'search[login][equals]: t1_log_xxxx'
```

**字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `login` | ✅ | 商品归属的 login ID |
| `item` | ✅ | 商品名称（字符串，非 ID） |
| `description` | | 商品描述 |
| `price` | | 默认单价（分） |
| `um` | | 单位，如 `each`、`kilogram` |

---

## Step 2 — 创建 Invoice

```bash
curl -X POST 'https://test-api.payrix.com/invoices' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "login": "t1_log_xxxx",
    "merchant": "t1_mer_xxxx",
    "number": "INV-001",
    "status": "pending",
    "title": "Coffee Order",
    "tax": 88,
    "dueDate": 20260401,
    "emails": "customer@example.com",
    "allowedPaymentMethods": "visa|masterCard|amex|discover",
    "type": "single"
  }'
```

响应取：`response.data[0].id`（格式 `t1_inv_...`）

**字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `login` | ✅ | 从前置步骤获取 |
| `merchant` | ✅ | merchant ID |
| `number` | ✅ | 自定义 invoice 编号 |
| `status` | ✅ | 初始设为 `pending` |
| `tax` | | 税额（分，整数），手动填入 |
| `total` | ❌ | **禁止填写**，API 自动计算 |
| `type` | | `single` / `multiUse` / `recurring` |
| `dueDate` | | 格式 `YYYYMMDD`（整数） |
| `emails` | | 发送 invoice 的邮箱地址 |
| `allowedPaymentMethods` | | 支付方式，多个用 `\|` 分隔 |

**status 可选值：** `pending` / `confirmed` / `viewed` / `paid` / `cancelled` / `expired` / `refunded` / `rejected`

---

## Step 3 — 添加行项目

```bash
curl -X POST 'https://test-api.payrix.com/invoiceLineItems' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{
    "invoice": "t1_inv_xxxx",
    "invoiceItem": "t1_ini_xxxx",
    "quantity": 2,
    "price": 550
  }'
```

**字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `invoice` | ✅ | invoice ID |
| `invoiceItem` | ✅ | 商品目录项 ID（`t1_ini_...`） |
| `quantity` | | 数量，默认 1 |
| `price` | | 单价（分），覆盖商品目录的默认价格 |
| `discount` | | 行项目折扣（分） |

> 添加行项目后，invoice 的 `total` **自动更新**，无需手动修改。

---

## Step 4 — 查询与修改

### 查询单个 Invoice（含行项目）

```bash
curl -X GET 'https://test-api.payrix.com/invoices/{invoiceId}?embed=invoiceLineItems' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json'
```

### 列表查询

```bash
curl -X GET 'https://test-api.payrix.com/invoices' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -H 'search[merchant][equals]: t1_mer_xxxx'
```

### 修改 Invoice

```bash
curl -X PUT 'https://test-api.payrix.com/invoices/{invoiceId}' \
  -H 'APIKEY: {apiKey}' \
  -H 'Content-Type: application/json' \
  -d '{ "tax": 200, "status": "confirmed" }'
```

---

## Step 5 — 构造支付页面链接

API 响应**不包含**支付 URL，需客户端根据 invoice ID 自行拼接：

```
测试环境：https://test-portal.payrix.com/invoices/pay/{invoice.id}
生产环境：https://portal.payrix.com/invoices/pay/{invoice.id}
```

示例：
```
https://test-portal.payrix.com/invoices/pay/t1_inv_69b12a28dc3a970e84d2349
```

客户打开该链接即可在 Payrix hosted 页面直接输卡支付。

---

## Tax 与 Total 机制

`total` 字段由 API 自动计算，**不可写入**：

```
invoice.total = Σ(invoiceLineItem.total) + invoice.tax
invoiceLineItem.total = quantity × price - discount
```

| 字段 | 层级 | 可写 | 说明 |
|------|------|------|------|
| `tax` | Invoice | ✅ | 手动填入的固定税额（分） |
| `total` | Invoice | ❌ | 自动计算，写入报 `field_restricted` |
| `price` | Line Item | ✅ | 单价（分） |
| `discount` | Line Item | ✅ | 行项目折扣（分） |
| `total` | Line Item | ❌ | 自动计算 |

---

## Endpoint 汇总

| 操作 | Method | Endpoint |
|------|--------|----------|
| 获取 login ID | GET | `/merchants/{id}?embed=entity` |
| 创建商品 | POST | `/invoiceItems` |
| 查询商品 | GET | `/invoiceItems` |
| 修改商品 | PUT | `/invoiceItems/{id}` |
| 删除商品 | DELETE | `/invoiceItems/{id}` |
| 创建 Invoice | POST | `/invoices` |
| 查询 Invoice 列表 | GET | `/invoices` |
| 查询单个 Invoice | GET | `/invoices/{id}` |
| 修改 Invoice | PUT | `/invoices/{id}` |
| 删除 Invoice | DELETE | `/invoices/{id}` |
| 添加行项目 | POST | `/invoiceLineItems` |
| 查询行项目 | GET | `/invoiceLineItems` |
| 修改行项目 | PUT | `/invoiceLineItems/{id}` |
| 删除行项目 | DELETE | `/invoiceLineItems/{id}` |

---

## 环境信息

| 环境 | API Base URL | 支付页面 |
|------|-------------|---------|
| 测试 | `https://test-api.payrix.com` | `https://test-portal.payrix.com/invoices/pay/{id}` |
| 生产 | `https://api.payrix.com` | `https://portal.payrix.com/invoices/pay/{id}` |
