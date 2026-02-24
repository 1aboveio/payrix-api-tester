# Payrix TriPOS API 分析 v2（Full Certification Scope）

- Date: 2026-02-23
- Version: v2.16
- Status: INTERNAL / DRAFT

> 目标：在 v1.11（最小闭环）的基础上，**扩展至覆盖 Worldpay triPOS Cloud 完整认证脚本（ExpressCertificationScript_triPOSCloud_Retail）中所有测试用例**，确保我们的集成方案可通过 Worldpay/FIS 认证。

---

## 修订历史

| 版本     | 日期         | 变更说明                                                               |
| ------ | ---------- | ------------------------------------------------------------------ |
| v1.0   | 2026-01-XX | 初始版本（Minimal API Set）                                             |
| v1.11  | 2026-02-XX | 最小闭环 API 集，添加对账章节                                                |
| v2.0   | 2026-02-XX | 扩展至完整认证范围（~61 测试用例）                                            |
| v2.1   | 2026-02-XX | 添加附录 A（测试用例参数汇总）                                               |
| v2.10  | 2026-02-13 | 重构参数分类，合并附录 A 到各端点章节                                          |
| v2.11  | 2026-02-13 | 每个端点章节自包含，移除独立附录 A                                             |
| v2.12  | 2026-02-23 | 修复文档问题，更新端点 URL，更新 Duplicate Transaction Handling 规范（基于认证脚本） |
| v2.13  | 2026-02-23 | 添加 path 参数到必需参数表；转义 \$ 符号；添加 Cancel 端点；扩展 Section 13；移除 Section 16/19 |
| v2.14  | 2026-02-23 | 更新端点 URL 和 spec（基于 endpoint-doc-mapping.md）；更新 Display/Input/Selection/Signature/Receipt 端点参数规范 |
| v2.15  | 2026-02-23 | 修复 Section 14.5 参数描述（multiLineText, options）；添加 Section 14.9 支持 PIN Pad 型号列表 |
| v2.16  | 2026-02-23 | 添加 Section 2.4 Tip Prompt 流程文档（预置小费 + PIN Pad 小费提示 + 自动计算逻辑 + 收据打印） |

**v2.16 变更详情：**
- 添加 Section 2.4 Tip Prompt 流程文档：
  - 预置小费（Pre-set Tip）— 商户直接指定小费金额
  - PIN Pad 小费提示（Customer-entered Tip）— 客户在 PIN Pad 选择小费
  - 自动计算逻辑 — triPOS 自动计算 subTotalAmount + tipAmount = transactionAmount
  - 收据打印 — 使用 Receipt 端点打印含小费的收据
- 添加完整的请求/响应示例和 curl 模板
- 添加参数总结表格

**v2.15 变更详情：**
- 修复 Section 14.5 (Selection) 参数描述：
  - `multiLineText`: 明确说明每行用管道符 `\|` 分隔，提供示例 `line1\|line2\|line3`
  - `options`: 明确说明每个选项用管道符 `\|` 分隔，在 PIN Pad 上显示为按钮
- 添加 Section 14.9 (Receipt) 支持的 PIN Pad 型号列表：
  - Ingenico: Lane5000/7000/7000 Deluxe/8000/8000 Deluxe/Move5000
  - Verifone: Mx915/Mx925

---

## 0. 范围与重要前提

### triPOS 在 Payrix 体系中的位置

Payrix Resource Center 将 triPOS 描述为 Worldpay 的半集成（semi-integrated）卡 present 方案，Payrix Pro partner 使用 **Express Gateway** 来处理 card-present 交易。

来源：Payrix Resource Center `triPOS` 概览页（https://resource.payrix.com/docs/tripos）。

### 认证脚本来源

本文档基于 Payrix/Worldpay 提供的 **ExpressCertificationScript_triPOSCloud_Retail** 认证脚本，该脚本定义了通过认证所需的全部测试用例（共 6 页，约 59 个测试用例）。

### 文档来源 & API 规范

- triPOS Cloud API Documentation: https://triposcert.vantiv.com/api/swagger-ui-bootstrap/
- Lane Management API Documentation: https://triposcert.vantiv.com/cloudapi/swagger/ui/index
- triPOS Cloud API Base URL（Cert）: `https://triposcert.vantiv.com`
- Transaction API 4.8.0 YAML: `https://docs.worldpay.com/assets/api-specs/tripos-transaction/api-specification/Tripos%20Transaction%20API-4.8.0.yaml`
- Lane API 4.8.0 YAML: `https://docs.worldpay.com/assets/api-specs/tripos-lane/api-specification/triPOS%20Lane%20API-4.8.0.yaml`

### 认证通用要求

- **tp-authorization header**: `Version=1.0`
- **ReferenceNumber**（必须包含）: merchant/软件自定义；建议唯一 numeric ≤16 digits
- **TicketNumber**（必须包含）: 用于 interchange；建议唯一 numeric ≤6 digits
- **JSON 格式**: triPOS Cloud 请求必须使用 JSON 格式
- **串行处理**: 同一 Lane/PIN pad 不能并发请求，必须等前一个请求 100% 完成
- **响应处理**: 先检查 HTTP status code，再检查 triPOS statusCode

---

## 1. Lane 管理（终端配对 / 设备接入）

### 1.1 创建 Lane — `POST /cloudapi/v1/lanes/`

> **API 文档:** https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-lane/api-specification#tag/Lanes/operation/Lanes_Post

- 用途: 用 PIN Pad 上显示的 activation code 配对，把设备绑定到 merchant 的 Express API 凭证
- **必需字段**: `laneId`, `terminalId`, `activationCode`

