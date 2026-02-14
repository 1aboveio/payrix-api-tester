# Payrix TriPOS API 分析 v2（Full Certification Scope）

- Date: 2026-02-13
- Version: v2.2
- Status: INTERNAL / DRAFT
- 基于: v1.11（Minimal API Set）扩展至完整认证测试覆盖

> 目标：在 v1.11（最小闭环）的基础上，**扩展至覆盖 Worldpay triPOS Cloud 完整认证脚本（ExpressCertificationScript_triPOSCloud_Retail）中所有测试用例**，确保我们的集成方案可通过 Worldpay/FIS 认证。

**文档范围变更（v1.11 → v2.1）**

| 维度 | v1.11（最小集） | v2.0（完整认证） |
|------|-----------------|-------------------|
| Sale | 基本 sale 闭环 | 10 个测试用例（Swipe/EMV/Contactless/Keyed + Partial/Balance/Debit/CashBack） |
| Authorization | 未覆盖 | 8 个测试用例 + 8 个 Completion 用例 |
| Refund | 简述 | 5 个独立 Refund 用例 |
| Return | 简述 | 5 个 Return 用例（含 Partial Return） |
| Reversal | 简述 | 6 个 Reversal 用例（含 Direct Express） |
| Void | 简述 | 4 个 Void 用例 |
| Force | 未覆盖 | 3 个 Force Credit 用例 |
| BIN Query | 未覆盖 | 3 个 BIN Query 用例 |
| Level 2 | 未覆盖 | 4 个 Level 2 用例（Sale + Auth） |
| 重复交易处理 | 未覆盖 | 3 个 Duplicate 处理用例 |
| Lane Management | 创建 Lane | 创建 + 删除（必做） |
| 其他端点 | 未覆盖 | 8 个可选端点（含限频警告） |

---

## 0. 范围与重要前提

### triPOS 在 Payrix 体系中的位置
Payrix Resource Center 将 triPOS 描述为 Worldpay 的半集成（semi-integrated）卡 present 方案，Payrix Pro partner 使用 **Express Gateway** 来处理 card-present 交易。
来源：Payrix Resource Center `triPOS` 概览页（https://resource.payrix.com/docs/tripos）。

### 认证脚本来源
本文档基于 Payrix/Worldpay 提供的 **ExpressCertificationScript_triPOSCloud_Retail** 认证脚本，该脚本定义了通过认证所需的全部测试用例（共 6 页，约 59 个测试用例）。

### 文档来源 & API 规范

- triPOS Cloud API 文档：https://triposcert.vantiv.com/api/swagger-ui-bootstrap/
- Lane Management API 文档：https://triposcert.vantiv.com/cloudapi/swagger/ui/index
- triPOS Cloud API Base URL（Cert）：`https://triposcert.vantiv.com`
- Transaction API 4.8.0 YAML：`https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml`
- Lane API 4.8.0 YAML：`https://docs.worldpay.com/assets/api-specs/tripos-lane/api-specification/triPOS%20Lane%20API-4.8.0.yaml`

### 认证通用要求

- **tp-authorization header**：`Version=1.0`
- **ReferenceNumber**（必须包含）：merchant/软件自定义；建议唯一 numeric ≤16 digits
- **TicketNumber**（必须包含）：用于 interchange；建议唯一 numeric ≤6 digits
- **JSON 格式**：triPOS Cloud 请求必须使用 JSON 格式
- **串行处理**：同一 Lane/PIN pad 不能并发请求，必须等前一个请求 100% 完成
- **响应处理**：先检查 HTTP status code，再检查 triPOS statusCode

---

## 1. Lane 管理（终端配对 / 设备接入）

### 1.1 创建 Lane — `POST /cloudapi/v1/lanes`（必做）
> **API 文档：**  
> - 官方文档：https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-lane/api-specification#tag/Lanes/operation/postv1lanes  
> - OpenAPI 规范：https://docs.worldpay.com/assets/api-specs/tripos-lane/api-specification/triPOS%20Lane%20API-4.8.0.yaml  
> - 端点：`POST /cloudapi/v1/lanes`



- 用途：用 PIN Pad 上显示的 activation code 配对，把设备绑定到 merchant 的 Express API 凭证
- **必需字段**：`laneId`, `terminalId`, `activationCode`
- **必需请求头**：`tp-express-account-token/account-id/acceptor-id`, `tp-request-id`, `tp-application-id/name/version`

```bash
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/cloudapi/v1/lanes" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "laneId": "${LANE_ID}",
  "terminalId": "${TERMINAL_ID}",
  "activationCode": "${ACTIVATION_CODE}"
}
EOF
```

### 1.2 删除 Lane — `DELETE /cloudapi/v1/lanes/{laneId}`（必做）
> **API 文档：**  
> - 官方文档：https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-lane/api-specification#tag/Lanes/operation/deletev1laneslaneId  
> - OpenAPI 规范：https://docs.worldpay.com/assets/api-specs/tripos-lane/api-specification/triPOS%20Lane%20API-4.8.0.yaml  
> - 端点：`DELETE /cloudapi/v1/lanes/{laneId}`



- 用途：解绑终端设备（取消配对）
- 认证脚本中为**必做端点**

```bash
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X DELETE "${HOST}/cloudapi/v1/lanes/${LANE_ID}" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}"
```

### 1.3 获取 Lane 列表 / 单个 Lane 信息（运维可选）

- `GET /cloudapi/v1/lanes`
- `GET /cloudapi/v1/lanes/{laneId}`

> 非认证必需，但工程上建议至少有 list/get 作为诊断。

---

## 2. POST /api/v1/sale — Sale（销售交易）
> **API 文档：**  
> - 官方文档：https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Sale/operation/postv1sale  
> - OpenAPI 规范：https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml  
> - 端点：`POST /api/v1/sale`




