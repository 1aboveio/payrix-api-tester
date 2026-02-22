# payrix-api-tester Architecture

**Service:** payrix-api-tester  
**Purpose:** Worldpay/FIS triPOS Cloud Certification Testing Platform  
**Tech Stack:** Next.js 16 + React 19 + TypeScript  
**Date:** 2026-02-23  
**Status:** ACTIVE DEVELOPMENT  

---

## Executive Summary

`payrix-api-tester` is a **Next.js 16 web application** for testing and certifying **Worldpay/FIS triPOS Cloud** payment integration. It provides a UI for executing ~61 certification test cases across 17 API endpoints, with predefined templates aligned to the ExpressCertificationScript.

**Key Capabilities:**
- 🧪 **61 Certification Test Templates** — Predefined test cases (S-1..S-10, A-1..A-8, etc.)
- 🔄 **17 API Endpoints** — Full triPOS Cloud API coverage
- 📊 **Request/Response History** — Audit trail with cURL generation
- 🎯 **Template-Based Testing** — One-click test case execution
- 🔧 **Real-time Configuration** — Environment and credential management

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           payrix-api-tester                                  │
│                         (Next.js 16 + React 19)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      App Router (app/)                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │  /lanes  │ │/transactions│ │ /reversals│ │ /utility │ │ /settings│  │   │
│  │  │  (mgmt)  │ │  (sale)   │ │(void/etc)│ │(display) │ │ (config) │  │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │   │
│  │       └─────────────┴─────────────┴─────────────┴──────────────────  │   │
│  │                              │                                       │   │
│  │  ┌───────────────────────────┴───────────────────────────────────┐  │   │
│  │  │                    Server Actions (actions/payrix.ts)          │  │   │
│  │  │  • request validation → PayrixClient → history tracking       │  │   │
│  │  └───────────────────────────┬───────────────────────────────────┘  │   │
│  └──────────────────────────────┼──────────────────────────────────────┘   │
│                                 │                                           │
│  ┌──────────────────────────────┼──────────────────────────────────────┐   │
│  │                    Core Library (lib/payrix/)                       │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │   │
│  │  │   client.ts │ │  types.ts   │ │ templates.ts│ │   curl.ts   │  │   │
│  │  │PayrixClient │ │  type defs  │ │ 61 templates│ │cURL generator│  │   │
│  │  └──────┬──────┘ └─────────────┘ └─────────────┘ └─────────────┘  │   │
│  │         │                                                          │   │
│  │  ┌──────┴─────────────────────────────────────────────────────┐   │   │
│  │  │              HTTP Fetch → triPOS Cloud API                 │   │   │
│  │  └────────────────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Worldpay/FIS triPOS Cloud                              │
│           https://triposcert.vantiv.com (Cert Environment)                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 16.1.6 | App Router, Server Actions |
| **Runtime** | React | 19.2.3 | UI components |
| **Language** | TypeScript | 5.x | Type safety |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **Components** | shadcn/ui | latest | UI primitives |
| **State** | React Hooks | built-in | Local state management |
| **Validation** | Zod | 4.3.6 | Schema validation |
| **Forms** | React Hook Form | 7.71.1 | Form handling |
| **Icons** | Lucide React | 0.563.0 | Icon library |
| **Package Manager** | pnpm | workspace | Monorepo support |

### 1.3 Deployment Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Container** | Docker | Multi-stage Node 22 build |
| **Platform** | Cloud Run | Serverless, auto-scaling |
| **CI/CD** | Cloud Build | Triggered on push to main |
| **Registry** | Artifact Registry | us-central1-docker.pkg.dev |

---

## 2. Project Structure