```bash
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/cloudapi/v1/lanes/" \
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

### 1.2 删除 Lane — `DELETE /cloudapi/v1/lanes/{laneId}`

> **API 文档:** https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-lane/api-specification#tag/Lanes/operation/Lanes_Delete

- 用途: 解绑终端设备（取消配对）
- 认证脚本中为**必做端点**

#### 必需参数（Mandatory）

| 参数       | 类型     | 位置       | 说明            |
| -------- | ------ | -------- | ------------- |
| `laneId` | string | **Path** | Lane ID（终端标识） |

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

### 1.3 获取 Lane 连接状态 — `GET /cloudapi/v1/lanes/{laneId}/connectionstatus`

> **API 文档:** https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-lane/api-specification#tag/ConnectionStatus/operation/ConnectionStatus_ConnectionStatus

- 用途: 检查特定 Lane 的连接状态

#### 必需参数（Mandatory）

| 参数       | 类型     | 位置       | 说明            |
| -------- | ------ | -------- | ------------- |
| `laneId` | string | **Path** | Lane ID（终端标识） |

```bash
export TP_REQUEST_ID="$(uuidgen)"
curl -sS "${HOST}/cloudapi/v1/lanes/${LANE_ID}/connectionstatus" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}"
```

### 1.4 获取 Lane 列表 — `GET /cloudapi/v1/lanes/`

> **API 文档:** https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-lane/api-specification#tag/Lanes/operation/Lanes_GetList

```bash
export TP_REQUEST_ID="$(uuidgen)"
curl -sS "${HOST}/cloudapi/v1/lanes/" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}"
```

---

## 2. POST /api/v1/sale — Sale（销售交易）

> **API 文档:** https://developerengine.fisglobal.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Sale

### 2.1 概述

发起 card-present sale（终端交互刷卡/插卡/挥卡/手输）。

### 2.2 参数分类

#### 必需参数（Mandatory）

| 参数                  | 类型      | 位置   | 说明            |
| ------------------- | ------- | ---- | ------------- |
| `laneId`            | integer | Body | Lane ID（终端标识） |
| `transactionAmount` | string  | Body | 交易金额          |

**强烈建议:**

| 参数                | 类型     | 说明                              |
| ----------------- | ------ | ------------------------------- |
| `referenceNumber` | string | 唯一交易引用（最多 16 位数字）               |
| `ticketNumber`    | string | Interchange ticket 编号（最多 6 位数字） |

#### 认证相关参数（Certification-Related）

| 参数                                    | 类型      | 用于测试用例         | 说明                          |
| ------------------------------------- | ------- | -------------- | --------------------------- |
| `invokeManualEntry`                   | boolean | S-8, S-9, S-10 | 直接调用手动输入模式（Keyed 测试）        |
| `requestedCashbackAmount`             | string  | S-5            | 请求的 Cashback 金额（仅限 Debit 卡） |
| `configuration.allowPartialApprovals` | boolean | S-2, S-9       | 允许部分批准                      |
| `configuration.allowDebit`            | boolean | S-4, S-5       | 允许 Debit 卡                  |

### 2.3 测试用例参数矩阵

| Test # | Test Case Name                           | Amount  | Entry Method     | Required Parameters                                                                                           | Expected Result                 |
| ------ | ---------------------------------------- | ------- | ---------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| S-1    | CP Swiped Credit Card                    | \$1.04  | Swipe (MSR)      | `laneId`, `transactionAmount`                                                                                 | Approved                        |
| S-2    | CP Swiped Credit Card (Partial Approval) | \$9.65  | Swipe (MSR)      | `laneId`, `transactionAmount`, **`configuration.allowPartialApprovals: true`**                                | Partial Approved (statusCode=5) |
| S-3    | CP Swiped Credit Card (Balance Response) | \$32.00 | Swipe (MSR)      | `laneId`, `transactionAmount`                                                                                 | Approved + Balance 信息           |
| S-4    | CP Swiped PIN Debit Card                 | \$31.00 | Swipe (MSR)      | `laneId`, `transactionAmount`, **`configuration.allowDebit: true`**                                           | Approved (Debit)                |
| S-5    | CP Swiped PIN Debit Card (Cash Back)     | \$31.00 | Swipe (MSR)      | `laneId`, `transactionAmount`, **`requestedCashbackAmount: "1.00"`**, **`configuration.allowDebit: true`**    | Approved (Debit + Cash Back)    |
| S-6    | CP EMV Card Insert                       | \$1.06  | EMV Insert       | `laneId`, `transactionAmount`                                                                                 | Approved (EMV)                  |
| S-7    | CP Contactless EMV Credit Card           | \$1.08  | Contactless/NFC  | `laneId`, `transactionAmount`                                                                                 | Approved (CTLS EMV)             |
| S-8    | CP Keyed Credit Card                     | \$1.07  | Manual Key Entry | `laneId`, `transactionAmount`, **`invokeManualEntry: true`**                                                  | Approved                        |
| S-9    | CP Keyed Credit Card (Partial Approval)  | \$9.65  | Manual Key Entry | `laneId`, `transactionAmount`, **`invokeManualEntry: true`**, **`configuration.allowPartialApprovals: true`** | Partial Approved                |
| S-10   | CP Keyed Credit Card (Balance Response)  | \$32.00 | Manual Key Entry | `laneId`, `transactionAmount`, **`invokeManualEntry: true`**                                                  | Approved + Balance 信息           |

### 2.4 Tip Prompt 流程（小费提示）

> **API 文档参考:** https://triposcert.vantiv.com/api/help/kb/Receipt.html

#### 概述

triPOS Cloud 支持两种小费处理方式：
1. **预置小费** — 商户在 Sale 请求中直接指定小费金额
2. **PIN Pad 小费提示** — 客户在 PIN Pad 上选择小费比例/金额

**重要提示:** 根据卡组织要求，小费提示现在必须在卡片输入**之前**显示（per card brand requirements）。

#### 2.4.1 预置小费（Pre-set Tip）

**使用场景:** 服务员在客户支付前输入小费金额

**请求示例:**
```bash
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
  "laneId": ${LANE_ID},
  "transactionAmount": "50.00",
  "tipAmount": "10.00",
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}"
}
EOF
```

**响应字段:**
| 字段 | 值 | 说明 |
| ---- | -- | ---- |
| `subTotalAmount` | "50.00" | 原始消费金额（不含小费） |
| `tipAmount` | "10.00" | 小费金额 |
| `transactionAmount` | "60.00" | 最终金额（自动计算：subTotal + tip） |

#### 2.4.2 PIN Pad 小费提示（Customer-entered Tip）

**使用场景:** 客户在 PIN Pad 上自行选择小费

**请求示例（百分比）:**
```bash
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
  "laneId": ${LANE_ID},
  "transactionAmount": "50.00",
  "configuration": {
    "enableTipPrompt": true,
    "tipPromptOptions": ["15", "18", "20", "none"]
  },
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}"
}
EOF
```

**请求示例（固定金额）:**
```bash
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
  "laneId": ${LANE_ID},
  "transactionAmount": "50.00",
  "configuration": {
    "enableTipPrompt": true,
    "tipPromptOptions": ["5.00", "10.00", "15.00", "other"]
  },
  "referenceNumber": "${REFERENCE_NUMBER}",
  "ticketNumber": "${TICKET_NUMBER}"
}
EOF
```

**PIN Pad 流程:**
1. 显示小费选项（百分比如 15%/18%/20%/No Tip，或固定金额如 $5/$10/$15/Other）
2. 客户选择小费
   - 百分比选项：triPOS 自动计算小费金额（如 20% × $50 = $10）
   - 固定金额选项：直接使用选定金额（如 $10）
   - "other" 选项：客户手动输入自定义小费金额
3. 显示卡片输入界面
4. 完成支付

**支持的 `tipPromptOptions` 格式:**

| 格式类型 | 示例值 | 说明 |
| -------- | ------ | ---- |
| **百分比** | `"15"`, `"18"`, `"20"` | 百分比数值，**不含 % 符号** |
| **固定金额** | `"5.00"`, `"10.00"`, `"15.00"` | 固定美元金额 |
| **特殊值** | `"none"` | 无小费（No Tip）|
| **特殊值** | `"other"` | 其他金额（客户手动输入）|

**重要提示:**
- 百分比和固定金额可以混用，但建议保持格式一致（全用百分比或全用固定金额）
- 百分比值**不要**包含 % 符号，使用纯数字如 `"20"` 而非 `"20%"`
- 固定金额使用带小数的字符串格式如 `"10.00"`

**响应字段:**
| 字段 | 值 | 说明 |
| ---- | -- | ---- |
| `subTotalAmount` | "50.00" | 原始金额（来自请求的 transactionAmount） |
| `tipAmount` | "10.00" | 客户选择的小费（百分比自动计算，固定金额直接使用） |
| `transactionAmount` | "60.00" | 最终金额（自动计算：subTotalAmount + tipAmount） |

#### 2.4.3 自动计算逻辑

当 `enableTipPrompt: true` 时，triPOS 根据选项格式自动处理：

**百分比格式计算:**
| 步骤 | 计算 | 示例（20% 选项） |
| ---- | ---- | ---- |
| 1 | 客户选择小费比例 | 20% |
| 2 | 计算小费金额 | $50.00 × 20% = $10.00 |
| 3 | 计算最终金额 | $50.00 + $10.00 = $60.00 |

**固定金额格式计算:**
| 步骤 | 计算 | 示例（$10.00 选项） |
| ---- | ---- | ---- |
| 1 | 客户选择固定金额 | $10.00 |
| 2 | 使用选定金额作为小费 | tipAmount = $10.00 |
| 3 | 计算最终金额 | $50.00 + $10.00 = $60.00 |

**"other" 选项处理:**
当客户选择 `"other"` 时，PIN Pad 提示客户手动输入小费金额，输入值直接作为 `tipAmount`。

**注意:** 响应中的 `transactionAmount` 是**最终金额**（含小费），与请求中的 `transactionAmount`（原始金额）不同。

#### 2.4.4 收据打印（Receipt）

使用 `/api/v1/receipt` 打印含小费的收据：

```bash
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/receipt" \
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
  "laneId": ${LANE_ID},
  "receiptType": "Sale",
  "subTotalAmount": "50.00",
  "tipAmount": "10.00",
  "transactionAmount": "60.00",
  "header": ["Restaurant Name", "123 Main St"],
  "footer": ["Thank you!"]
}
EOF
```

**收据显示效果:**
```
Restaurant Name
123 Main St
------------------------
Sale              $50.00
Tip               $10.00
------------------------
Total             $60.00