### 2.1 概述

发起 card-present sale（终端交互刷卡/插卡/挥卡/手输）。

**必需字段**：`laneId`, `transactionAmount`
**强烈建议**：`referenceNumber`, `ticketNumber`
**部分测试所需**：`allowPartialApprovals`, `cashBackAmount`

### 2.2 测试用例矩阵

| # | Test Case | Amount | Entry Method | 特殊参数 | Expected Result |
|---|-----------|--------|-------------|----------|-----------------|
| S-1 | CP Swiped Credit Card | $1.04 | Swipe (MSR) | — | Approved |
| S-2 | CP Swiped Credit Card (Partial Approval) | $9.65 | Swipe (MSR) | `allowPartialApprovals: true` | Partial Approved (statusCode=5) |
| S-3 | CP Swiped Credit Card (Balance Response) | $32.00 | Swipe (MSR) | — | Approved + Balance 信息 |
| S-4 | CP Swiped PIN Debit Card | $31.00 | Swipe (MSR) | PIN 输入 | Approved (Debit) |
| S-5 | CP Swiped PIN Debit Card (Cash Back) | $31.00 | Swipe (MSR) | `cashBackAmount: "1.00"` | Approved (Debit + Cash Back) |
| S-6 | CP EMV Card Insert | $1.06 | EMV Insert | — | Approved (EMV) |
| S-7 | CP Contactless EMV Credit Card | $1.08 | Contactless/NFC | — | Approved (CTLS EMV) |
| S-8 | CP Keyed Credit Card | $1.07 | Manual Key Entry | `invokeManualEntry: true` | Approved |
| S-9 | CP Keyed Credit Card (Partial Approval) | $9.65 | Manual Key Entry | `allowPartialApprovals: true`, `invokeManualEntry: true` | Partial Approved |
| S-10 | CP Keyed Credit Card (Balance Response) | $32.00 | Manual Key Entry | `invokeManualEntry: true` | Approved + Balance 信息 |

### 2.3 关键实现说明

**Partial Approval（部分批准）**
- 需设置 `allowPartialApprovals: true`
- 响应中 `approvedAmount` < `transactionAmount`
- statusCode = 5（Partial Approved）
- POS 系统需要处理剩余差额（提示客户用其他支付方式补足）

**Balance Response（余额查询）**
- $32.00 为触发余额返回的测试金额
- 响应中包含 `balanceAmount` 字段

**PIN Debit**
- PIN Pad 上需要输入 PIN
- Debit 交易走 debit network（非 credit network）

**Cash Back**
- 仅限 Debit 卡
- 需传入 `cashBackAmount`
- `transactionAmount` 为商品金额，Cash Back 金额额外

### 2.4 curl 模版

```bash
# S-1: 基本 Swiped Credit Sale
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/sale" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "laneId": "${LANE_ID}",
  "transactionAmount": "1.04",
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}"
}
EOF

# S-2: Partial Approval
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/sale" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "laneId": "${LANE_ID}",
  "transactionAmount": "9.65",
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}",
  "allowPartialApprovals": true
}
EOF

# S-5: PIN Debit with Cash Back
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/sale" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "laneId": "${LANE_ID}",
  "transactionAmount": "31.00",
  "cashBackAmount": "1.00",
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}"
}
EOF

# S-8: Keyed Credit Card (Manual Entry)
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/sale" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "laneId": "${LANE_ID}",
  "transactionAmount": "1.07",
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}",
  "invokeManualEntry": true
}
EOF
```

---

## 3. POST /api/v1/authorization — Authorization（预授权）
> **API 文档：**  
> - 官方文档：https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Authorization/operation/postv1authorization  
> - OpenAPI 规范：https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml  
> - 端点：`POST /api/v1/authorization`




### 3.1 概述

发起 card-present authorization（预授权/冻结资金），后续需通过 Completion 完成交易。典型场景：酒店/餐厅预授权。

**必需字段**：`laneId`, `transactionAmount`
**强烈建议**：`referenceNumber`, `ticketNumber`

### 3.2 测试用例矩阵

| # | Test Case | Amount | Entry Method | 特殊参数 | Expected Result |
|---|-----------|--------|-------------|----------|-----------------|
| A-1 | CP Swiped Credit Card | $1.04 | Swipe (MSR) | — | Approved |
| A-2 | CP Swiped Credit Card (Partial Approval) | $9.65 | Swipe (MSR) | `allowPartialApprovals: true` | Partial Approved |
| A-3 | CP Swiped Credit Card (Balance Response) | $32.00 | Swipe (MSR) | — | Approved + Balance |
| A-4 | CP Contactless EMV Credit Card | $1.08 | Contactless/NFC | — | Approved |
| A-5 | CP EMV Card Insert | $1.06 | EMV Insert | — | Approved |
| A-6 | CP Keyed Credit Card | $1.07 | Manual Key Entry | `invokeManualEntry: true` | Approved |
| A-7 | CP Keyed Credit Card (Partial Approval) | $9.65 | Manual Key Entry | `allowPartialApprovals: true`, `invokeManualEntry: true` | Partial Approved |
| A-8 | CP Keyed Credit Card (Balance Response) | $32.00 | Manual Key Entry | `invokeManualEntry: true` | Approved + Balance |

### 3.3 curl 模版

```bash
# A-1: Swiped Credit Authorization
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/authorization" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "laneId": "${LANE_ID}",
  "transactionAmount": "1.04",
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}"
}
EOF
```

### 3.4 关键实现说明

- Authorization 返回的 `transactionId` 必须保存，用于后续 Completion
- Partial Approval / Balance Response 行为与 Sale 一致
- **Authorization 与 Sale 的区别**：Authorization 仅冻结资金，不结算；需后续 Completion 才完成资金捕获

