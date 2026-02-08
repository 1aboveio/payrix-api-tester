# Payrix API Tester - Build Instructions

Build a complete Payrix API Tester web application. This is a tool for product managers/business analysts to test Worldpay Payrix TriPOS APIs without writing code.

## Project is already initialized:
- Next.js 16 with React 19, TypeScript, Tailwind CSS
- shadcn/ui components already installed (button, card, input, label, select, tabs, form, textarea, badge, separator, sheet, sidebar)
- Path: /home/exoulster/.openclaw/workspace-cory/payrix-api-tester

## What to build:

### 1. Layout (src/app/layout.tsx + components)
- Sidebar navigation with sections: Lanes, Transactions, Reversals, Receipt
- Header with app title "Payrix API Tester" and Settings/History buttons
- Dark mode by default

### 2. Settings Page (src/app/settings/page.tsx)
Store config in localStorage:
- Environment toggle: cert (triposcert.vantiv.com) / prod (TBD)
- Express credentials: acceptor-id, account-id, account-token
- Application info: app-id, app-name, app-version  
- tp-authorization (default: "Version=1.0")

### 3. Payrix API Client (src/lib/payrix/)
Create a typed API client with these operations:

**Lane API (basePath: /cloudapi):**
- POST /cloudapi/v1/lanes (createLane)
- GET /cloudapi/v1/lanes (listLanes)
- GET /cloudapi/v1/lanes/{laneId} (getLane)

**Transaction API (basePath: /):**
- POST /api/v1/sale (sale)
- POST /api/v1/transactionQuery (transactionQuery)
- POST /api/v1/void/{transactionId} (void)
- POST /api/v1/sale/{transactionId}/return/{paymentType} (return)
- POST /api/v1/reversal/{transactionId}/{paymentType} (reversal)
- POST /api/v1/credit (credit)
- POST /api/v1/receipt (receipt)

**Required Headers for all requests:**
- tp-application-id
- tp-application-name
- tp-application-version
- tp-request-id (generate UUID each request)
- tp-express-acceptor-id
- tp-express-account-id
- tp-express-account-token
- tp-authorization (for Transaction API only)
- Content-Type: application/json

### 4. Server Actions (src/actions/)
Create server actions that:
- Read config from request headers or body (passed from client)
- Call Payrix APIs
- Return typed responses
- Log all requests/responses to allow history

### 5. Pages to create:

**Lanes:**
- /lanes/create - Form: laneId, terminalId, activationCode
- /lanes - List all lanes

**Transactions:**
- /transactions/sale - Form: laneId, transactionAmount, referenceNumber, ticketNumber
- /transactions/query - Form: transactionId, referenceNumber, terminalId, timeRange

**Reversals:**
- /reversals/void - Form: transactionId
- /reversals/return - Form: transactionId, paymentType (select)
- /reversals/reversal - Form: transactionId, paymentType (select)
- /reversals/credit - Form: laneId, transactionAmount, referenceNumber

**Receipt:**
- /receipt - Form with receipt fields

**History:**
- /history - Show all API calls with request/response

### 6. Each API page should have:
- Form inputs for the required fields
- "Execute" button
- Request preview (show what will be sent)
- Response viewer (formatted JSON)
- "Save to History" functionality
- Quick actions (e.g., from Sale response, button to Void/Return that transaction)

### 7. Types (src/lib/payrix/types.ts)
Define TypeScript interfaces for all requests/responses based on the API spec.

### 8. History Storage (src/lib/storage.ts)
- Save API calls to localStorage
- Include: timestamp, endpoint, request, response, status

### 9. Dockerfile for Cloud Run
Create a Dockerfile for the Next.js app.

### 10. cloudbuild.yaml
Create Cloud Build config following the cloud-build skill pattern:
- Build and push to Artifact Registry
- Deploy to Cloud Run
- Support dev/staging/prod environments

## Style:
- Use shadcn/ui components consistently
- Dark mode theme
- Clean, professional look
- cert environment: normal theme
- prod environment: add red warning banner

## After building:
1. Run `pnpm build` to verify it compiles
2. Run `pnpm dev` briefly to check it starts
3. Git add, commit with message "feat: initial payrix api tester implementation"
4. Push to origin main

When completely finished, run:
openclaw gateway wake --text "Done: Payrix API Tester initial implementation complete - ready for review" --mode now