Thank you!
```

**重要:** 如果 `cashbackAmount` 和 `tipAmount` 都为 0 或不存在，收据**不会显示 Total**。

#### 2.4.5 参数总结

| 参数 | 类型 | 位置 | 说明 |
| ---- | ---- | ---- | ---- |
| `tipAmount` | string | Body | 预置小费金额（与 enableTipPrompt 互斥） |
| `configuration.enableTipPrompt` | boolean | configuration | 启用 PIN Pad 小费提示 |
| `configuration.tipPromptOptions` | array | configuration | 小费选项列表。支持格式：<br>• 百分比：`["15", "18", "20", "none"]`（不含%）<br>• 固定金额：`["5.00", "10.00", "15.00", "other"]` <br>• 混合（不推荐）：`["5.00", "18", "20", "other"]` |
| `subTotalAmount` | string | Response | 原始金额（不含小费） |
| `tipAmount` | string | Response | 小费金额（百分比自动计算，固定金额直接使用） |

---

## 3. POST /api/v1/authorization — Authorization（预授权）

> **API 文档:** https://developerengine.fisglobal.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Authorization

### 3.1 概述

发起 card-present authorization（预授权/冻结资金），后续需通过 Completion 完成交易。

### 3.2 测试用例参数矩阵

| Test # | Test Case Name                           | Amount  | Entry Method     | Required Parameters                                                                                           | Expected Result    |
| ------ | ---------------------------------------- | ------- | ---------------- | ------------------------------------------------------------------------------------------------------------- | ------------------ |
| A-1    | CP Swiped Credit Card                    | \$1.04  | Swipe (MSR)      | `laneId`, `transactionAmount`                                                                                 | Approved           |
| A-2    | CP Swiped Credit Card (Partial Approval) | \$9.65  | Swipe (MSR)      | `laneId`, `transactionAmount`, **`configuration.allowPartialApprovals: true`**                                | Partial Approved   |
| A-3    | CP Swiped Credit Card (Balance Response) | \$32.00 | Swipe (MSR)      | `laneId`, `transactionAmount`                                                                                 | Approved + Balance |
| A-4    | CP Contactless EMV Credit Card           | \$1.08  | Contactless/NFC  | `laneId`, `transactionAmount`                                                                                 | Approved           |
| A-5    | CP EMV Card Insert                       | \$1.06  | EMV Insert       | `laneId`, `transactionAmount`                                                                                 | Approved           |
| A-6    | CP Keyed Credit Card                     | \$1.07  | Manual Key Entry | `laneId`, `transactionAmount`, **`invokeManualEntry: true`**                                                  | Approved           |
| A-7    | CP Keyed Credit Card (Partial Approval)  | \$9.65  | Manual Key Entry | `laneId`, `transactionAmount`, **`invokeManualEntry: true`**, **`configuration.allowPartialApprovals: true`** | Partial Approved   |
| A-8    | CP Keyed Credit Card (Balance Response)  | \$32.00 | Manual Key Entry | `laneId`, `transactionAmount`, **`invokeManualEntry: true`**                                                  | Approved + Balance |

---

## 4. POST /api/v1/authorization/{transactionId}/completion — Authorization Completion（预授权完成）

> **API 文档:** https://developerengine.fisglobal.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Authorization/operation/postv1authorizationtransactionIdcompletion

### 4.1 概述

对已成功的 Authorization 进行 Completion（捕获/结算），将冻结的资金转为实际扣款。

### 4.2 参数分类

#### 必需参数（Mandatory）

| 参数                  | 类型      | 位置       | 说明                                 |
| ------------------- | ------- | -------- | ---------------------------------- |
| `transactionId`     | string  | **Path** | 来自 Authorization 响应的交易 ID          |
| `laneId`            | integer | Body     | Lane ID（终端标识）                      |
| `transactionAmount` | string  | Body     | Completion 金额（可与 Authorization 不同） |

### 4.3 测试用例参数矩阵

| Test # | Test Case Name                                      | Amount  | Required Parameters                                                  | Expected Result       |
| ------ | --------------------------------------------------- | ------- | -------------------------------------------------------------------- | --------------------- |
| C-1    | Completion of Swiped Credit Card                    | \$1.04  | `laneId`, `transactionAmount`, **path:`{transactionId}`** (from A-1) | Approved              |
| C-2    | Completion of Swiped Credit Card (Partial Approval) | \$6.10  | `laneId`, `transactionAmount`, **path:`{transactionId}`** (from A-2) | Approved（金额不同于原 Auth） |
| C-3    | Completion of Swiped Credit Card (Balance Response) | \$32.00 | `laneId`, `transactionAmount`, **path:`{transactionId}`** (from A-3) | Approved              |
| C-4    | Completion of Contactless EMV Credit Card           | \$1.08  | `laneId`, `transactionAmount`, **path:`{transactionId}`** (from A-4) | Approved              |
| C-5    | Completion of EMV Card Insert                       | \$1.06  | `laneId`, `transactionAmount`, **path:`{transactionId}`** (from A-5) | Approved              |
| C-6    | Completion of Keyed Credit Card                     | \$1.07  | `laneId`, `transactionAmount`, **path:`{transactionId}`** (from A-6) | Approved              |
| C-7    | Completion of Keyed Credit Card (Partial Approval)  | \$6.10  | `laneId`, `transactionAmount`, **path:`{transactionId}`** (from A-7) | Approved（金额不同于原 Auth） |
| C-8    | Completion of Keyed Credit Card (Balance Response)  | \$32.00 | `laneId`, `transactionAmount`, **path:`{transactionId}`** (from A-8) | Approved              |

### 4.4 curl 模版

```bash
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
  "laneId": ${LANE_ID},
  "transactionAmount": "1.04"
}
EOF
```

---

## 5. POST /api/v1/refund — Refund（独立退款，需终端交互）

> **API 文档:** https://developerengine.fisglobal.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Refund
> 
> 更多资料: https://triposcert.vantiv.com/api/help/kb/refund.html

### 5.1 概述

独立退款操作（不引用原交易 transactionId），需终端交互（刷卡/插卡/挥卡/手输）。与 Return（引用原交易）不同。

### 5.2 参数分类

#### 必需参数（Mandatory）

| 参数                  | 类型      | 位置   | 说明            |
| ------------------- | ------- | ---- | ------------- |
| `laneId`            | integer | Body | Lane ID（终端标识） |
| `transactionAmount` | string  | Body | 退款金额          |

### 5.3 测试用例参数矩阵

| Test # | Test Case Name                 | Amount  | Entry Method     | Required Parameters                                                 | Expected Result         |
| ------ | ------------------------------ | ------- | ---------------- | ------------------------------------------------------------------- | ----------------------- |
| RF-1   | CP Swiped Credit Card          | \$1.12  | Swipe (MSR)      | `laneId`, `transactionAmount`                                       | Approved (Refund)       |
| RF-2   | CP Swiped PIN Debit Card       | \$31.00 | Swipe (MSR)      | `laneId`, `transactionAmount`, **`configuration.allowDebit: true`** | Approved (Debit Refund) |
| RF-3   | CP Contactless EMV Credit Card | \$2.31  | Contactless/NFC  | `laneId`, `transactionAmount`                                       | Approved                |
| RF-4   | CP EMV Card Insert             | \$2.32  | EMV Insert       | `laneId`, `transactionAmount`                                       | Approved                |
| RF-5   | CP Keyed Credit Card           | \$1.13  | Manual Key Entry | `laneId`, `transactionAmount`, **`invokeManualEntry: true`**        | Approved                |

---

## 6. POST /api/v1/return/{transactionId}/{paymentType} — Return（引用原交易退款）

> **API 文档:** https://developerengine.fisglobal.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Return
> 
> 更多资料: https://triposcert.vantiv.com/api/help/kb/return.html

### 6.1 概述

引用原交易的退款操作（需原 transactionId），无需终端交互。支持全额退款和部分退款。

### 6.2 参数分类

#### 必需参数（Mandatory）

| 参数                  | 类型      | 位置       | 说明                             |
| ------------------- | ------- | -------- | ------------------------------ |
| `transactionId`     | string  | **Path** | 原交易 ID                         |
| `paymentType`       | string  | **Path** | 支付类型（Credit/Debit/EBT/Gift） |
| `laneId`            | integer | Body     | Lane ID（终端标识）                  |
| `transactionAmount` | string  | Body     | 退款金额（全额或部分）                    |

**paymentType 枚举值:** `Credit`, `Debit`, `EBT`, `Gift`

### 6.3 测试用例参数矩阵

| Test # | Test Case Name                        | Amount  | Required Parameters                                                                                                | Expected Result |
| ------ | ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ | --------------- |
| RT-1   | Return of Swiped Credit Card          | \$1.04  | `laneId`, `transactionAmount`, **path:`{transactionId}`** (from S-1), **path:`{paymentType}`** (Credit)            | Approved        |
| RT-2   | Return of Contactless EMV Credit Card | \$1.08  | `laneId`, `transactionAmount`, **path:`{transactionId}`** (from S-7), **path:`{paymentType}`** (Credit)            | Approved        |
| RT-3   | Return of Keyed Credit Card           | \$1.07  | `laneId`, `transactionAmount`, **path:`{transactionId}`** (from S-8), **path:`{paymentType}`** (Credit)            | Approved        |
| RT-4   | Partial Return of Swiped Credit Card  | \$0.50  | `laneId`, **`transactionAmount: "0.50"`** (partial), **path:`{transactionId}`**, **path:`{paymentType}`** (Credit) | Approved        |
| RT-5   | Partial Return of Keyed Credit Card   | \$0.53  | `laneId`, **`transactionAmount: "0.53"`** (partial), **path:`{transactionId}`**, **path:`{paymentType}`** (Credit) | Approved        |

### 6.4 curl 模版

```bash
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
  "laneId": ${LANE_ID},
  "transactionAmount": "1.04"
}
EOF
```

---

## 7. POST /api/v1/reversal/{transactionId}/{paymentType} — Reversal（冲正/全额撤销）

> **API 文档:** https://developerengine.fisglobal.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Reversal

### 7.1 概述

全额冲正/撤销操作。认证脚本要求做 **full reversal（全额冲正）**。

### 7.2 参数分类

#### 必需参数（Mandatory）

| 参数                  | 类型      | 位置       | 说明                             |
| ------------------- | ------- | -------- | ------------------------------ |
| `transactionId`     | string  | **Path** | 原交易 ID                         |
| `paymentType`       | string  | **Path** | 支付类型（Credit/Debit/EBT/Gift） |
| `laneId`            | integer | Body     | Lane ID（终端标识）                  |
| `transactionAmount` | string  | Body     | 冲正金额（全额）                      |

### 7.3 测试用例参数矩阵

| Test # | Test Case Name                               | Amount  | Required Parameters                                                                                    | Expected Result     |
| ------ | -------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ | ------------------- |
| RV-1   | Full Reversal of Swiped Credit Card          | \$1.00  | `laneId`, `transactionAmount`, **path:`{transactionId}`**, **path:`{paymentType}`** (Credit)           | Approved (Reversed) |
| RV-2   | Full Reversal of Swiped PIN Debit Card       | \$31.00 | `laneId`, `transactionAmount`, **path:`{transactionId}`** (from S-4), **path:`{paymentType}`** (Debit) | Approved (Reversed) |
| RV-3   | Full Reversal of Contactless MSD Credit Card | \$1.00  | `laneId`, `transactionAmount`, **path:`{transactionId}`**, **path:`{paymentType}`** (Credit)           | Approved (Reversed) |
| RV-4   | Full Reversal of EMV Card Insert             | \$1.00  | `laneId`, `transactionAmount`, **path:`{transactionId}`**, **path:`{paymentType}`** (Credit)           | Approved (Reversed) |
| RV-5   | Full Reversal of Keyed Credit Card           | \$1.00  | `laneId`, `transactionAmount`, **path:`{transactionId}`**, **path:`{paymentType}`** (Credit)           | Approved (Reversed) |
| RV-6   | Full Reversal via Direct Express             | any     | 如原 Sale 通过 triPOS 提交，需在 Express 请求中提交相同 LaneNumber                                                     | 通过 Express 直接冲正     |

**注意:** RV-3 使用 **MSD**（Magnetic Stripe Data，磁条数据）而非 EMV contactless。

### 7.4 curl 模版

```bash
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/reversal/${ORIGINAL_TXN_ID}/${PAYMENT_TYPE}" \
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
  "laneId": ${LANE_ID},
  "transactionAmount": "1.00"
}
EOF
```

---

## 8. POST /api/v1/void/{transactionId} — Void（撤销/取消）

> **API 文档:** https://developerengine.fisglobal.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Void

### 8.1 概述

对尚未结算的交易做撤销/取消。

### 8.2 参数分类

#### 必需参数（Mandatory）

| 参数              | 类型      | 位置       | 说明            |
| --------------- | ------- | -------- | ------------- |
| `transactionId` | string  | **Path** | 原交易 ID        |
| `laneId`        | integer | Body     | Lane ID（终端标识） |

**注意:** Void **不需要**在 body 中传 `transactionAmount`（只需 laneId）

### 8.3 测试用例参数矩阵

| Test # | Test Case Name                      | Required Parameters                            | Expected Result |
| ------ | ----------------------------------- | ---------------------------------------------- | --------------- |
| V-1    | Void of Swiped Credit Card          | `laneId`, **path:`{transactionId}`** | Voided          |
| V-2    | Void of Contactless EMV Credit Card | `laneId`, **path:`{transactionId}`** | Voided          |
| V-3    | Void of EMV Card Insert             | `laneId`, **path:`{transactionId}`** | Voided          |
| V-4    | Void of Keyed Credit Card           | `laneId`, **path:`{transactionId}`** | Voided          |

### 8.4 curl 模版

```bash
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/void/${ORIGINAL_TXN_ID}" \
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
  "laneId": ${LANE_ID}
}
EOF
```

---

## 9. POST /api/v1/force/credit — Force（强制入账）

> **API 文档:** https://developerengine.fisglobal.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Force

### 9.1 概述

Force 交易用于将之前通过电话/语音授权获取的 approval code 强制入账。

### 9.2 参数分类

#### 必需参数（Mandatory）

| 参数                  | 类型      | 位置   | 说明                                |
| ------------------- | ------- | ---- | --------------------------------- |
| `laneId`            | integer | Body | Lane ID（终端标识）                     |
| `transactionAmount` | string  | Body | 交易金额                              |
| `approvalNumber`    | string  | Body | **REQUIRED** — 语音授权获得的批准码 |

### 9.3 测试用例参数矩阵

| Test # | Test Case Name                 | Amount  | Entry Method     | Required Parameters                                                                                  | Expected Result   |
| ------ | ------------------------------ | ------- | ---------------- | ---------------------------------------------------------------------------------------------------- | ----------------- |
| F-1    | CP Swiped Credit Card          | \$3.10  | Swipe (MSR)      | `laneId`, `transactionAmount`, **`approvalNumber`** (from voice auth)                                | Approved (Forced) |
| F-2    | CP Contactless EMV Credit Card | \$2.31  | Contactless/NFC  | `laneId`, `transactionAmount`, **`approvalNumber`** (from voice auth)                                | Approved (Forced) |
| F-3    | CP Keyed Credit Card           | \$3.13  | Manual Key Entry | `laneId`, `transactionAmount`, **`approvalNumber`** (from voice auth), **`invokeManualEntry: true`** | Approved (Forced) |

---

## 10. GET /api/v1/binQuery/{laneId} — BIN Query（卡 BIN 查询）

> **API 文档:** https://developerengine.fisglobal.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/BinQuery

### 10.1 概述

在不执行交易的情况下查询卡的 BIN（Bank Identification Number）信息。需要终端读卡交互。**无金额**。

### 10.2 参数分类

#### 必需参数（Mandatory）

| 参数       | 类型      | 位置       | 说明            |
| -------- | ------- | -------- | ------------- |
| `laneId` | integer | **Path** | Lane ID（终端标识） |

#### 认证相关参数（Certification-Related）

| 参数                  | 类型      | 位置        | 用于测试用例 | 说明                |
| ------------------- | ------- | --------- | ------ | ----------------- |
| `invokeManualEntry` | boolean | **Query** | BQ-3   | 直接调用手动输入模式        |
| `isCscSupported`    | string  | **Query** | BQ-3   | 提示持卡人输入 CSC（卡安全码） |

### 10.3 测试用例参数矩阵

| Test # | Test Case Name              | Entry Method     | Required Parameters                                                                      | Expected Result    |
| ------ | --------------------------- | ---------------- | ---------------------------------------------------------------------------------------- | ------------------ |
| BQ-1   | Swiped Credit Card          | Swipe (MSR)      | **path:`{laneId}`**                                                                      | 返回 BIN 信息（卡品牌/类型等） |
| BQ-2   | Contactless EMV Credit Card | Contactless/NFC  | **path:`{laneId}`**                                                                      | 返回 BIN 信息          |
| BQ-3   | Keyed Credit Card           | Manual Key Entry | **path:`{laneId}`**, **query:`invokeManualEntry=true`**, **query:`isCscSupported=true`** | 返回 BIN 信息          |

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

# BQ-3: BIN Query with Manual Entry
curl -sS "${HOST}/api/v1/binQuery/${LANE_ID}?invokeManualEntry=true&isCscSupported=true" \
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

## 11. POST /api/v1/cancel — Cancel（取消交易）

> **API 文档:** https://triposcert.vantiv.com/api/help/kb/cancel.html

### 11.1 概述

取消正在进行的交易。用于在交易完成前终止交易流程。

### 11.2 参数分类

#### 必需参数（Mandatory）

| 参数       | 类型      | 位置   | 说明            |
| -------- | ------- | ---- | ------------- |
| `laneId` | integer | Body | Lane ID（终端标识） |

### 11.3 curl 模版

```bash
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/cancel" \
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
  "laneId": ${LANE_ID}
}
EOF
```

---

## 12. Level 2 Processing（Level 2 数据处理）

> **参考:** https://developerengine.fisglobal.com/apis/express/features/level-2-data#express-level-ii-data

### 12.1 概述

Level 2（Level II）数据用于帮助商业卡（commercial cards）获得最低 interchange 费率。

### 12.2 Level 2 字段

| Level 2 字段                   | 说明                   | 要求                                            |
| ---------------------------- | -------------------- | --------------------------------------------- |
| `salesTaxAmount`             | 销售税金额                | 必须 > 0.1% of sale amount（免税交易不符合 Level II 费率） |
| `commercialCardCustomerCode` | 商业卡客户代码（如 PO Number） | 建议填写                                          |
| `shippingZipcode`            | 收货邮编                 | 建议填写                                          |
| `ticketNumber`               | 票据号                  | 建议填写                                          |
| `billingName`                | 账单姓名                 | 建议填写                                          |

### 12.3 测试用例参数矩阵

| #      | Test Case                       | Amount  | Entry Method | Level 2 数据     | Expected Result         |
| ------ | ------------------------------- | ------- | ------------ | -------------- | ----------------------- |
| L2S-1  | CP Swiped Credit Card (L2 Sale) | \$3.00  | Swipe (MSR)  | 含完整 Level 2 字段 | Approved + L2 Qualified |
| L2S-2  | CP EMV Card Insert (L2 Sale)    | \$4.00  | EMV Insert   | 含完整 Level 2 字段 | Approved + L2 Qualified |
| L2A-1  | CP Swiped Credit Card (L2 Auth) | \$5.00  | Swipe (MSR)  | 含完整 Level 2 字段 | Approved + L2 Qualified |
| L2A-2  | CP EMV Card Insert (L2 Auth)    | \$6.00  | EMV Insert   | 含完整 Level 2 字段 | Approved + L2 Qualified |

---

## 13. Duplicate Transaction Handling（重复交易处理）

> **基于认证脚本 ExpressCertificationScript_triPOSCloud_Retail 的规范**

### 13.1 概述

Duplicate Checking 是 host-based 的功能，可按交易维度开启/关闭。检测规则：

- 相同卡号（Same Card Number）
- 相同交易金额（Same Transaction Amount）
- 特定交易类型（Specific Transaction Category: Sale, Return, etc.）
- 同一 batch 内最近 25 笔交易

### 13.2 重复检测控制参数

| 参数                          | 作用                                                      | 建议                  |
| --------------------------- | ------------------------------------------------------- | ------------------- |
| `duplicateOverrideFlag`     | 设为 `true` 时，如果 host 判定为重复交易，则覆盖/绕过重复检测（per-transaction） | 用于"确认是有意重复"的场景      |
| `duplicateCheckDisableFlag` | 设为 `true` 时，完全禁用该笔交易的重复检测（per-transaction）              | **推荐使用此参数**（认证脚本建议） |

### 13.3 测试用例矩阵

> **重要：以下三个测试用例必须使用同一张卡（SAME CARD FOR ALL TRANSACTIONS BELOW）**

| #      | Test Case                                                  | Amount  | 操作说明                                                                           | Expected Result                |
| ------ | ---------------------------------------------------------- | ------- | ------------------------------------------------------------------------------ | ------------------------------ |
| DUP-1  | Process Sale transaction or Auth                           | \$1.70  | 正常发起 Sale/Auth                                                                 | Approved                       |
| DUP-2  | Process duplicate Sale transaction                         | \$1.70  | 用同卡同金额再次发起 Sale，可设置 `checkForDuplicateTransactions: true`，如收到 23 响应则做 DUP-3 | 收到 duplicate 响应（statusCode=23） |
| DUP-3  | CP Swiped or EMV with DuplicateOverrideFlag or DuplicateCheckDisableFlag | \$1.70  | CP Swiped Credit Card 或 EMV，设置 `duplicateOverrideFlag: true` 或 `duplicateCheckDisableFlag: true` | Approved（绕过重复检测）               |

---

## 14. 其他 triPOS 端点（可选）

### 14.1 限频警告

> **重要（来自认证脚本）**:
> 
> Status check requests should be submitted at a maximum rate of no more than one (1) status check every two (2) minutes.

### 14.2 POST /api/v1/display — 向 PIN Pad 发送显示内容

> **API 文档:** 
> - https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Display
> - https://triposcert.vantiv.com/api/help/kb/display.html

#### 概述

向 PIN Pad 发送自定义显示内容。该端点仅支持两个参数。

#### 参数分类

##### 必需参数（Mandatory）

| 参数       | 类型      | 位置   | 说明            |
| -------- | ------- | ---- | ------------- |
| `laneId` | integer | Body | Lane ID（终端标识） |
| `text`   | string  | Body | 要显示的文本内容      |

#### curl 模版

```bash
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/display" \
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
  "laneId": ${LANE_ID},
  "text": "Welcome to Our Store"
}
EOF
```

### 14.3 POST /api/v1/idle — 将 PIN Pad 设置为空闲状态

> **API 文档:** https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Idle

#### 参数分类

##### 必需参数（Mandatory）

| 参数       | 类型      | 位置   | 说明            |
| -------- | ------- | ---- | ------------- |
| `laneId` | integer | Body | Lane ID（终端标识） |

#### curl 模版

```bash
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/idle" \
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
  "laneId": ${LANE_ID}
}
EOF
```

### 14.4 GET /api/v1/input/{laneId} — 从 PIN Pad 获取用户输入

> **API 文档:** 
> - https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Input
> - https://triposcert.vantiv.com/api/help/kb/input.html

#### 概述

允许客户端在 PIN Pad 上显示提示并通过键盘接受持卡人输入。triPOS 提供一组预定义的提示和格式。

#### 参数分类

##### 必需参数（Mandatory）

| 参数       | 类型      | 位置       | 说明            |
| -------- | ------- | -------- | ------------- |
| `laneId` | integer | **Path** | Lane ID（终端标识） |

##### 查询参数（Query Parameters）

| 参数           | 类型     | 必需     | 说明                                       |
| ------------ | ------ | ------ | ---------------------------------------- |
| `promptType` | string | 建议     | 预定义提示类型（如：Amount, AccountNumber, ZIPCode 等） |
| `formatType` | string | 可选     | 输入格式类型（如：AmountWithDollarCommaDecimal）       |

**重要说明:**
- 如果未指定 `formatType`，triPOS 将为每个 `promptType` 应用默认格式
- 格式仅影响 PIN Pad 屏幕上的显示方式，triPOS 始终返回原始输入值
- 例如：格式为 `AmountWithDollarCommaDecimal` 时，持卡人输入 "100" 显示为 "$1.00"，但 triPOS 返回 "100"

#### curl 模版

```bash
# Input with promptType and formatType
export TP_REQUEST_ID="$(uuidgen)"
curl -sS "${HOST}/api/v1/input/${LANE_ID}?promptType=Amount&formatType=AmountWithDollarCommaDecimal" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}"
```

### 14.5 GET /api/v1/selection/{laneId} — 从 PIN Pad 获取用户选择

> **API 文档:** 
> - https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Selection/operation/getv1selectionlaneId
> - https://triposcert.vantiv.com/api/help/kb/selection.html

#### 概述

使用 MultiOption 表单从持卡人获取多个选项中的一个选择。每个选项在 PIN Pad 上显示为一个按钮。

#### 参数分类

##### 必需参数（Mandatory）

| 参数       | 类型      | 位置       | 说明            |
| -------- | ------- | -------- | ------------- |
| `laneId` | integer | **Path** | Lane ID（终端标识） |

##### 查询参数（Query Parameters）

| 参数             | 类型     | 必需     | 说明                                                                                           |
| -------------- | ------ | ------ | -------------------------------------------------------------------------------------------- |
| `form`         | string | **是**   | 表单类型（`MultiOption`）                                                                         |
| `text`         | string | 可选     | 提示文本（单线显示）。**注意**: 空或缺失会显示空白屏幕                                                         |
| `multiLineText` | string | 可选     | 多行文本，每行用管道符 `\|` 分隔。例如：`line1\|line2\|line3`。仅特定 PIN Pad 支持（Vx805, Vx690, Mx915/925）。如设备不支持则自动回退到 `text` 参数 |
| `options`      | string | **是**   | 选项按钮列表，每个选项用管道符 `\|` 分隔，在 PIN Pad 上显示为按钮。例如：`one\|two\|three` 显示为三个按钮                                          |

**重要说明:**
- 使用 `multiLineText` 时，每行用 `|` 分隔。例如：`line1|line2|line3`
- 如 `multiLineText` 为空或所有行为空，triPOS 将使用 `text` 参数
- 如 `multiLineText` 行数超过 PIN Pad 显示能力，triPOS 将截断而不报错
- Verifone Mx915/925 支持使用 `%0A`（URL 编码的换行符）实现多行显示

#### curl 模版

```bash
# MultiOption selection
export TP_REQUEST_ID="$(uuidgen)"
curl -sS "${HOST}/api/v1/selection/${LANE_ID}?form=MultiOption&text=Please%20choose%20an%20option&options=one|two|three" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}"