---

## 4. POST /api/v1/authorization/{transactionId}/completion — Authorization Completion（预授权完成）
> **API 文档：**  
> - 官方文档：https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Authorization/operation/postv1authorizationtransactionIdcompletion  
> - OpenAPI 规范：https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml  
> - 端点：`POST /api/v1/authorization/{transactionId}/completion`




### 4.1 概述

对已成功的 Authorization 进行 Completion（捕获/结算），将冻结的资金转为实际扣款。

**路径参数**：`transactionId`（来自 Authorization 响应）
**必需字段**：`transactionAmount`（Completion 金额，可与 Authorization 不同）

### 4.2 测试用例矩阵

| # | Test Case | Amount | 关联 Auth | Expected Result |
|---|-----------|--------|-----------|-----------------|
| C-1 | Completion of Swiped Credit Card | $1.04 | A-1 的 transactionId | Approved |
| C-2 | Completion of Swiped Credit Card (Partial Approval) | $6.10 | A-2 的 transactionId | Approved（注意金额不同于原 Auth） |
| C-3 | Completion of Swiped Credit Card (Balance Response) | $32.00 | A-3 的 transactionId | Approved |
| C-4 | Completion of Contactless EMV Credit Card | $1.08 | A-4 的 transactionId | Approved |
| C-5 | Completion of EMV Card Insert | $1.06 | A-5 的 transactionId | Approved |
| C-6 | Completion of Keyed Credit Card | $1.07 | A-6 的 transactionId | Approved |
| C-7 | Completion of Keyed Credit Card (Partial Approval) | $6.10 | A-7 的 transactionId | Approved（注意金额不同于原 Auth） |
| C-8 | Completion of Keyed Credit Card (Balance Response) | $32.00 | A-8 的 transactionId | Approved |

### 4.3 关键实现说明

- **Completion 金额可以与 Authorization 金额不同**（C-2: Auth $9.65 → Completion $6.10；C-7 同理）
- 这在餐厅（加小费）、酒店（最终消费低于预授权）等场景常见
- **transactionId 关联**：Completion 必须引用原 Authorization 的 transactionId
- 认证脚本要求按顺序执行：先完成对应 Authorization，再做 Completion

### 4.4 curl 模版

```bash
# C-1: Completion of Swiped Credit Auth
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/authorization/${AUTH_TXN_ID}/completion" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "transactionAmount": "1.04"
}
EOF
```

---

## 5. POST /api/v1/refund — Refund（独立退款，需终端交互）
> **API 文档：**  
> - 官方文档：https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Refund/operation/postv1refund  
> - OpenAPI 规范：https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml  
> - 端点：`POST /api/v1/refund`




### 5.1 概述

独立退款操作（不引用原交易 transactionId），需终端交互（刷卡/插卡/挥卡/手输）。与 Return（引用原交易）不同。

**必需字段**：`laneId`, `transactionAmount`

### 5.2 测试用例矩阵

| # | Test Case | Amount | Entry Method | Expected Result |
|---|-----------|--------|-------------|-----------------|
| RF-1 | CP Swiped Credit Card | $1.12 | Swipe (MSR) | Approved (Refund) |
| RF-2 | CP Swiped PIN Debit Card | $31.00 | Swipe (MSR) | Approved (Debit Refund) |
| RF-3 | CP Contactless EMV Credit Card | $2.31 | Contactless/NFC | Approved |
| RF-4 | CP EMV Card Insert | $2.32 | EMV Insert | Approved |
| RF-5 | CP Keyed Credit Card | $1.13 | Manual Key Entry | Approved |

### 5.3 关键实现说明

- **Refund vs Return 的区别**：
  - **Refund**（本节）：独立退款，不引用原交易，需终端读卡交互
  - **Return**（第 6 节）：引用原 transactionId，无需终端交互
- PIN Debit Refund（RF-2）需要 PIN 输入
- 认证用例中每个 Entry Method 使用不同金额，便于验证区分

### 5.4 curl 模版

```bash
# RF-1: Swiped Credit Refund
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/refund" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "laneId": "${LANE_ID}",
  "transactionAmount": "1.12",
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}"
}
EOF
```

---

## 6. POST /api/v1/return/{transactionId}/{paymentType} — Return（引用原交易退款）
> **API 文档：**  
> - 官方文档：https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Return/operation/postv1returntransactionIdpaymentType  
> - OpenAPI 规范：https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml  
> - 端点：`POST /api/v1/return/{transactionId}/{paymentType}`




### 6.1 概述

引用原交易的退款操作（需原 transactionId），无需终端交互。支持全额退款和部分退款。

**路径参数**：
- `transactionId`（原交易 ID）
- `paymentType`（支付类型）— **枚举值**：
  - `Credit` — 信用卡交易
  - `Debit` — 借记卡交易
  - `EBT` — EBT 卡交易（如适用）
  - `Gift` — 礼品卡交易（如适用）

### 6.2 测试用例矩阵

| # | Test Case | Amount | 关联原交易 | 退款类型 | Expected Result |
|---|-----------|--------|-----------|----------|-----------------|
| RT-1 | Return of Swiped Credit Card | $1.04 | Sale S-1 的 transactionId | 全额 | Approved |
| RT-2 | Return of Contactless EMV Credit Card | $1.08 | Sale S-7 的 transactionId | 全额 | Approved |
| RT-3 | Return of Keyed Credit Card | $1.07 | Sale S-8 的 transactionId | 全额 | Approved |
| RT-4 | Partial Return of Swiped Credit Card | $0.50 | Sale 的 transactionId | 部分（$0.50 < 原金额） | Approved |
| RT-5 | Partial Return of Keyed Credit Card | $0.53 | Sale 的 transactionId | 部分（$0.53 < 原金额） | Approved |

