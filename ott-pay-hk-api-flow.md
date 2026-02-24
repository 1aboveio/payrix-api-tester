# OTT PAY HK API Business Flow Documentation

> Generated from API Spec: https://docs.hksd.ottpayhk.com/

---

## Table of Contents

1. [Overview](#overview)
2. [Merchant Onboarding Flow](#1-merchant-onboarding-flow)
3. [Authorization Flow](#2-authorization-flow)
4. [VA Collection Flow](#3-va-virtual-account-collection-flow)
5. [Trade Collection Flow](#4-trade-collection-flow)
6. [Trade Order & Matching Flow](#5-trade-order--matching-flow)
7. [E-commerce Order Flow](#6-e-commerce-order-flow)
8. [Payment/Disbursement Flow](#7-paymentdisbursement-flow)
9. [Account Holder Management](#8-account-holder-management)
10. [Settlement Receiver Management](#9-settlement-receiver-management)
11. [Entity Relationships](#10-entity-relationships)
12. [Status Codes](#11-status-codes)

---

## Overview

| Item | Value |
|------|-------|
| Protocol | HTTPS + JSON |
| Security | RSA Encryption + SHA1withRSA Signature |
| Base URL (Prod) | `https://xxx.ottpayhk.com` |
| Base URL (Test) | `https://xxx.uat.ottpayhk.com` |

### Request Structure

```json
{
  "head": {
    "version": "1.0.0",
    "tradeType": "00",
    "tradeTime": "1551341750",
    "tradeCode": "tpXXXX",
    "language": "cn"
  },
  "body": { }
}
```

### Response Structure

```json
{
  "head": {
    "version": "1.0.0",
    "tradeType": "01",
    "tradeTime": "1551341750",
    "tradeCode": "tpXXXX",
    "respCode": "S00000",
    "respDesc": "请求成功"
  },
  "body": { }
}
```

---

## 1. Merchant Onboarding Flow

### Flow Diagram

```mermaid
sequenceDiagram
    participant Platform
    participant OTT as OTT PAY HK

    Note over Platform,OTT: Merchant Onboarding (TP1020)
    Platform->>OTT: POST /api/tp1020<br/>merchantNo, bizFlow, all KYC documents
    OTT-->>Platform: ACCEPT (bizFlow)
    
    Note over Platform,OTT: Async Processing (1-3 days)
    
    OTT->>Platform: POST callbackUrl<br/>TP2004: Merchant Onboarding Result
    Note right of Platform: Status: SUCC/FAIL/REFUSE<br/>Returns: merchantNo, authorizeCode
```

### API Summary

| Code | Name | Type | Description |
|------|------|------|-------------|
| **TP1020** | Agent Merchant Onboarding + VA | Request | Submit merchant KYC docs |
| **TP2004** | Onboarding Result Notification | Callback | Returns merchantNo, authorizeCode |

### TP1020 Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `merOrderNo` | String(32) | O | Merchant order number |
| `email` | String(255) | M | Registration email |
| `phoneAreaCode` | String(10) | M | Phone area code |
| `phoneNum` | String(32) | M | Phone number |
| `referralChannel` | String(16) | M | Agent code (test: 0000000000) |
| `countryCode` | String(2) | M | Country ISO code |
| `merNameEn` | String(255) | M | Merchant English name |
| `certificate` | List | M | Business license docs |
| `shareholder` | List | M | 25%+ shareholders info |
| `legalPerson` | List | C | Legal rep (required for CN) |
| `vaFlag` | String(1) | M | 0=No VA, 1=With VA |
| `vaInfo` | List | C | VA account details |

### TP2004 Callback Fields

| Field | Type | Description |
|-------|------|-------------|
| `bizFlow` | String(32) | Business flow ID |
| `merchantNo` | String(32) | Assigned merchant ID |
| `status` | String(6) | SUCC/FAIL/REFUSE |
| `authorizeCode` | String(32) | Authorization code |

---

## 2. Authorization Flow

### Flow Diagram

```mermaid
sequenceDiagram
    participant Merchant
    participant Platform
    participant OTT as OTT PAY HK

    Note over Merchant,OTT: Step 1: Get Authorization URL
    Platform->>OTT: Build URL<br/>/api/tp9001?merchantNo=xxx&redirectUrl=xxx
    OTT-->>Platform: Authorization URL
    
    Platform->>Merchant: Redirect to OAuth page
    Merchant->>OTT: Complete OAuth in browser
    
    OTT-->>Merchant: Redirect to redirectUrl<br/>?authorizeCode=xxx
    
    Note over Platform,OTT: Step 2: Exchange for Token
    Merchant->>Platform: Forward authorizeCode
    Platform->>OTT: POST /api/tp9002<br/>authorizeCode
    OTT-->>Platform: accessToken (permanent)
```

### API Summary

| Code | Name | Type | Description |
|------|------|------|-------------|
| **TP9001** | Apply Authorization | Redirect | Get OAuth URL |
| **TP9002** | Get accessToken | Request | Exchange code for token |

### TP9001 Request

```
GET /api/tp9001?merchantNo=xxx&redirectUrl=xxx
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `merchantNo` | M | Agent's merchant number |
| `redirectUrl` | M | OAuth completion redirect URL |

### TP9002 Request

```json
{
  "authorizeCode": "e10adc3949ba59abbe56e057f20f883e"
}
```

### TP9002 Response

```json
{
  "accessToken": "7c4a8d09ca3762af61e59520943dc26494"
}
```

> ⚠️ **Note**: Token is currently permanent (no expiration)

---

## 3. VA (Virtual Account) Collection Flow

### Flow Diagram

```mermaid
sequenceDiagram
    participant Platform
    participant OTT as OTT PAY HK
    participant Payer
    participant Bank

    Note over Platform,OTT: VA Account Application
    Platform->>OTT: POST /api/tp1017<br/>parentCode, applyCode, area, currency
    OTT-->>Platform: ACCEPT (bizFlow)
    
    Note over Platform,OTT: Async Processing
    OTT->>Platform: POST callbackUrl<br/>TP2012: VA Result
    
    Note over Platform,OTT: VA Account Query
    Platform->>OTT: POST /api/tp3012<br/>bizFlow
    OTT-->>Platform: vaAccount, accountNo, bankInfo
    
    Note over Payer,Bank: Fund Transfer
    Payer->>Bank: Transfer to VA Account
    Bank->>OTT: Notify funds received
    
    OTT->>Platform: POST callbackUrl<br/>TP2007: Collection Arrival
```

### API Summary

| Code | Name | Type | Description |
|------|------|------|-------------|
| **TP1017** | VA Account Application | Request | Apply for VA |
| **TP2012** | VA Result Notification | Callback | VA approval result |
| **TP3012** | VA Account Query | Query | Get VA details |
| **TP2007** | Collection Arrival Notice | Callback | Funds received |

### VA Account Types (parentCode)

| Code | Type | Description |
|------|------|-------------|
| S | Platform E-commerce | 平台电商 |
| D | Independent Site | 独立站电商 |
| T | Offline Goods Trade | 线下一般货贸 |
| F | Service Trade | 服务贸易 |

### TP3012 Response Example

```json
{
  "list": [{
    "bizFlow": "80823082314163300199",
    "merOrderNo": "LNQ1692771393185",
    "vaInfos": [{
      "accountName": "XDT-GUANGZHOU HELIBAO PAYMENT CO LTD",
      "accountNo": "8808999911436641",
      "swiftCode": "0090081",
      "bankName": "Bank Negara Indonesia (BNI)",
      "currency": "IDR",
      "status": "ON"
    }]
  }]
}
```

---

## 4. Trade Collection Flow

### Flow Diagram

```mermaid
sequenceDiagram
    participant Platform
    participant OTT as OTT PAY HK
    participant Buyer

    Note over Platform,OTT: Funds arrive at VA
    Buyer->>OTT: Wire transfer to VA account
    
    OTT->>Platform: POST callbackUrl<br/>TP2007: Trade Collection Notice
    Note right of Platform: flowNo, receiveAmount,<br/>vaAccount, senderName
    
    Platform->>OTT: POST /api/tp3015<br/>Query flow details
    OTT-->>Platform: Full collection details
    
    Note over Platform: If amount available (availableFlag=1)<br/>proceed to trade order matching
```

### TP2007 Callback Fields

| Field | Type | Description |
|-------|------|-------------|
| `flowNo` | String(32) | Collection flow ID |
| `receiveAmount` | Decimal | Amount received |
| `vaAccount` | String(16) | VA account number |
| `senderName` | String(64) | Payer name |
| `availableFlag` | String(1) | 0=Unavailable, 1=Available |
| `receiveType` | String(1) | S/D/T/F (VA type) |

---

## 5. Trade Order & Matching Flow

### Flow Diagram

```mermaid
sequenceDiagram
    participant Platform
    participant OTT as OTT PAY HK

    Note over Platform,OTT: Step 1: Create Trade Order
    Platform->>OTT: POST /api/tp1012<br/>merOrderNo, amount, buyerName, goodsList
    OTT-->>Platform: ACCEPT (contractNo)
    
    Note over Platform,OTT: Step 2: Order Review
    OTT->>Platform: POST callbackUrl<br/>TP2008: Order Result
    Note right of Platform: Status: ACCEPT/SUCC/FAIL
    
    alt Order Approved
        Note over Platform,OTT: Step 3: Link Collection to Order
        Platform->>OTT: POST /api/tp1013<br/>contractNo, flowNo
        OTT-->>Platform: ACCEPT (bizFlow)
        
        Note over Platform,OTT: Step 4: Linking Review
        OTT->>Platform: POST callbackUrl<br/>TP2009: Linking Result
        Note right of Platform: Status: 02=Approved, 03=Rejected
        
        Note over Platform,OTT: Step 5: Query Status
        Platform->>OTT: POST /api/tp3014<br/>Query linking status
        OTT-->>Platform: Status: 01=Pending, 02=Approved, 03=Rejected
    else Order Rejected
        Note over Platform: Handle rejection reason
    end
```

### API Summary

| Code | Name | Type | Description |
|------|------|------|-------------|
| **TP1012** | Trade Order Application | Request | Create trade contract |
| **TP2008** | Order Result Notification | Callback | Order approval result |
| **TP3013** | Trade Order Query | Query | Query order status |
| **TP1013** | Link Collection to Order | Request | Match flow to contract |
| **TP2009** | Linking Result Notification | Callback | Matching result |
| **TP3014** | Linking Query | Query | Query linking status |

### Trade Order Types (tradeType)

| Code | Type | Description |
|------|------|-------------|
| 00 | Goods Trade | 货物贸易 |
| 01 | Service Trade | 服务贸易 |

---

## 6. E-commerce Order Flow

### Flow Diagram

```mermaid
sequenceDiagram
    participant Platform
    participant OTT as OTT PAY HK

    Note over Platform,OTT: Submit E-commerce Order
    Platform->>OTT: POST /api/tp1016<br/>orderList, transType
    Note right of OTT: Upload order info +<br/>compliance materials
    
    OTT-->>Platform: SUCCESS/FAIL
```

### API Summary

| Code | Name | Type | Description |
|------|------|------|-------------|
| **TP1016** | E-commerce Order Application | Request | Submit e-commerce order info |

### Order Types (transType)

| Code | Type | Description |
|------|------|-------------|
| S | Platform E-commerce | 平台电商 |
| D | Independent Site | 独立站电商 |

---

## 7. Payment/Disbursement Flow

### Flow Diagram

```mermaid
sequenceDiagram
    participant Platform
    participant OTT as OTT PAY HK
    participant Beneficiary

    alt RMB Payment
        Note over Platform,OTT: Step 1: Apply RMB Payment
        Platform->>OTT: POST /api/tp1001<br/>payeeInfo, amount, cNAPSCode
        OTT-->>Platform: ACCEPT
        
        Note over Platform,OTT: Step 2: Optional Confirmation
        Platform->>OTT: POST /api/tp1019<br/>Confirm payment
        OTT-->>Platform: Result
        
        Note over Platform,OTT: Step 3: Payment Result
        OTT->>Platform: POST callbackUrl<br/>TP2001: Payment Result
    else International Remittance
        Note over Platform,OTT: Apply International Remittance
        Platform->>OTT: POST /api/tp1004<br/>beneficiaryInfo, amount, purpose
        OTT-->>Platform: ACCEPT
        
        Note over Platform,OTT: Remittance Result
        OTT->>Platform: POST callbackUrl<br/>TP2006: Remittance Notice
    else FX (Foreign Exchange)
        Note over Platform,OTT: Query FX Rate
        Platform->>OTT: POST /api/tp1002<br/>sellCurrency, buyCurrency, amount
        OTT-->>Platform: quoteId, rate, expireTime
        
        Note over Platform,OTT: Apply FX
        Platform->>OTT: POST /api/tp1027<br/>Apply FX lock
        OTT-->>Platform: ACCEPT
        
        Note over Platform,OTT: Cancel FX (optional)
        Platform->>OTT: POST /api/tp1028<br/>Cancel FX lock
        OTT-->>Platform: Result
    end
    
    Note over OTT,Beneficiary: Funds transferred to beneficiary bank account
```

### API Summary

| Code | Name | Description |
|------|------|-------------|
| **TP1001** | RMB Payment | CNY disbursement to China |
| **TP1019** | RMB Payment Confirmation | Confirm RMB payment |
| **TP2001** | RMB Payment Result | Payment notification |
| **TP1004** | International Remittance | Cross-border wire transfer |
| **TP2006** | Remittance Notice | Remittance notification |
| **TP1002** | FX Rate Query | Query exchange rate |
| **TP1027** | FX Application | Lock in exchange rate |
| **TP1028** | FX Cancellation | Cancel FX lock |

---

## 8. Account Holder Management

### Flow Diagram

```mermaid
sequenceDiagram
    participant Platform
    participant OTT as OTT PAY HK

    Note over Platform,OTT: Account Holder Operations
    alt Add Account Holder
        Platform->>OTT: POST /api/tp1024<br/>holderInfo
        OTT-->>Platform: ACCEPT/FAIL
    else Modify Account Holder
        Platform->>OTT: POST /api/tp1025<br/>holderId, updatedInfo
        OTT-->>Platform: ACCEPT/FAIL
    else Supplement Info
        Platform->>OTT: POST /api/tp1026<br/>holderId, additionalInfo
        OTT-->>Platform: ACCEPT/FAIL
    else Query
        Platform->>OTT: POST /api/tp3018<br/>holderId
        OTT-->>Platform: holderInfo, status
    end
    
    OTT->>Platform: POST callbackUrl<br/>TP2013: Status Change Notification
```

### API Summary

| Code | Name | Description |
|------|------|-------------|
| **TP1024** | Add Account Holder | Add new account holder |
| **TP1025** | Modify Account Holder | Update holder info |
| **TP1026** | Supplement Account Holder Info | Add additional docs |
| **TP3018** | Query Account Holder | Get holder details |
| **TP2013** | Holder Status Change Notification | Status update callback |

---

## 9. Settlement Receiver Management

### Flow Diagram

```mermaid
sequenceDiagram
    participant Platform
    participant OTT as OTT PAY HK

    Note over Platform,OTT: Settlement Receiver Operations
    alt Add Receiver
        Platform->>OTT: POST /api/tp1021<br/>receiverInfo
        OTT-->>Platform: ACCEPT/FAIL
    else Modify Receiver
        Platform->>OTT: POST /api/tp1022<br/>receiverId, updatedInfo
        OTT-->>Platform: ACCEPT/FAIL
    else Delete Receiver
        Platform->>OTT: POST /api/tp1023<br/>receiverId
        OTT-->>Platform: ACCEPT/FAIL
    else Query
        Platform->>OTT: POST /api/tp3017<br/>query criteria
        OTT-->>Platform: receiverList
    end
```

### API Summary

| Code | Name | Description |
|------|------|-------------|
| **TP1021** | Add Settlement Receiver | Add receiver for settlements |
| **TP1022** | Modify Settlement Receiver | Update receiver info |
| **TP1023** | Delete Settlement Receiver | Remove receiver |
| **TP3017** | Query Settlement Receiver | List receivers |

---

## 10. Entity Relationships

### Entity Diagram

```mermaid
erDiagram
    MERCHANT ||--o{ VA_ACCOUNT : "has"
    MERCHANT ||--o{ TRADE_ORDER : "creates"
    MERCHANT ||--o{ ACCOUNT_HOLDER : "manages"
    MERCHANT ||--o{ SETTLEMENT_RECEIVER : "registers"
    
    VA_ACCOUNT ||--o{ COLLECTION_FLOW : "receives"
    
    TRADE_ORDER ||--|| COLLECTION_FLOW : "matches"
    
    COLLECTION_FLOW {
        string flowNo PK
        string vaAccount FK
        decimal receiveAmount
        string status
    }
    
    TRADE_ORDER {
        string contractNo PK
        string merOrderNo FK
        string status
    }
    
    MERCHANT {
        string merchantNo PK
        string bizFlow FK
        string authorizeCode
    }
    
    VA_ACCOUNT {
        string vaAccount PK
        string merchantNo FK
        string accountNo
        string status
    }
```

### Key ID Mapping

| Entity | Key Field | Description |
|--------|-----------|-------------|
| Merchant | `merchantNo` | Assigned by OTT after onboarding |
| Application | `bizFlow` | OTT's business flow ID |
| Trade Order | `contractNo` | From TP1012 |
| Collection Flow | `flowNo` | From TP2007/TP3015 |
| VA Account | `vaAccount` / `accountNo` | Virtual account number |
| Authorization | `authorizeCode` | OAuth code |
| Access Token | `accessToken` | Permanent API token |

---

## 11. Status Codes

### Application Status

| Status | Code | Description |
|--------|------|-------------|
| ACCEPT | 5.1.x | Received, processing |
| SUCC | 5.x.x | Success |
| FAIL | 5.x.x | Failed |
| REFUSE | 5.1.x | Rejected |

### VA Account Status

| Status | Description |
|--------|-------------|
| ON | Active / Enabled |
| OFF | Disabled / Rejected |
| OPENING | Account opening in progress |

### Collection Available Flag

| Flag | Description |
|------|-------------|
| 0 | Not available (pending review) |
| 1 | Available for use |

### Trade Order Status

| Status | Description |
|--------|-------------|
| ACCEPT | Processing |
| SUCC | Approved |
| FAIL | Failed |

### Linking Status

| Status | Description |
|--------|-------------|
| 01 | Pending review |
| 02 | Approved |
| 03 | Rejected |

---

## Appendix: API Quick Reference

| Category | Code | Method | Description |
|----------|------|--------|-------------|
| **Onboarding** | TP1020 | POST | Merchant onboarding + VA |
| | TP2004 | Callback | Onboarding result |
| **Auth** | TP9001 | GET | OAuth URL |
| | TP9002 | POST | Get token |
| **VA** | TP1017 | POST | VA application |
| | TP2012 | Callback | VA result |
| | TP3012 | POST | VA query |
| **Collection** | TP2007 | Callback | Collection notice |
| | TP3015 | POST | Collection query |
| **Trade** | TP1012 | POST | Trade order |
| | TP2008 | Callback | Order result |
| | TP3013 | POST | Order query |
| | TP1013 | POST | Link collection |
| | TP2009 | Callback | Linking result |
| | TP3014 | POST | Linking query |
| **E-commerce** | TP1016 | POST | E-commerce order |
| **Payment** | TP1001 | POST | RMB payment |
| | TP1019 | POST | Payment confirm |
| | TP2001 | Callback | Payment result |
| | TP1004 | POST | International remittance |
| | TP2006 | Callback | Remittance notice |
| **FX** | TP1002 | POST | FX rate query |
| | TP1027 | POST | FX application |
| | TP1028 | POST | FX cancel |
| **Account Holder** | TP1024 | POST | Add holder |
| | TP1025 | POST | Modify holder |
| | TP1026 | POST | Supplement holder |
| | TP3018 | POST | Query holder |
| | TP2013 | Callback | Status change |
| **Settlement** | TP1021 | POST | Add receiver |
| | TP1022 | POST | Modify receiver |
| | TP1023 | POST | Delete receiver |
| | TP3017 | POST | Query receiver |

---

*Document generated from OTT PAY HK API Documentation*