# MultiOption with multiLineText
export TP_REQUEST_ID="$(uuidgen)"
curl -sS "${HOST}/api/v1/selection/${LANE_ID}?form=MultiOption&multiLineText=line1|line2|line3&options=one|two|three" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}"
```

### 14.6 GET /api/v1/signature/{laneId} — 从 PIN Pad 获取签名

> **API 文档:** 
> - https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Signature/operation/getv1signaturelaneId
> - https://triposcert.vantiv.com/api/help/kb/signature.html

#### 概述

显示文本并要求持卡人签名。支持两种表单类型：`simple`（简单签名框）和 `contract`（合同表单，含标题、副标题、文本区域和签名框）。

#### 参数分类

##### 必需参数（Mandatory）

| 参数       | 类型      | 位置       | 说明            |
| -------- | ------- | -------- | ------------- |
| `laneId` | integer | **Path** | Lane ID（终端标识） |

##### 查询参数（Query Parameters）

| 参数        | 类型     | 必需     | 说明                                                                    |
| --------- | ------ | ------ | --------------------------------------------------------------------- |
| `form`    | string | **是**   | 表单类型（`simple` 或 `contract`）                                        |
| `header`  | string | 可选     | 合同表单的标题（仅 `form=contract` 时使用）                                    |
| `subHeader` | string | 可选     | 合同表单的副标题（仅 `form=contract` 时使用）                                  |
| `text`    | string | 可选     | 合同表单文本区域的内容（仅 `form=contract` 时使用）。最大字符数：8,135              |

**重要说明:**
- `simple` 表单：仅显示签名框，屏幕保持显示直到持卡人选择 "OK"、"Cancel" 或收到新请求
- `contract` 表单：显示标题、副标题、滚动文本区域和签名框
- 签名后通常跟随交易请求或调用 `/api/v1/idle` 返回空闲屏幕

#### curl 模版

```bash
# Simple signature
export TP_REQUEST_ID="$(uuidgen)"
curl -sS "${HOST}/api/v1/signature/${LANE_ID}?form=simple" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}"