### 6.3 关键实现说明

- **Partial Return**：退款金额小于原交易金额，用于部分退货场景
- 需确保原交易 transactionId 已保存并可检索
- Return 不需要终端交互（无需读卡），因为引用了原交易卡信息

### 6.4 curl 模版

```bash
# RT-1: Full Return of Swiped Credit
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/return/${ORIGINAL_TXN_ID}/${PAYMENT_TYPE}" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "transactionAmount": "1.04"
}
EOF

# RT-4: Partial Return
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/return/${ORIGINAL_TXN_ID}/${PAYMENT_TYPE}" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "transactionAmount": "0.50"
}
EOF
```

---

## 7. POST /api/v1/reversal/{transactionId}/{paymentType} — Reversal（冲正/全额撤销）
> **API 文档：**  
> - 官方文档：https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Reversal/operation/postv1reversaltransactionIdpaymentType  
> - OpenAPI 规范：https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml  
> - 端点：`POST /api/v1/reversal/{transactionId}/{paymentType}`




### 7.1 概述

全额冲正/撤销操作。认证脚本要求做 **full reversal（全额冲正）**。典型语义：释放被冻结的授权资金。

**路径参数**：
- `transactionId`（原交易 ID）
- `paymentType`（支付类型）— **枚举值**：
  - `Credit` — 信用卡交易
  - `Debit` — 借记卡交易
  - `EBT` — EBT 卡交易（如适用）
  - `Gift` — 礼品卡交易（如适用）

### 7.2 测试用例矩阵

| # | Test Case | Amount | 关联原交易 | Expected Result |
|---|-----------|--------|-----------|-----------------|
| RV-1 | Full Reversal of Swiped Credit Card | $1.00 | Sale/Auth 的 transactionId | Approved (Reversed) |
| RV-2 | Full Reversal of Swiped PIN Debit Card | $31.00 | Debit Sale 的 transactionId | Approved (Reversed) |
| RV-3 | Full Reversal of Contactless MSD Credit Card | $1.00 | CTLS Sale 的 transactionId | Approved (Reversed) |
| RV-4 | Full Reversal of EMV Card Insert | $1.00 | EMV Sale 的 transactionId | Approved (Reversed) |
| RV-5 | Full Reversal of Keyed Credit Card | $1.00 | Keyed Sale 的 transactionId | Approved (Reversed) |
| RV-6 | Full Reversal via Direct Express | any amount | 如原 Sale 通过 triPOS 提交 | 通过 Express 直接冲正 |

### 7.3 关键实现说明

- **RV-6 特殊注意**：如果原 Sale 是通过 triPOS 提交的，但需要通过 Express 直接做 Reversal，**必须在 Express Reversal 请求中提交相同的 LaneNumber**
- Reversal 是全额操作（不像 Return 支持部分金额）
- **Reversal vs Void 的区别**：
  - Reversal：偏"授权纠错/释放冻结资金"，更实时
  - Void：偏"取消已提交但未结算的交易"
- RV-3 使用 "Contactless **MSD**"（非 EMV），注意终端测试卡类型

### 7.4 curl 模版

```bash
# RV-1: Full Reversal of Swiped Credit
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/reversal/${ORIGINAL_TXN_ID}/${PAYMENT_TYPE}" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}"
```

---

## 8. POST /api/v1/void/{transactionId} — Void（撤销/取消）
> **API 文档：**  
> - 官方文档：https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Void/operation/postv1voidtransactionId  
> - OpenAPI 规范：https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml  
> - 端点：`POST /api/v1/void/{transactionId}`




### 8.1 概述

对尚未结算的交易做撤销/取消。

**路径参数**：`transactionId`

### 8.2 测试用例矩阵

| # | Test Case | Amount | 关联原交易 | Expected Result |
|---|-----------|--------|-----------|-----------------|
| V-1 | Void of Swiped Credit Card | $1.00 | Sale 的 transactionId | Voided |
| V-2 | Void of Contactless EMV Credit Card | $1.00 | CTLS Sale 的 transactionId | Voided |
| V-3 | Void of EMV Card Insert | $1.00 | EMV Sale 的 transactionId | Voided |
| V-4 | Void of Keyed Credit Card | $1.00 | Keyed Sale 的 transactionId | Voided |

### 8.3 关键实现说明

- Void 用于尚未 settled/batched 的交易
- 所有 Void 测试金额均为 $1.00
- Void 后原交易金额不再结算
- **Void 不需要终端交互**（不需要读卡）

### 8.4 curl 模版

```bash
# V-1: Void of Swiped Credit Sale
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/void/${ORIGINAL_TXN_ID}" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}"
```

---

## 9. POST /api/v1/force/credit — Force（强制入账）
> **API 文档：**  
> - 官方文档：https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Force/operation/postv1forcecredit  
> - OpenAPI 规范：https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml  
> - 端点：`POST /api/v1/force/credit`




### 9.1 概述

Force 交易用于将之前通过电话/语音授权获取的 approval code 强制入账。这是 credit card 交易类型。

**必需字段**：`laneId`, `transactionAmount`, `approvalCode`（电话授权码）

### 9.2 测试用例矩阵

| # | Test Case | Amount | Entry Method | Expected Result |
|---|-----------|--------|-------------|-----------------|
| F-1 | CP Swiped Credit Card | $3.10 | Swipe (MSR) | Approved (Forced) |
| F-2 | CP Contactless EMV Credit Card | $2.31 | Contactless/NFC | Approved (Forced) |
| F-3 | CP Keyed Credit Card | $3.13 | Manual Key Entry | Approved (Forced) |

### 9.3 关键实现说明