```
payrix-api-tester/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Dashboard/home
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── globals.css               # Tailwind + global styles
│   │   ├── lanes/                    # Lane Management UI
│   │   │   ├── page.tsx              # List lanes
│   │   │   ├── create/               # Create lane form
│   │   │   └── connection-status/    # Connection status check
│   │   ├── transactions/             # Transaction endpoints
│   │   │   ├── page.tsx              # Transaction list
│   │   │   ├── sale/                 # Sale form + templates
│   │   │   ├── authorization/        # Auth form + templates
│   │   │   ├── completion/           # Completion form
│   │   │   ├── refund/               # Refund form + templates
│   │   │   ├── bin-query/            # BIN Query form
│   │   │   ├── [id]/                 # Transaction detail view
│   │   │   └── ...
│   │   ├── reversals/                # Return/Reversal/Void
│   │   │   ├── return/               # Return transaction
│   │   │   ├── reversal/             # Full reversal
│   │   │   ├── void/                 # Void transaction
│   │   │   └── credit/               # Credit/Refund
│   │   ├── utility/                  # Utility endpoints
│   │   │   ├── display/              # PIN Pad display
│   │   │   ├── idle/                 # Set idle state
│   │   │   ├── input/                # Get keypad input
│   │   │   ├── selection/            # Get selection
│   │   │   ├── signature/            # Capture signature
│   │   │   └── status/               # Host/triPOS status
│   │   ├── receipt/                  # Receipt generation
│   │   ├── history/                  # Request history
│   │   └── settings/                 # Configuration
│   │
│   ├── actions/                      # Server Actions
│   │   └── payrix.ts                 # All API call actions
│   │
│   ├── components/                   # React components
│   │   ├── layout/
│   │   │   └── app-shell.tsx         # Main app shell
│   │   ├── payrix/
│   │   │   ├── api-result-panel.tsx  # Response display
│   │   │   ├── endpoint-info.tsx     # Endpoint documentation
│   │   │   ├── template-selector.tsx # Test case templates
│   │   │   ├── transaction-table.tsx # Transaction list
│   │   │   └── ...
│   │   └── ui/                       # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── sidebar.tsx
│   │       └── ...
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-mobile.ts             # Mobile detection
│   │   └── use-payrix-config.ts      # Config management
│   │
│   └── lib/                          # Core library
│       ├── payrix/
│       │   ├── client.ts             # PayrixClient (HTTP client)
│       │   ├── types.ts              # TypeScript type definitions
│       │   ├── templates.ts          # 61 certification templates
│       │   ├── curl.ts               # cURL command generator
│       │   ├── headers.ts            # Header preview builder
│       │   ├── identifiers.ts        # Ref/ticket generators
│       │   ├── transaction-utils.ts  # Transaction helpers
│       │   └── dal/
│       │       └── transactions.ts   # Data access layer
│       ├── config.ts                 # App configuration
│       ├── storage.ts                # LocalStorage helpers
│       ├── toast.ts                  # Toast notifications
│       └── utils.ts                  # Utility functions
│
├── docs/                             # Documentation
│   └── Payrix TriPOS API 分析 v2.x.md # API analysis docs
│
├── public/                           # Static assets
├── Dockerfile                        # Container build
├── cloudbuild.yaml                   # CI/CD pipeline
├── package.json                      # Dependencies
├── pnpm-workspace.yaml               # pnpm workspace config
├── tsconfig.json                     # TypeScript config
├── next.config.ts                    # Next.js config
└── README.md                         # Project readme
```

---

## 3. Core Components

### 3.1 PayrixClient (`lib/payrix/client.ts`)

HTTP client for triPOS Cloud API with typed request/response handling.

