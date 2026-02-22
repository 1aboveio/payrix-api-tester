# payrix-api-tester Architecture

**Service:** payrix-api-tester  
**Purpose:** Worldpay/FIS triPOS Cloud Certification Testing Platform  
**Date:** 2026-02-23  
**Status:** DRAFT  
**Version:** v2.15  

---

## Executive Summary

`payrix-api-tester` is a comprehensive testing and certification platform for **Worldpay/FIS triPOS Cloud** payment integration. It automates the execution of ~61 certification test cases covering 17 API endpoints, enabling rapid validation of payment processing implementations.

**Key Capabilities:**
- 🧪 **61 Certification Test Cases** — Full coverage of ExpressCertificationScript
- 🔄 **17 API Endpoints** — Lane Management, Transactions, Utilities
- 🤖 **Automated Execution** — Sequential test execution with dependency tracking
- 📊 **Report Generation** — Certification-ready test reports
- 🖥️ **CLI + Web UI** — Dual interface for manual and automated testing
- 🔧 **Configuration Management** — Test card, amount, and scenario configs

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          payrix-api-tester                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         API Layer (FastAPI)                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│  │  │ /tests/run  │  │ /tests/list │  │ /config/... │  │ /reports/  │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Test Orchestrator                                │   │
│  │  • Sequential execution with dependency tracking                     │   │
│  │  • Transaction ID persistence (for Return/Reversal/Void)            │   │
│  │  • Test state management                                            │   │
│  │  • Retry logic and error handling                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Test Case Implementations                        │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │  Sale     │ │  Auth     │ │  Refund   │ │  Reversal │  ...      │   │
│  │  │ (10 tests)│ │ (16 tests)│ │ (5 tests) │ │ (6 tests) │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    HTTP Client (httpx)                              │   │
│  │  • Request signing (tp-authorization, tp-request-id)                │   │
│  │  • Response validation (HTTP + statusCode)                          │   │
│  │  • Retry with exponential backoff                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Worldpay/FIS triPOS Cloud                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • /cloudapi/v1/lanes/*    (Lane Management)                        │   │
│  │  • /api/v1/sale            (Sale Transactions)                      │   │
│  │  • /api/v1/authorization/* (Authorization)                          │   │
│  │  • /api/v1/refund          (Refunds)                                │   │
│  │  • /api/v1/return/*        (Returns)                                │   │
│  │  • /api/v1/reversal/*      (Reversals)                              │   │
│  │  • /api/v1/void/*          (Voids)                                  │   │
│  │  • /api/v1/force/credit    (Force)                                  │   │
│  │  • /api/v1/binQuery/*      (BIN Query)                              │   │
│  │  • /api/v1/*               (Utilities)                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | FastAPI | latest | REST API framework |
| **Runtime** | Python | 3.11+ | Core language |
| **HTTP Client** | httpx | latest | Async HTTP requests |
| **Testing** | pytest | latest | Unit/integration tests |
| **CLI** | Typer | latest | Command-line interface |
| **Config** | Pydantic | v2 | Settings validation |
| **Storage** | SQLite/JSON | - | Test state persistence |
| **Reporting** | Jinja2 | latest | HTML/PDF report templates |

### 1.3 Deployment Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Container** | Docker (Python 3.11) | Slim image with security hardening |
| **Platform** | Cloud Run | Serverless, scale-to-zero |
| **CI/CD** | Cloud Build | Automated test execution on push |
| **Secrets** | Secret Manager | API credentials, test card data |

---

## 2. Project Structure

```
payrix-api-tester/
├── src/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry
│   ├── config.py               # Pydantic settings
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py           # API route definitions
│   │   ├── endpoints/
│   │   │   ├── __init__.py
│   │   │   ├── tests.py        # /tests/* endpoints
│   │   │   ├── config.py       # /config/* endpoints
│   │   │   └── reports.py      # /reports/* endpoints
│   │   └── dependencies.py     # FastAPI dependencies
│   ├── core/
│   │   ├── __init__.py
│   │   ├── client.py           # triPOS HTTP client
│   │   ├── auth.py             # Authentication headers
│   │   ├── validator.py        # Response validation
│   │   └── state.py            # Test state management
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── base.py             # Base test class
│   │   ├── lane_management.py  # Lane Create/Delete tests
│   │   ├── sale.py             # Sale transaction tests (S-1 to S-10)
│   │   ├── authorization.py    # Auth + Completion tests (A-1 to C-8)
│   │   ├── refund.py           # Refund tests (RF-1 to RF-5)
│   │   ├── return.py           # Return tests (RT-1 to RT-5)
│   │   ├── reversal.py         # Reversal tests (RV-1 to RV-6)
│   │   ├── void.py             # Void tests (V-1 to V-4)
│   │   ├── force.py            # Force tests (F-1 to F-3)
│   │   ├── bin_query.py        # BIN Query tests (BQ-1 to BQ-3)
│   │   ├── level2.py           # Level 2 tests (L2S-1 to L2A-2)
│   │   ├── duplicate.py        # Duplicate handling tests (DUP-1 to DUP-3)
│   │   └── utilities.py        # Display, Input, Selection, Signature
│   ├── models/
│   │   ├── __init__.py
│   │   ├── requests.py         # Pydantic request models
│   │   ├── responses.py        # Pydantic response models
│   │   └── enums.py            # PaymentType, EntryMethod, etc.
│   └── reports/
│       ├── __init__.py
│       ├── generator.py        # Report generation
│       └── templates/          # Jinja2 templates
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # pytest fixtures
│   ├── unit/
│   │   ├── __init__.py
│   │   ├── test_client.py
│   │   ├── test_validator.py
│   │   └── test_state.py
│   └── integration/
│       ├── __init__.py
│       └── test_api.py
├── cli/
│   ├── __init__.py
│   └── main.py                 # Typer CLI entry
├── docs/
│   └── test_matrix.md          # Complete test case matrix
├── config/
│   ├── test_cards.yaml         # Test card configurations
│   ├── amounts.yaml            # Test amounts by scenario
│   └── environments.yaml       # Sandbox/Prod configs
├── Dockerfile
├── cloudbuild.yaml
├── requirements.txt
├── pyproject.toml
└── README.md
```

---

## 3. Core Components

### 3.1 Test Orchestrator

The orchestrator manages the execution of test cases with proper sequencing:

```python
class TestOrchestrator:
    """
    Manages test execution with dependency tracking.
    
    Test dependencies:
    - Return requires Sale (for transactionId)
    - Reversal requires Sale/Auth (for transactionId)
    - Void requires Sale (for transactionId)
    - Completion requires Authorization (for transactionId)
    """
    
    async def run_certification_suite(self) -> TestSuiteResult:
        """Execute all 61 certification tests in order."""
        # Phase 1: Lane Management
        lane_id = await self.run_lane_create()
        
        # Phase 2: Sale transactions (save transactionIds)
        sale_results = await self.run_sale_tests()
        
        # Phase 3: Authorization (save transactionIds)
        auth_results = await self.run_authorization_tests()
        
        # Phase 4: Completion (use auth transactionIds)
        completion_results = await self.run_completion_tests(
            auth_ids=auth_results.transaction_ids
        )
        
        # Phase 5: Return (use sale transactionIds)
        return_results = await self.run_return_tests(
            sale_ids=sale_results.transaction_ids
        )
        
        # ... continue with other test groups
        
        return TestSuiteResult(...)
```

### 3.2 triPOS HTTP Client

```python
class TriPOSClient:
    """
    HTTP client for triPOS Cloud API.
    
    Handles:
    - Authentication headers (tp-authorization, tp-request-id, etc.)
    - Request/response serialization
    - Response validation (HTTP status + triPOS statusCode)
    - Retry logic
    """
    
    def __init__(self, config: TriPOSConfig):
        self.base_url = config.base_url
        self.credentials = config.credentials
        
    async def request(
        self,
        method: str,
        path: str,
        body: dict = None,
        path_params: dict = None,
        query_params: dict = None
    ) -> TriPOSResponse:
        """Execute authenticated request to triPOS API."""
        headers = self._build_headers()
        url = self._build_url(path, path_params, query_params)
        
        response = await self.http.request(
            method=method,
            url=url,
            headers=headers,
            json=body
        )
        
        return self._validate_response(response)
    
    def _build_headers(self) -> dict:
        return {
            "tp-application-id": self.credentials.app_id,
            "tp-application-name": self.credentials.app_name,
            "tp-application-version": self.credentials.app_version,
            "tp-request-id": str(uuid.uuid4()),
            "tp-authorization": "Version=1.0",
            "tp-express-acceptor-id": self.credentials.acceptor_id,
            "tp-express-account-id": self.credentials.account_id,
            "tp-express-account-token": self.credentials.account_token,
        }
```

### 3.3 Response Validator

```python
class ResponseValidator:
    """
    Validates triPOS API responses.
    
    Two-step validation:
    1. HTTP status code (200 = success)
    2. triPOS statusCode field (0 = approved)
    """
    
    def validate(self, response: httpx.Response) -> ValidationResult:
        # Step 1: HTTP status
        if response.status_code != 200:
            return ValidationResult.fail(f"HTTP {response.status_code}")
        
        data = response.json()
        status_code = data.get("statusCode")
        
        # Step 2: triPOS statusCode
        status_map = {
            0: "Approved",
            5: "Partial Approved",
            7: "DCC Requested",
            20: "Declined",
            23: "Duplicate",
        }
        
        if status_code not in [0, 5]:  # 5 is partial approval (acceptable)
            return ValidationResult.fail(
                f"statusCode {status_code}: {status_map.get(status_code, 'Unknown')}"
            )
        
        return ValidationResult.pass_(data)
```

### 3.4 State Manager

```python
class TestStateManager:
    """
    Persists test execution state for dependent tests.
    
    Stores:
    - transactionId -> test case mapping
    - Test execution results
    - Lane configuration
    """
    
    async def save_transaction(
        self,
        test_case: str,
        transaction_id: str,
        payment_type: str,
        amount: str
    ):
        """Save transaction for later use (Return, Reversal, Void)."""
        
    async def get_transaction(self, test_case: str) -> Optional[Transaction]:
        """Retrieve transaction for dependent tests."""
```

---

## 4. API Endpoints

### 4.1 Test Execution

| Method | Path | Description |
|--------|------|-------------|
| POST | `/tests/run` | Run all certification tests |
| POST | `/tests/run/{category}` | Run specific category (sale, auth, etc.) |
| GET | `/tests/status/{run_id}` | Check test run status |
| GET | `/tests/results/{run_id}` | Get test results |

### 4.2 Configuration

| Method | Path | Description |
|--------|------|-------------|
| GET | `/config/credentials` | Get current credentials (masked) |
| PUT | `/config/credentials` | Update triPOS credentials |
| GET | `/config/test-cards` | List configured test cards |
| PUT | `/config/test-cards` | Update test card configuration |

### 4.3 Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | `/reports/{run_id}` | Get HTML report for test run |
| GET | `/reports/{run_id}/pdf` | Get PDF report for test run |
| GET | `/reports/{run_id}/export` | Export to certification format |

---

## 5. Test Implementation Details

### 5.1 Sale Tests (S-1 to S-10)

```python
class SaleTests:
    """Implementation of 10 Sale test cases."""
    
    async def test_s1_swiped_credit(self) -> TestResult:
        """CP Swiped Credit Card - $1.04"""
        response = await self.client.sale(
            lane_id=self.lane_id,
            transaction_amount="1.04",
            reference_number=self.generate_ref(),
            ticket_number=self.generate_ticket(),
        )
        return TestResult.from_response(response, expected_status=0)
    
    async def test_s2_partial_approval(self) -> TestResult:
        """CP Swiped Credit Card (Partial Approval) - $9.65"""
        response = await self.client.sale(
            lane_id=self.lane_id,
            transaction_amount="9.65",
            configuration={"allowPartialApprovals": True},
        )
        return TestResult.from_response(response, expected_status=5)  # Partial approved
    
    async def test_s5_debit_cashback(self) -> TestResult:
        """CP Swiped PIN Debit Card (Cash Back) - $31.00"""
        response = await self.client.sale(
            lane_id=self.lane_id,
            transaction_amount="31.00",
            requested_cashback_amount="1.00",
            configuration={"allowDebit": True},
        )
        return TestResult.from_response(response, expected_status=0)
```

### 5.2 Duplicate Handling (DUP-1 to DUP-3)

```python
class DuplicateTests:
    """
    Duplicate transaction handling tests.
    
    IMPORTANT: All 3 tests must use the SAME card.
    """
    
    async def test_dup1_normal_sale(self) -> TestResult:
        """Process Sale transaction - $1.70"""
        return await self.client.sale(amount="1.70")
    
    async def test_dup2_duplicate_check(self) -> TestResult:
        """Process duplicate Sale - expect statusCode=23"""
        response = await self.client.sale(
            amount="1.70",
            configuration={"checkForDuplicateTransactions": True}
        )
        return TestResult.from_response(response, expected_status=23)
    
    async def test_dup3_override(self) -> TestResult:
        """Process with DuplicateCheckDisableFlag - should approve"""
        response = await self.client.sale(
            amount="1.70",
            duplicate_check_disable_flag=True,  # Recommended approach
        )
        return TestResult.from_response(response, expected_status=0)
```

---

## 6. Configuration

### 6.1 Environment Variables

```bash
# triPOS Cloud Configuration
TRIPOS_BASE_URL=https://triposcert.vantiv.com
TRIPOS_APP_ID=payrix-api-tester
TRIPOS_APP_NAME="Payrix API Tester"
TRIPOS_APP_VERSION=1.0.0
TRIPOS_ACCEPTOR_ID=...
TRIPOS_ACCOUNT_ID=...
TRIPOS_ACCOUNT_TOKEN=...

# Test Configuration
TEST_LANE_ID=1
TEST_TERMINAL_ID=0001

# Report Configuration
REPORT_OUTPUT_DIR=/app/reports
```

### 6.2 Test Card Configuration (YAML)

```yaml
# config/test_cards.yaml
test_cards:
  visa_credit:
    number: "4111111111111111"
    entry_methods: [swipe, emv, contactless, keyed]
    
  visa_debit:
    number: "4003030000000004"
    entry_methods: [swipe]
    supports_cashback: true
    
  mastercard_credit:
    number: "5555555555554444"
    entry_methods: [swipe, emv, contactless, keyed]
    
  amex:
    number: "378282246310005"
    entry_methods: [swipe, emv, keyed]
```

### 6.3 Test Amounts (YAML)

```yaml
# config/amounts.yaml
amounts:
  sale:
    basic: "1.04"           # S-1, S-6, S-7
    partial: "9.65"         # S-2, S-9
    balance: "32.00"        # S-3, S-10
    debit: "31.00"          # S-4, S-5
    keyed: "1.07"           # S-8
    
  refund:
    credit: "1.12"
    debit: "31.00"
    contactless: "2.31"
    emv: "2.32"
    keyed: "1.13"
    
  duplicate: "1.70"
```

---

## 7. CLI Interface

```bash
# Run all certification tests
payrix-tester run --all

# Run specific category
payrix-tester run --category sale
payrix-tester run --category authorization

# Run single test
payrix-tester run --test S-1

# Check status
payrix-tester status --run-id abc123

# Generate report
payrix-tester report --run-id abc123 --format pdf

# Configure credentials
payrix-tester config set-credentials --file credentials.json
```

---

## 8. Deployment

### 8.1 Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY src/ ./src/
COPY config/ ./config/

# Run FastAPI
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 8.2 Cloud Build Configuration

```yaml
# cloudbuild.yaml
steps:
  - name: 'python:3.11'
    entrypoint: 'pip'
    args: ['install', '-r', 'requirements.txt']
    
  - name: 'python:3.11'
    entrypoint: 'pytest'
    args: ['tests/']
    
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/payrix-api-tester:$COMMIT_SHA', '.']
    
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/payrix-api-tester:$COMMIT_SHA']
    
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'payrix-api-tester'
      - '--image=gcr.io/$PROJECT_ID/payrix-api-tester:$COMMIT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
```

---

## 9. Dependencies

### 9.1 External

| Service | Purpose | Required |
|---------|---------|----------|
| triPOS Cloud (Cert) | Payment processing | Yes |
| triPOS Cloud (Prod) | Production validation | No |
| PIN Pad Device | Card-present transactions | Yes |

### 9.2 Internal

| Component | Usage |
|-----------|-------|
| Secret Manager | API credentials |
| Cloud Storage | Report storage |
| Cloud Build | CI/CD |

---

## 10. References

### Documents
- [Payrix TriPOS API 分析 v2.15](../../1above:/Fuiou/Worldpay%20Payrix%20Integration/Payrix%20TriPOS%20API%20分析%20v2.15.md)
- [ExpressCertificationScript_triPOSCloud_Retail](../../1above:/Fuiou/Worldpay%20Payrix%20Integration/ExpressCertificationScript_triPOSCloud_Retail%20NEW.pdf)
- [Workspace Architecture](../../ARCHITECTURE.md)

### API Documentation
- triPOS Cloud API: https://triposcert.vantiv.com/api/swagger-ui-bootstrap/
- Lane Management API: https://triposcert.vantiv.com/cloudapi/swagger/ui/index

---

*This architecture is designed to support full Worldpay/FIS triPOS Cloud certification. For updates, see the upgrade plan in docs/plan/.*