- Force 交易需要终端交互（读卡）
- 需要预先获得的 approval code（通常来自电话/语音授权）
- 典型场景：POS 系统离线时通过电话获取授权码，上线后做 Force 入账

### 9.4 curl 模版

```bash
# F-1: Force Swiped Credit
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/force/credit" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "laneId": "${LANE_ID}",
  "transactionAmount": "3.10",
  "approvalCode": "${APPROVAL_CODE}",
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}"
}
EOF
```

---

## 10. GET /api/v1/binQuery/{laneId} — BIN Query（卡 BIN 查询）
> **API 文档：**  
> - 官方文档：https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Utility/operation/getv1binQuerylaneId  
> - OpenAPI 规范：https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml  
> - 端点：`GET /api/v1/binQuery/{laneId}`




### 10.1 概述

在不执行交易的情况下查询卡的 BIN（Bank Identification Number）信息。需要终端读卡交互。

**路径参数**：`laneId`
**无金额**：BIN Query 不涉及交易金额

### 10.2 测试用例矩阵

| # | Test Case | Amount | Entry Method | Expected Result |
|---|-----------|--------|-------------|-----------------|
| BQ-1 | Swiped Credit Card | N/A | Swipe (MSR) | 返回 BIN 信息（卡品牌/类型等） |
| BQ-2 | Contactless EMV Credit Card | N/A | Contactless/NFC | 返回 BIN 信息 |
| BQ-3 | Keyed Credit Card | N/A | Manual Key Entry | 返回 BIN 信息 |

### 10.3 关键实现说明

- BIN Query 不产生交易（无金额、无 transactionId）
- 典型用途：预判卡类型（Credit/Debit）、卡品牌（Visa/MC/Amex）、是否商业卡
- 可用于 Level 2/3 数据判断、路由选择等

### 10.4 curl 模版

```bash
# BQ-1: BIN Query via Swipe
export TP_REQUEST_ID="$(uuidgen)"
curl -sS "${HOST}/api/v1/binQuery/${LANE_ID}" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}"
```

---

## 11. Level 2 Processing（Level 2 数据处理）

> 参考：https://developerengine.fisglobal.com/apis/express/features/level-2-data#express-level-ii-data

### 11.1 概述

Level 2（Level II）数据用于帮助商业卡（commercial cards）获得最低 interchange 费率。建议在交易请求中附加以下 Level 2 字段：

| Level 2 字段 | 说明 | 要求 |
|--------------|------|------|
| `salesTaxAmount` | 销售税金额 | 必须 > 0.1% of sale amount（免税交易不符合 Level II 费率） |
| `commercialCardCustomerCode` | 商业卡客户代码（如 PO Number） | 建议填写 |
| `shippingZipcode` | 收货邮编 | 建议填写 |
| `ticketNumber` | 票据号 | 建议填写 |
| `billingName` | 账单姓名 | 建议填写 |

### 11.2 Level 2 Sale 测试用例

| # | Test Case | Amount | Entry Method | Level 2 数据 | Expected Result |
|---|-----------|--------|-------------|--------------|-----------------|
| L2S-1 | CP Swiped Credit Card (L2 Sale) | $3.00 | Swipe (MSR) | 含完整 Level 2 字段 | Approved + L2 Qualified |
| L2S-2 | CP EMV Card Insert (L2 Sale) | $4.00 | EMV Insert | 含完整 Level 2 字段 | Approved + L2 Qualified |

### 11.3 Level 2 Authorization 测试用例

| # | Test Case | Amount | Entry Method | Level 2 数据 | Expected Result |
|---|-----------|--------|-------------|--------------|-----------------|
| L2A-1 | CP Swiped Credit Card (L2 Auth) | $5.00 | Swipe (MSR) | 含完整 Level 2 字段 | Approved + L2 Qualified |
| L2A-2 | CP EMV Card Insert (L2 Auth) | $6.00 | EMV Insert | 含完整 Level 2 字段 | Approved + L2 Qualified |

### 11.4 curl 模版

```bash
# L2S-1: Sale with Level 2 Data
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/sale" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "laneId": "${LANE_ID}",
  "transactionAmount": "3.00",
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}",
  "salesTaxAmount": "0.25",
  "commercialCardCustomerCode": "PO123456",
  "shippingZipcode": "90210",
  "billingName": "Test Business Inc"
}
EOF

# L2A-1: Authorization with Level 2 Data
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/authorization" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "laneId": "${LANE_ID}",
  "transactionAmount": "5.00",
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}",
  "salesTaxAmount": "0.40",
  "commercialCardCustomerCode": "PO789012",
  "shippingZipcode": "90210",
  "billingName": "Test Business Inc"
}
EOF
```

### 11.5 关键实现说明

- **salesTaxAmount 必须 > 0.1% of sale amount**：例如 $3.00 的交易，salesTaxAmount 至少 > $0.003
- 免税交易（tax-exempt）不符合 Level II interchange 费率
- Level 2 数据是"附加"到标准 Sale/Auth 请求中的（同一个 endpoint）
- 商业卡（corporate/purchasing cards）才会受益于 Level 2 数据

---

## 12. Duplicate Transaction Handling（重复交易处理）

### 12.1 概述

Duplicate Checking 是 Express host 端的功能，可按交易维度开启/关闭。检测规则：

- 相同卡号（Same Card Number）
- 相同交易金额（Same Transaction Amount）
- 相同交易类型（Sale, Return 等）
- 同一 batch 内最近 25 笔交易

### 12.2 测试用例矩阵

> **重要：以下三个测试用例必须使用同一张卡**