```typescript
class PayrixClient {
  constructor(config: PayrixConfig)
  
  // Lane Management
  async createLane(request: CreateLaneRequest): Promise<RequestResult<CreateLaneResponse>>
  async deleteLane(laneId: string): Promise<RequestResult<DeleteLaneResponse>>
  async listLanes(request?: ListLanesRequest): Promise<RequestResult<ListLanesResponse>>
  
  // Transactions
  async sale(request: SaleRequest): Promise<RequestResult<SaleResponse>>
  async authorization(request: AuthorizationRequest): Promise<RequestResult<AuthorizationResponse>>
  async completion(transactionId: string, request: CompletionRequest): Promise<RequestResult<CompletionResponse>>
  async refund(paymentAccountId: string, request: RefundRequest): Promise<RequestResult<RefundResponse>>
  async returnTransaction(transactionId: string, paymentType: PaymentType, request: ReturnRequest): Promise<RequestResult<ReturnResponse>>
  async reversal(transactionId: string, paymentType: PaymentType, request: ReversalRequest): Promise<RequestResult<ReversalResponse>>
  async voidTransaction(transactionId: string, request: VoidRequest): Promise<RequestResult<VoidResponse>>
  async force(request: ForceRequest): Promise<RequestResult<ForceResponse>>
  async binQuery(request: BinQueryRequest): Promise<RequestResult<BinQueryResponse>>
  
  // Utilities
  async display(request: DisplayRequest): Promise<RequestResult<DisplayResponse>>
  async idle(request: IdleRequest): Promise<RequestResult<IdleResponse>>
  async input(laneId: string): Promise<RequestResult<InputResponse>>
  async selection(laneId: string): Promise<RequestResult<SelectionResponse>>
  async signature(laneId: string): Promise<RequestResult<SignatureResponse>>
  async hostStatus(): Promise<RequestResult<HostStatusResponse>>
  async triPosStatus(echo: string): Promise<RequestResult<TriPosStatusResponse>>
  async laneConnectionStatus(laneId: string): Promise<RequestResult<LaneConnectionStatusResponse>>
}
```

**Key Features:**
- Automatic header generation (`tp-application-*`, `tp-express-*`, `tp-request-id`)
- Request/response serialization
- Error handling with typed errors
- Base URL selection (cert vs prod)

### 3.2 Test Templates (`lib/payrix/templates.ts`)

Preconfigured test cases matching the ExpressCertificationScript.

```typescript
// Sale templates (S-1..S-10 + Level 2 + Duplicate)
export const saleTemplates: TestCaseTemplate[] = [
  { id: 's-1-swipe-credit', name: 'S-1 Swiped Credit ($1.04)', fields: { transactionAmount: '1.04' } },
  { id: 's-2-swipe-partial', name: 'S-2 Swiped Partial ($9.65)', fields: { transactionAmount: '9.65', configuration: { allowPartialApprovals: true } } },
  // ... 13 more templates
];

// Authorization templates (A-1..A-8)
export const authorizationTemplates: TestCaseTemplate[] = [
  // 10 templates
];

// Refund, Return, Reversal, Void, Force, BIN Query templates...
```

**Template Count by Category:**
| Category | Templates | Tests |
|----------|-----------|-------|
| Sale | 15 | S-1..S-10, L2S-1..L2S-2, DUP-1..DUP-3 |
| Authorization | 10 | A-1..A-8, L2A-1..L2A-2 |
| Completion | 8 | C-1..C-8 |
| Refund | 5 | RF-1..RF-5 |
| Return | 5 | RT-1..RT-5 |
| Reversal | 6 | RV-1..RV-6 |
| Void | 4 | V-1..V-4 |
| Force | 3 | F-1..F-3 |
| BIN Query | 3 | BQ-1..BQ-3 |

### 3.3 Server Actions (`actions/payrix.ts`)

Next.js Server Actions for API calls with history tracking.

```typescript
'use server';

// Base actions
export async function executeSale(input: SaleInput): Promise<ServerActionResult<SaleResponse>>
export async function executeAuthorization(input: AuthorizationInput): Promise<ServerActionResult<AuthorizationResponse>>
export async function executeCompletion(input: CompletionInput): Promise<ServerActionResult<CompletionResponse>>
// ... etc for all endpoints

// History management
export async function getServerHistory(): Promise<HistoryEntry[]>
export async function clearServerHistory(): Promise<void>
```

**Features:**
- Server-side API calls (no CORS issues)
- Automatic history entry creation
- Header preview generation
- Error boundary handling

### 3.4 cURL Generator (`lib/payrix/curl.ts`)

Generates equivalent cURL commands for each request.

```typescript
export function buildCurlCommand(
  baseUrl: string,
  endpoint: string,
  method: HttpMethod,
  headers: Record<string, string>,
  body?: unknown
): string
```