# Contract signature
export TP_REQUEST_ID="$(uuidgen)"
curl -sS "${HOST}/api/v1/signature/${LANE_ID}?form=contract&header=The%20Header&subHeader=The%20Subheader&text=A%20large%20text%20area" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}"
```

### 14.7 GET /api/v1/status/host — 检查 host 连接状态

> **API 文档:** https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Status/operation/getv1statushost

#### curl 模版

```bash
export TP_REQUEST_ID="$(uuidgen)"
curl -sS "${HOST}/api/v1/status/host" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}"
```

### 14.8 GET /api/v1/status/triPOS/{echo} — 检查 triPOS 服务状态

> **API 文档:** https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Status/operation/getv1statustriPOSecho

#### 参数分类

##### 必需参数（Mandatory）

| 参数    | 类型     | 位置       | 说明                 |
| ----- | ------ | -------- | ------------------ |
| `echo` | string | **Path** | Echo 字符串（任意值即可） |

#### curl 模版

```bash
export TP_REQUEST_ID="$(uuidgen)"
curl -sS "${HOST}/api/v1/status/triPOS/hello" \
  -H "tp-application-id: ${TP_APP_ID}" \
  -H "tp-application-name: ${TP_APP_NAME}" \
  -H "tp-application-version: ${TP_APP_VERSION}" \
  -H "tp-request-id: ${TP_REQUEST_ID}" \
  -H "tp-authorization: ${TP_AUTH}" \
  -H "tp-express-acceptor-id: ${TP_EXPRESS_ACCEPTOR_ID}" \
  -H "tp-express-account-id: ${TP_EXPRESS_ACCOUNT_ID}" \
  -H "tp-express-account-token: ${TP_EXPRESS_ACCOUNT_TOKEN}"