| # | Test Case | Amount | 操作说明 | Expected Result |
|---|-----------|--------|---------|-----------------|
| DUP-1 | Process Sale (or Auth) | $1.70 | 正常发起 Sale/Auth | Approved |
| DUP-2 | Process Duplicate Sale | $1.70 | 用同卡同金额再次发起 Sale，设置 `checkForDuplicateTransactions: true` | 收到 duplicate 响应（statusCode=23） |
| DUP-3 | Override Duplicate | $1.70 | CP Swiped 或 EMV，设置 `duplicateOverrideFlag: true` 或 `duplicateCheckDisableFlag: true` | Approved（绕过重复检测） |

### 12.3 两种重复检测控制参数

| 参数 | 作用 | 建议 |
|------|------|------|
| `duplicateOverrideFlag` | 设为 `true` 时，如果 host 判定为重复交易，则覆盖/绕过重复检测（per-transaction） | 用于"确认是有意重复"的场景 |
| `duplicateCheckDisableFlag` | 设为 `true` 时，完全禁用该笔交易的重复检测（per-transaction） | **推荐使用此参数**（认证脚本建议） |

> 认证脚本推荐：integrator 应使用 `duplicateCheckDisableFlag` 作为统一的 per-transaction 重复检测启/禁方案。

### 12.4 curl 模版

```bash
# DUP-1: 正常 Sale
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/sale" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "laneId": "${LANE_ID}",
  "transactionAmount": "1.70",
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}"
}
EOF

# DUP-2: 重复 Sale（应触发重复检测）
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/sale" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "laneId": "${LANE_ID}",
  "transactionAmount": "1.70",
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}",
  "checkForDuplicateTransactions": true
}
EOF

# DUP-3: 绕过重复检测
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/sale" \
  -H "Content-Type: application/json" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}" \
  -d @- <<EOF
{
  "laneId": "${LANE_ID}",
  "transactionAmount": "1.70",
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}",
  "duplicateCheckDisableFlag": true
}
EOF
```

---

## 13. 其他 triPOS 端点（可选，含限频警告）

> **API 文档：**  
> - Transaction API: https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification  
> - Lane API: https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-lane/api-specification  
> - OpenAPI 规范 (Transaction): https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml  
> - OpenAPI 规范 (Lane): https://docs.worldpay.com/assets/api-specs/tripos-lane/api-specification/triPOS%20Lane%20API-4.8.0.yaml

### 13.1 可选端点列表