**Example Output:**
```bash
curl -X POST 'https://triposcert.vantiv.com/api/v1/sale' \
  -H 'tp-application-id: payrix-api-tester' \
  -H 'tp-application-name: Payrix API Tester' \
  -H 'tp-request-id: 550e8400-e29b-41d4-a716-446655440000' \
  -H 'Content-Type: application/json' \
  -d '{"laneId":"1","transactionAmount":"1.04"}'
```

---

## 4. Data Flow

### 4.1 Test Execution Flow

```
User selects template
        │
        ▼
┌───────────────┐
│ Template data │───► Pre-fills form fields
│ (amount, flags)│    (laneId, transactionAmount, etc.)
└───────────────┘
        │
        ▼
User clicks "Send Request"
        │
        ▼
┌───────────────────┐
│ Server Action     │───► Creates PayrixClient with config
│ (actions/payrix.ts)│    Builds headers (tp-*)
└───────────────────┘     Makes fetch() call
        │
        ▼
┌───────────────────┐
│ triPOS Cloud API  │───► Returns response
│ (vantiv.com)      │    {transactionId, statusCode, ...}
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ History Entry     │───► Saved to serverHistory[]
│ + cURL command    │    Displayed in UI
└───────────────────┘
```

### 4.2 Configuration Flow

```
User enters config in /settings
        │
        ▼
┌───────────────────┐
│ use-payrix-config │───► Validates with Zod schema
│ hook              │    Saves to localStorage
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ All components    │───► Access config via hook
│ read from storage │    PayrixClient initialized
└───────────────────┘     with saved credentials
```

---

## 5. API Endpoints

### 5.1 Implemented Endpoints

| Endpoint | Method | UI Route | Templates |
|----------|--------|----------|-----------|
| `/cloudapi/v1/lanes` | POST | `/lanes/create` | Lane create |
| `/cloudapi/v1/lanes/{id}` | DELETE | `/lanes` (list) | - |
| `/cloudapi/v1/lanes/{id}/connectionstatus` | GET | `/lanes/connection-status` | - |
| `/api/v1/sale` | POST | `/transactions/sale` | 15 templates |
| `/api/v1/authorization` | POST | `/transactions/authorization` | 10 templates |
| `/api/v1/authorization/{id}/completion` | POST | `/transactions/completion` | 8 templates |
| `/api/v1/refund/{id}` | POST | `/reversals/credit` | 5 templates |
| `/api/v1/return/{id}/{type}` | POST | `/reversals/return` | 5 templates |
| `/api/v1/reversal/{id}/{type}` | POST | `/reversals/reversal` | 6 templates |
| `/api/v1/void/{id}` | POST | `/reversals/void` | 4 templates |
| `/api/v1/force/credit` | POST | `/transactions/force` | 3 templates |
| `/api/v1/binQuery/{id}` | GET | `/transactions/bin-query` | 3 templates |
| `/api/v1/display` | POST | `/utility/display` | - |
| `/api/v1/idle` | POST | `/utility/idle` | - |
| `/api/v1/input/{id}` | GET | `/utility/input` | - |
| `/api/v1/selection/{id}` | GET | `/utility/selection` | - |
| `/api/v1/signature/{id}` | GET | `/utility/signature` | - |
| `/api/v1/status/host` | GET | `/utility/status` | - |
| `/api/v1/status/triPOS/{echo}` | GET | `/utility/status` | - |
| `/api/v1/receipt` | POST | `/receipt` | - |

### 5.2 Request/Response Types

All types defined in `lib/payrix/types.ts`:

```typescript
// Request base
interface SaleRequest {
  laneId: string;
  transactionAmount: string;
  referenceNumber?: string;
  ticketNumber?: string;
  configuration?: {
    allowPartialApprovals?: boolean;
    allowDebit?: boolean;
  };
  invokeManualEntry?: boolean;
  cashBackAmount?: string;
  // ... Level 2 fields
}

// Response base
interface SaleResponse {
  transactionId?: string;
  status?: string;
  statusCode?: number;  // 0=approved, 5=partial, 20=declined, 23=duplicate
  approvalCode?: string;
  responseCode?: string;
  responseMessage?: string;
  // ...
}
```