```

### 14.9 POST /api/v1/receipt — 收据处理

> **API 文档:** 
> - https://docs.worldpay.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Receipt/operation/postv1receipt
> - https://triposcert.vantiv.com/api/help/kb/Receipt.html

#### 概述

在支持打印的 PIN Pad 上打印收据。支持使用默认模板或请求中提供的自定义模板格式化交易数据。

#### 支持的 PIN Pad 型号

**Ingenico 设备:**
- Lane5000, Lane7000, Lane7000 Deluxe, Lane8000, Lane8000 Deluxe, Move5000

**Verifone 设备:**
- Mx915, Mx925

**注:** 仅上述列出的 PIN Pad 型号支持收据打印功能。

#### 参数分类

##### 必需参数（Mandatory）

| 参数       | 类型      | 位置   | 说明            |
| -------- | ------- | ---- | ------------- |
| `laneId` | integer | Body | Lane ID（终端标识） |

##### 可选参数（Optional）

| 参数              | 类型     | 说明                                       |
| --------------- | ------ | ---------------------------------------- |
| `customTemplate`  | string | 自定义收据模板（如不指定则使用默认模板）                      |
| `countryCode`     | string | 国家代码（如 `"Can"` 表示加拿大）                    |
| `language`        | string | 语言（如 `"French"`）                         |
| `header`          | array  | 页眉文本数组（每行一个字符串）                            |
| `footer`          | array  | 页脚文本数组（每行一个字符串）                            |
| `receiptType`     | string | 收据类型（`Sale`, `Refund`, `Void`, `Authorization`） |
| `subTotalAmount`  | string | 小计金额                                     |
| `tipAmount`       | string | 小费金额                                     |
| `cashbackAmount`  | string | 返现金额                                     |
| `accountType`     | string | 账户类型（加拿大法语收据使用）                            |
| `pinVerified`     | boolean| PIN 是否已验证                                |
| `emv`             | object | EMV 数据对象                                 |

#### 默认模板处理逻辑

- 所有 EMV 数据始终显示
- `receiptType` 始终显示在 `subTotalAmount` 左侧
- 如 `cashbackAmount` 和 `tipAmount` 都不存在或为 0，则不显示 Total
- 如交易被拒，不显示签名、PIN 验证和协议部分
- 如 `pinVerified` 为 true，不显示签名部分
- 如存在 `emv.Tags`，不显示 PIN 验证部分
- `header` 和 `footer` 数组中每个字符串单独显示一行
- 请求中不包含的非必需字段，其占位符将被移除

#### 模板占位符

默认模板使用双花括号作为占位符，例如：`{{fieldName}}`

custom tags 示例：`@{Center}{{ApplicationLabel}}`

#### curl 模版

```bash
# Receipt with default template
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/receipt" \
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
  "laneId": ${LANE_ID},
  "receiptType": "Sale",
  "subTotalAmount": "10.00",
  "tipAmount": "2.00",
  "header": ["Store Name", "123 Main St"],
  "footer": ["Thank you!", "Come again"]
}
EOF