| 端点 | Method | 用途 | API 文档 |
|------|--------|------|----------|
| `/api/v1/display` | POST | 向 PIN Pad 发送自定义显示内容 | [Display](https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Utility/operation/postv1display) |
| `/api/v1/idle` | POST | 将 PIN Pad 设置为空闲状态 | [Idle](https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Utility/operation/postv1idle) |
| `/api/v1/input/{laneId}` | GET | 从 PIN Pad 获取用户输入 | [Input](https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Utility/operation/getv1inputlaneId) |
| `/api/v1/selection/{laneId}` | GET | 从 PIN Pad 获取用户选择 | [Selection](https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Utility/operation/getv1selectionlaneId) |
| `/api/v1/signature/{laneId}` | GET | 从 PIN Pad 获取签名 | [Signature](https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Utility/operation/getv1signaturelaneId) |
| `/api/v1/status/host` | GET | 检查 host 连接状态 | [Host Status](https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Utility/operation/getv1statushost) |
| `/api/v1/status/triPOS/{echo}` | GET | 检查 triPOS 服务状态（echo test） | [triPOS Status](https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Utility/operation/getv1statustriPOSecho) |
| `/cloudapi/v1/lanes/{laneId}/connectionstatus` | GET | 检查特定 Lane 的连接状态 | [Lane Status](https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-lane/api-specification#tag/Lanes/operation/getv1laneslaneIdconnectionstatus) |

### 13.2 限频警告

> **重要（来自认证脚本）**：
>
> 使用上述端点执行状态检查请求时，**最大频率不得超过每 2 分钟 1 次（one status check every 2 minutes）**。
>
> 此限制旨在确保 triPOS Cloud 平台稳定性。**超频提交可能导致 Worldpay/FIS 限制（reject）商户的处理权限一段时间。**

### 13.3 实现建议

- 状态检查类端点（status/host、status/triPOS、connectionstatus）建议用 **定时任务/心跳机制** 调用，设置 >= 120 秒间隔
- display / idle / input / selection / signature 属于终端交互辅助功能，按业务需要选择性实现
- 建议在客户端/API 层做 **rate limiter** 强制限频，防止意外超频

---

## 14. 交易状态查询与对账
> **API 文档：**  
> - 官方文档：https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Query/operation/postv1transactionQuery  
> - OpenAPI 规范：https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml  
> - 端点：`POST /api/v1/transactionQuery`


### 14.1 Transaction Query — `POST /api/v1/transactionQuery`

- 用途：按条件查询交易记录（用于对账、补偿、状态确认）
- **必需字段**：`approvalNumber`, `referenceNumber`, `terminalId`, `transactionDateTimeBegin`, `transactionDateTimeEnd`, `transactionId`

> 该 required 列表较重，意味着实现时需从交易响应中保存足够字段。

### 14.2 Payrix Pro 资金对账
> **API 文档：**  
> - Disbursements: https://resource.payrix.com/docs/api/endpoints/disbursements  
> - Disbursement Entries: https://resource.payrix.com/docs/api/endpoints/disbursementEntries  
> - API 参考：https://resource.payrix.com/docs/api


**推荐路线**：通过 Payrix Pro API 做资金对账

- `GET /disbursements`：按 merchant/entity + 时间窗拉取打款汇总
- `GET /disbursementEntries`：拉取 disbursement 明细行（含 embed 扩展）

> 详细对账流程参见 v1.11 文档第 5.4 节。

---

## 15. 认证方式与请求头

### 15.1 通用请求头（所有 Transaction API 端点）

| Header | Required | 来源 |
|--------|----------|------|
| `tp-application-id` | Yes | 我们应用配置 |
| `tp-application-name` | Yes | 我们应用配置 |
| `tp-application-version` | Yes | 我们应用配置 |
| `tp-authorization` | Yes | `Version=1.0` |
| `tp-express-acceptor-id` | Yes | Payrix Portal (VCore Platform IDs) |
| `tp-express-account-id` | Yes | Payrix Portal (VCore Platform IDs) |
| `tp-express-account-token` | Yes | Payrix Portal (VCore Platform IDs) |
| `tp-request-id` | Yes | 每次请求生成 UUID |
| `Content-Type` | Yes (POST) | `application/json` |

### 15.2 环境变量模版

```bash
export HOST="https://triposcert.vantiv.com"
export TP_APP_ID="fmm-pos"
export TP_APP_NAME="FMMPay POS"
export TP_APP_VERSION="0.1.0"
export TP_AUTH="Version=1.0"
export TP_EXPRESS_ACCEPTOR_ID="..."
export TP_EXPRESS_ACCOUNT_ID="..."
export TP_EXPRESS_ACCOUNT_TOKEN="..."
export TERMINAL_ID="0001"
export LANE_ID="lane-0001"
export PAYMENT_TYPE="Credit"
```

---

## 16. 完整测试用例汇总（全量矩阵）

### 16.1 按端点分布统计

| 端点 | 测试用例数 | 涉及 Entry Method |
|------|-----------|-------------------|
| `POST /api/v1/sale` | 10 | Swipe, EMV, CTLS, Keyed, Debit |
| `POST /api/v1/authorization` | 8 | Swipe, EMV, CTLS, Keyed |
| `POST /api/v1/authorization/.../completion` | 8 | 引用 Auth（无终端交互） |
| `POST /api/v1/refund` | 5 | Swipe, EMV, CTLS, Keyed, Debit |
| `POST /api/v1/return/...` | 5 | 引用原交易（无终端交互） |
| `POST /api/v1/reversal/...` | 6 | 引用原交易 + Direct Express |
| `POST /api/v1/void/...` | 4 | 引用原交易（无终端交互） |
| `POST /api/v1/force/credit` | 3 | Swipe, CTLS, Keyed |
| `GET /api/v1/binQuery/...` | 3 | Swipe, CTLS, Keyed |
| Level 2 Sale | 2 | Swipe, EMV |
| Level 2 Auth | 2 | Swipe, EMV |
| Duplicate Handling | 3 | 同一张卡（Swipe 或 EMV） |
| Lane Management | 2 | N/A（API 管理操作） |
| **合计** | **~61** | |

### 16.2 按测试金额索引

| 金额 | 使用场景 |
|------|---------|
| $0.50 | Partial Return (Swiped) |
| $0.53 | Partial Return (Keyed) |
| $1.00 | Reversal (多个), Void (多个) |
| $1.04 | Sale/Auth (Swiped Credit), Return (Swiped), Completion (Swiped) |
| $1.06 | Sale/Auth (EMV Insert), Completion (EMV) |
| $1.07 | Sale/Auth (Keyed), Return (Keyed), Completion (Keyed) |
| $1.08 | Sale/Auth (Contactless), Return (CTLS), Completion (CTLS) |
| $1.12 | Refund (Swiped Credit) |
| $1.13 | Refund (Keyed Credit) |
| $1.70 | Duplicate Transaction Handling (3 个用例) |
| $2.31 | Refund (CTLS EMV), Force (CTLS) |
| $2.32 | Refund (EMV Insert) |
| $3.00 | Level 2 Sale (Swiped) |
| $3.10 | Force (Swiped Credit) |
| $3.13 | Force (Keyed Credit) |
| $4.00 | Level 2 Sale (EMV) |
| $5.00 | Level 2 Auth (Swiped) |
| $6.00 | Level 2 Auth (EMV) |
| $6.10 | Completion (Partial Approval—Swiped & Keyed) |
| $9.65 | Partial Approval (Sale & Auth—Swiped & Keyed) |
| $31.00 | Debit Sale, Debit Sale+CashBack, Debit Refund, Debit Reversal |
| $32.00 | Balance Response (Sale & Auth—Swiped & Keyed, Completion) |

### 16.3 按 Entry Method 索引

| Entry Method | 涉及端点 | 总用例数 |
|-------------|---------|---------|
| Swipe (MSR) Credit | Sale, Auth, Completion, Refund, Return, Reversal, Void, Force, BinQuery, L2 | ~16 |
| Swipe (MSR) Debit | Sale (含 CashBack), Refund, Reversal | ~4 |
| EMV Insert | Sale, Auth, Completion, Refund, Reversal, Void, L2 | ~10 |
| Contactless EMV/MSD | Sale, Auth, Completion, Refund, Return, Reversal, Void, Force, BinQuery | ~10 |
| Manual Key Entry | Sale, Auth, Completion, Refund, Return, Void, Force, BinQuery | ~11 |

---

## 17. 认证测试执行顺序建议

### 17.1 推荐执行顺序

认证测试存在依赖关系（如 Completion 依赖 Authorization、Return 依赖 Sale），建议按以下顺序执行：

1. **Lane Management**（1.1–1.2）：先绑定终端
2. **Sale**（第 2 节）：执行全部 10 个 Sale 用例，保存所有 transactionId
3. **Authorization**（第 3 节）：执行全部 8 个 Auth 用例，保存所有 transactionId
4. **Authorization Completion**（第 4 节）：引用第 3 步的 transactionId 执行 8 个 Completion
5. **Refund**（第 5 节）：执行 5 个独立 Refund 用例
6. **Return**（第 6 节）：引用第 2 步的 transactionId 执行 5 个 Return
7. **Reversal**（第 7 节）：需要新的 Sale/Auth 交易用于冲正（或使用第 2 步剩余的未操作交易）
8. **Void**（第 8 节）：需要新的 Sale 交易用于 Void
9. **Force**（第 9 节）：3 个 Force 用例
10. **BIN Query**（第 10 节）：3 个 BIN Query 用例
11. **Level 2**（第 11 节）：4 个 Level 2 用例
12. **Duplicate Handling**（第 12 节）：3 个重复交易用例

### 17.2 依赖关系图

```
Lane Create ──┬── Sale (10) ──────────── Return (5)
              │
              ├── Auth (8) ──── Completion (8)
              │
              ├── [New Sale] ──── Reversal (6)
              │
              ├── [New Sale] ──── Void (4)
              │
              ├── Refund (5)
              │
              ├── Force (3)
              │
              ├── BIN Query (3)
              │
              ├── Level 2 Sale (2) + Level 2 Auth (2)
              │
              └── Duplicate Handling (3)
```

---

## 18. 响应处理与状态码

### 18.1 HTTP 状态码（先判断）

| HTTP Code | 含义 |
|-----------|------|
| 200 | 成功（再看 statusCode） |
| 4xx | 客户端错误 |
| 5xx | 服务端错误 |

### 18.2 triPOS statusCode（再判断）

| statusCode | 含义 | 典型场景 |
|------------|------|---------|
| 0 | Approved / Success | 交易成功 |
| 5 | Partial Approved | 部分批准（余额不足） |
| 7 | DCC Requested | Dynamic Currency Conversion |
| 20 | Declined | 交易被拒 |
| 23 | Duplicate | 重复交易 |

> 完整状态码列表参见：`Express_Response_Codes_and_Descriptions` 文档。

---

## 19. Open Questions / 风险点

> 继承 v1.11 的 Open Questions，并补充 v2.0 新增项。

1. **生产环境 URL / host**：cert 使用 `triposcert.vantiv.com`，生产 host 需确认
2. **tp-authorization 的生成方式与有效期**：OpenAPI 仅标注"authorization header"
3. **Express credentials 轮换/吊销机制**
4. **transactionQuery 的 required 字段过重**
5. **对账一致性与延迟**（card-present funding 需等次日导入）
6. **Webhook 的可靠性与安全**
7. **Tokenization / Omnitoken**
8. **（v2.0 新增）Force 交易的 approvalCode 来源**：电话授权流程的具体操作细节需确认
9. **（v2.0 新增）Level 2 字段在 triPOS 请求中的精确字段名**：需对照最新 YAML 确认（`salesTaxAmount` vs `SalesTaxAmount` 等大小写）
10. **（v2.0 新增）Reversal via Direct Express（RV-6）的实现方式**：需确认 Express 直接调用端点与 triPOS 的 LaneNumber 映射
11. **（v2.0 新增）BIN Query 返回字段的精确结构**：用于判断卡类型/品牌的具体响应字段

---

## 附录 A：关键引用

- Payrix triPOS 概览：https://resource.payrix.com/docs/tripos
- triPOS & Payrix Pro Integration Notices：https://resource.payrix.com/docs/tripos-and-payrix-pro-integration-notices
- triPOS Transaction API 4.8.0 YAML：https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml
- triPOS Lane API 4.8.0 YAML：https://docs.worldpay.com/assets/api-specs/tripos-lane/api-specification/triPOS%20Lane%20API-4.8.0.yaml
- Express Required Terminal Settings：https://developerengine.fisglobal.com/assets/pdf/Express%20Required%20Terminal%20Settings%2009022021.pdf
- Express Supplemental Guidelines：https://developerengine.fisglobal.com/assets/pdf/Express%20Supplemental%20Guidelines%20a10012019.pdf
- Receipts：https://developerengine.fisglobal.com/apis/tripos/tripos-cloud#receipts
- Level 2 Data：https://developerengine.fisglobal.com/apis/express/features/level-2-data#express-level-ii-data
- Payrix Pro Webhooks Setup：https://resource.payrix.com/docs/webhooks-setup
- Omnitoken：https://resource.payrix.com/docs/omnitoken

## 附录 B：v1.11 → v2.0 变更记录

| 变更项 | 说明 |
|--------|------|
| 新增 Authorization 端点（第 3 节） | 8 个测试用例 |
| 新增 Authorization Completion 端点（第 4 节） | 8 个测试用例，含金额变更场景 |
| 新增 Refund 端点细分（第 5 节） | 5 个独立 Refund 用例（区分于 Return） |
| 扩展 Return 端点（第 6 节） | 5 个 Return 用例（含 Partial Return） |
| 扩展 Reversal 端点（第 7 节） | 6 个用例（含 Direct Express） |
| 扩展 Void 端点（第 8 节） | 4 个用例 |
| 新增 Force 端点（第 9 节） | 3 个 Force Credit 用例 |
| 新增 BIN Query 端点（第 10 节） | 3 个 BIN Query 用例 |
| 新增 Level 2 Processing（第 11 节） | 4 个 Level 2 用例（Sale + Auth） |
| 新增 Duplicate Transaction Handling（第 12 节） | 3 个重复交易处理用例 |
| 新增可选端点与限频警告（第 13 节） | 8 个可选端点 + 限频规则 |
| 新增 Lane Delete（第 1.2 节） | 认证必做端点 |
| 新增完整测试用例汇总矩阵（第 16 节） | 按端点/金额/Entry Method 三维索引 |
| 新增认证测试执行顺序建议（第 17 节） | 依赖关系与推荐执行顺序 |
| 新增 Open Questions #8–#11（第 19 节） | v2.0 新增的待确认项 |