---

## 6. Configuration

### 6.1 PayrixConfig Schema

```typescript
interface PayrixConfig {
  environment: 'cert' | 'prod';
  expressAcceptorId: string;
  expressAccountId: string;
  expressAccountToken: string;
  applicationId: string;
  applicationName: string;
  applicationVersion: string;
  tpAuthorization: string;  // Usually "Version=1.0"
  defaultLaneId: string;
  defaultTerminalId: string;
}
```

### 6.2 Environment Variables

```bash
# No server-side env vars required (client-side config via UI)
# All credentials stored in localStorage (user's browser)
```

### 6.3 Settings UI

Located at `/settings`:
- Environment selection (cert/prod)
- Express credentials (Acceptor ID, Account ID, Account Token)
- Application info (ID, Name, Version)
- Default Lane/Terminal IDs

---

## 7. Key Features

### 7.1 Template System

Each endpoint page includes a **Template Selector** dropdown:

```tsx
// Example: Sale page
<TemplateSelector
  templates={saleTemplates}
  onSelect={(template) => {
    form.reset(template.fields);  // Auto-fill form
  }}
/>
```

**Template Categories:**
- **Certification Tests:** S-1..S-10, A-1..A-8, etc.
- **Level 2:** L2S-1, L2S-2, L2A-1, L2A-2
- **Duplicate Handling:** DUP-1, DUP-2, DUP-3

### 7.2 History & Audit

Every request is logged with:
- Timestamp
- Endpoint and method
- Request headers (sent)
- Request body
- Response body
- Duration
- cURL equivalent command

**Storage:** Server-side in-memory array (cleared on deploy).

### 7.3 cURL Export

Each history entry includes a generated cURL command for:
- Documentation
- Debugging
- Sharing with team

---

## 8. Development Workflow

### 8.1 Local Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Open http://localhost:3000
```

### 8.2 Build & Deploy

```bash
# Build production
pnpm build

# Docker build
docker build -t payrix-api-tester .

# Cloud Build (CI/CD)
gcloud builds submit --config cloudbuild.yaml
```

### 8.3 Project Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

---

## 9. Deployment

### 9.1 Dockerfile

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

### 9.2 Cloud Build

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/payrix-api-tester:$COMMIT_SHA', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/payrix-api-tester:$COMMIT_SHA']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args:
      - 'run'
      - 'deploy'
      - 'payrix-api-tester'
      - '--image=gcr.io/$PROJECT_ID/payrix-api-tester:$COMMIT_SHA'
      - '--region=us-central1'
```

---

## 10. Dependencies

### 10.1 External Services

| Service | Purpose | Required |
|---------|---------|----------|
| triPOS Cloud Cert | Payment API testing | Yes |
| triPOS Cloud Prod | Production validation | Optional |

### 10.2 Internal Dependencies

None — standalone Next.js application.

---

## 11. Roadmap

### Current (v0.1.0)
- ✅ Basic UI for all endpoints
- ✅ 61 certification templates
- ✅ Request/response history
- ✅ cURL generation

### Next
- [ ] **Test Execution Order Guide** — Visual guide for certification sequence
- [ ] **Transaction Dependency Tracking** — Auto-link Return/Reversal to original Sale
- [ ] **Report Generation** — PDF certification report export
- [ ] **E2E Test Suite** — Playwright tests for critical flows
- [ ] **Multi-Lane Support** — Test multiple lanes simultaneously

---

## 12. References

### Documents
- [Payrix TriPOS API 分析 v2.15](docs/Payrix%20TriPOS%20API%20分析%20v2.15.md)
- [PLAN.md](PLAN.md) — Implementation plan
- [CLAUDE_INSTRUCTIONS.md](CLAUDE_INSTRUCTIONS.md) — AI assistant instructions

### External Links
- [triPOS Cloud API Docs](https://triposcert.vantiv.com/api/swagger-ui-bootstrap/)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

*This architecture reflects the actual implementation as of 2026-02-23. For updates, see git commit history.*