# Receipt with custom template
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/receipt" \
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
  "laneId": ${LANE_ID},
  "customTemplate": "{{receiptType}}\nAmount: {{subTotalAmount}}",
  "receiptType": "Sale",
  "subTotalAmount": "10.00"
}
EOF

# French receipt for Canada
export TP_REQUEST_ID="$(uuidgen)"
curl -sS -X POST "${HOST}/api/v1/receipt" \
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
  "laneId": ${LANE_ID},
  "countryCode": "Can",
  "language": "French",
  "receiptType": "Sale",
  "accountType": "Chequing",
  "subTotalAmount": "10.00"
}
EOF
```

---

## 15. 交易状态查询与对账

### 15.1 Transaction Query — `POST /api/v1/transactionQuery`

> **API 文档:** https://developerengine.fisglobal.com/apis/tripos/tripos-cloud/tripos-transaction/api-specification#tag/Query

- 用途: 按条件查询交易记录（用于对账、补偿、状态确认）
- **必需字段**: `approvalNumber`, `referenceNumber`, `terminalId`, `transactionDateTimeBegin`, `transactionDateTimeEnd`, `transactionId`

### 15.2 Payrix Pro 资金对账

- `GET /disbursements`: 按 merchant/entity + 时间窗拉取打款汇总
- `GET /disbursementEntries`: 拉取 disbursement 明细行（含 embed 扩展）

---

## 16. 认证方式与请求头

### 16.1 通用请求头（所有 Transaction API 端点）

| Header                     | Required   | 来源                                 |
| -------------------------- | ---------- | ---------------------------------- |
| `tp-application-id`        | Yes        | 我们应用配置                             |
| `tp-application-name`      | Yes        | 我们应用配置                             |
| `tp-application-version`   | Yes        | 我们应用配置                             |
| `tp-authorization`         | Yes        | `Version=1.0`                      |
| `tp-express-acceptor-id`   | Yes        | Payrix Portal (VCore Platform IDs) |
| `tp-express-account-id`    | Yes        | Payrix Portal (VCore Platform IDs) |
| `tp-express-account-token` | Yes        | Payrix Portal (VCore Platform IDs) |
| `tp-request-id`            | Yes        | 每次请求生成 UUID                        |
| `Content-Type`             | Yes (POST) | `application/json`                 |

### 16.2 环境变量模版

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
export LANE_ID=1
export PAYMENT_TYPE="Credit"
```

---

## 17. 响应处理与状态码

### 17.1 HTTP 状态码（先判断）

| HTTP Code | 含义                |
| --------- | ----------------- |
| 200       | 成功（再看 statusCode） |
| 4xx       | 客户端错误             |
| 5xx       | 服务端错误             |

### 17.2 triPOS statusCode（再判断）

| statusCode | 含义                 | 典型场景                        |
| ---------- | ------------------ | --------------------------- |
| 0          | Approved / Success | 交易成功                        |
| 5          | Partial Approved   | 部分批准（余额不足）                  |
| 7          | DCC Requested      | Dynamic Currency Conversion |
| 20         | Declined           | 交易被拒                        |
| 23         | Duplicate          | 重复交易（需处理 DUP-3）              |
