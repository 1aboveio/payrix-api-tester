# 1Above Workspace Architecture

**Date:** 2026-02-23  
**Status:** DRAFT  
**Maintainer:** 1Above Engineering Team  

---

## Executive Summary

This workspace contains the **1Above Consulting Platform** — a collection of microservices and tools for payment consulting, document generation, and automation. The platform leverages Google Cloud Platform (GCP) for deployment, Cloud Run for serverless compute, and integrates with various third-party services (Payrix, Worldpay, FIS, OpenAI, Gemini).

**Key Services:**
- 🎨 **cover-gen** — AI-powered document cover page generator
- 🔗 **webhook-gateway** — Secure webhook ingestion proxy
- 📋 **docs/plan** — Architecture and planning documents

---

## 1. System Architecture

### 1.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Public Internet                                 │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Payrix/    │  │   GitHub     │  │   Pub/Sub    │  │   Gemini     │    │
│  │   Worldpay   │  │   Webhooks   │  │   Events     │  │   API        │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │             │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┘
          │                 │                 │                 │
          │                 ▼                 ▼                 │
          │      ┌──────────────────────────────────┐          │
          │      │     Cloud Run (Serverless)       │          │
          │      ├──────────────────────────────────┤          │
          │      │  • webhook-gateway (FastAPI)     │          │
          │      │    - /github, /pubsub, /notion   │          │
          │      │  • cover-gen (Next.js)           │◄─────────┤
          │      │    - /api/*, / (web UI)          │          │
          │      └──────────────┬───────────────────┘          │
          │                     │                              │
          │                     │ IAP-secured                  │
          │                     │ VPC Connector                │
          │                     ▼                              │
          │      ┌──────────────────────────────────┐          │
          └──────►│      OpenClaw Gateway            │          │
                    │      10.128.0.3:18789            │          │
                    │                                  │          │
                    │  • CI/CD automation              │          │
                    │  • Document processing           │          │
                    │  • Notification routing          │──────────┘
                    └──────────────────────────────────┘
                              │
                              │ Internal Tools
                              ▼
                    ┌──────────────────────────────────┐
                    │  GCS Buckets / Secret Manager    │
                    │  • Background images               │
                    │  • API keys                        │
                    │  • PDF storage                     │
                    └──────────────────────────────────┘
```

### 1.2 Service Interactions

| Source | Destination | Protocol | Purpose |
|--------|-------------|----------|---------|
| GitHub | webhook-gateway | HTTPS + HMAC | CI/CD triggers |
| Pub/Sub | webhook-gateway | HTTPS + JWT | Cloud events |
| cover-gen | Gemini API | HTTPS + API Key | AI generation |
| cover-gen | GCS | HTTPS | Image storage |
| webhook-gateway | OpenClaw | HTTPS + Bearer | Internal routing |
| OpenClaw | cover-gen | HTTPS + IAP | E2E testing |

---

## 2. Service Catalog

### 2.1 cover-gen

**Purpose:** AI-powered consulting document cover page generator

**Tech Stack:**
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15.3.3 |
| Runtime | React | 19 (App Router) |
| Styling | Tailwind CSS | 4.1.18 |
| AI | Google Gemini | @google/genai 1.41.0 |
| PDF | Puppeteer + pdf-lib | 24.37.3 + 1.17.1 |
| Storage | Google Cloud Storage | 7.14.0 |
| Image | Sharp | peer dep |

**Key Features:**
- 4 professional themes (Modern Minimal, Corporate Blue, Elegant Serif, Bold Geometric)
- AI text & image generation
- Server-side PDF rendering (bypasses html2canvas limitations)
- Background image library with thumbnails
- CLI for headless generation
- 12 Playwright E2E journeys

**Deployment:**
- Container: Docker (Node 22 Alpine + Puppeteer Chromium)
- Platform: Cloud Run (IAP-enabled)
- CI/CD: Cloud Build (dev/main branch triggers)

### 2.2 webhook-gateway

**Purpose:** Secure webhook ingestion proxy for private OpenClaw network

**Tech Stack:**
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | FastAPI | latest |
| Runtime | Python | 3.11 |
| Server | Uvicorn | ASGI |
| HTTP Client | httpx | async |
| Auth | PyJWT | JWT validation |

**Key Features:**
- HMAC signature verification (GitHub)
- OIDC JWT verification (Pub/Sub)
- Payload normalization and enrichment
- VPC-private forwarding to OpenClaw
- Health checks and structured logging

**Deployment:**
- Container: Docker (Python 3.11 slim)
- Platform: Cloud Run (public-facing)
- Network: VPC connector to private OpenClaw

---

## 3. Deployment Architecture

### 3.1 Cloud Run Configuration

| Service | Region | IAP | VPC Connector | Scaling |
|---------|--------|-----|---------------|---------|
| cover-gen | us-central1 | Enabled | Yes | 0-100 instances |
| webhook-gateway | us-central1 | Disabled | Yes | 1-10 instances |

### 3.2 CI/CD Pipeline (Cloud Build)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Git Push   │────►│ Cloud Build  │────►│  Cloud Run   │
│  (dev/main)  │     │  • Build     │     │  Deploy      │
└──────────────┘     │  • Test      │     └──────────────┘
                     │  • Push      │
                     └──────────────┘
```

**Build Steps:**
1. Build container image (Docker)
2. Run unit tests
3. Push to Artifact Registry
4. Deploy to Cloud Run
5. Run E2E tests (Playwright + Browserless)

### 3.3 Secret Management

| Secret | Service | Usage |
|--------|---------|-------|
| GEMINI_API_KEY | cover-gen | AI generation |
| GCS_BUCKET_NAME | cover-gen | Image storage |
| GITHUB_WEBHOOK_SECRET | webhook-gateway | HMAC verification |
| OPENCLAW_API_TOKEN | webhook-gateway | Internal auth |
| IAP_SERVICE_ACCOUNT | E2E tests | Token generation |

---

## 4. Security Architecture

### 4.1 Authentication & Authorization

| Layer | Mechanism | Services |
|-------|-----------|----------|
| External Ingress | IAP (Identity-Aware Proxy) | cover-gen |
| External Ingress | HMAC/JWT | webhook-gateway |
| Internal | Bearer Token | webhook-gateway → OpenClaw |
| E2E Tests | Service Account + IAP | Playwright |

### 4.2 Network Security

```
Public Internet
      │
      ▼
┌─────────────────┐
│  Cloud Armor    │  (DDoS, WAF rules)
│  (optional)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cloud Run      │  (container sandbox)
│  Services       │
└────────┬────────┘
         │
         │ VPC Connector
         ▼
┌─────────────────┐
│  VPC Network    │  (private RFC 1918)
│  vpn-hub-us     │
└────────┬────────┘
         │ VPN Tunnel
         ▼
┌─────────────────┐
│  OpenClaw       │  (on-prem/private)
│  Gateway        │
└─────────────────┘
```

### 4.3 Data Protection

- **GCS Buckets:** Customer-supplied encryption keys (CSEK) optional
- **Secrets:** Secret Manager with IAM bindings
- **Transit:** TLS 1.3 for all external communications
- **Audit:** Cloud Audit Logs enabled

---

## 5. Development Workflow

### 5.1 Repository Structure

```
workspace/
├── cover-gen/              # Next.js application
│   ├── app/                # App Router components
│   ├── lib/                # Shared library
│   ├── e2e/                # Playwright tests
│   ├── Dockerfile          # Multi-stage build
│   └── cloudbuild.yaml     # CI/CD config
├── webhook-gateway/        # FastAPI application
│   ├── src/                # Python source
│   ├── tests/              # Pytest tests
│   ├── Dockerfile          # Python slim build
│   └── cloudbuild.yaml     # CI/CD config
├── docs/plan/              # Architecture plans
│   └── payrix-api-tester-upgrade-plan.md
├── memory/                 # Session memory
└── ARCHITECTURE.md         # This document
```

### 5.2 Branch Strategy

| Branch | Purpose | Protection |
|--------|---------|------------|
| main | Production | Required reviews, CI pass |
| dev | Staging | CI pass |
| feature/* | Development | None |

### 5.3 Testing Strategy

| Level | Tool | Coverage |
|-------|------|----------|
| Unit | Jest (cover-gen), Pytest (gateway) | Core logic |
| Integration | Playwright | E2E user journeys |
| Security | OWASP ZAP | Scheduled scans |

---

## 6. Monitoring & Observability

### 6.1 Logging

- **Structured JSON:** All services output structured logs
- **Correlation IDs:** Request ID propagated across services
- **Retention:** 30 days (Cloud Logging)

### 6.2 Metrics

| Metric | Source | Alert |
|--------|--------|-------|
| Request latency | Cloud Run | > 5s p95 |
| Error rate | Cloud Run | > 1% |
| CPU/Memory | Cloud Run | > 80% |
| E2E failures | Playwright | Any failure |

### 6.3 Alerting

- **Channels:** Discord (webhook-gateway integration)
- **Severity:** P1 (page), P2 (alert), P3 (notify)
- **On-call:** Rotation via OpenClaw

---

## 7. Dependencies

### 7.1 External Services

| Service | Purpose | SLA |
|---------|---------|-----|
| Google Cloud | Infrastructure | 99.95% |
| Gemini API | AI generation | 99.9% |
| Payrix/Worldpay | Payment processing | 99.99% |
| GitHub | Source control | 99.9% |

### 7.2 Internal Dependencies

| Component | Depends On | Criticality |
|-----------|------------|-------------|
| cover-gen | GCS, Gemini | High |
| webhook-gateway | OpenClaw | High |
| E2E tests | Browserless | Medium |

---

## 8. Disaster Recovery

### 8.1 Backup Strategy

| Data | Method | RPO | RTO |
|------|--------|-----|-----|
| GCS Objects | Nearline + versioning | 1 hour | 4 hours |
| Container Images | Artifact Registry | N/A | 1 hour |
| Secrets | Secret Manager versions | N/A | 15 min |

### 8.2 Failure Scenarios

| Scenario | Mitigation |
|----------|------------|
| Cloud Run outage | Multi-region deployment |
| GCS unavailability | Regional buckets |
| OpenClaw unreachable | Queue + retry logic |
| Gemini API failure | Fallback to templates |

---

## 9. Future Roadmap

### 9.1 Planned Enhancements

- [ ] **payrix-api-tester:** Full triPOS Cloud certification suite (61 test cases)
- [ ] **Multi-region:** Active-active deployment for cover-gen
- [ ] **Caching:** Cloud CDN for generated PDFs
- [ ] **Analytics:** BigQuery integration for usage metrics

### 9.2 Technical Debt

- [ ] Migrate cover-gen to Next.js 16 (when stable)
- [ ] Adopt uv for Python dependency management
- [ ] Implement Circuit Breaker for external APIs
- [ ] Add OpenTelemetry tracing

---

## 10. References

### Documentation
- [cover-gen ARCHITECTURE](./cover-gen/ARCHITECTURE.md)
- [webhook-gateway ARCHITECTURE](./webhook-gateway/ARCHITECTURE.md)
- [Payrix API Tester Upgrade Plan](./docs/plan/payrix-api-tester-upgrade-plan.md)

### External Links
- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

### Contact
- **Team:** 1Above Engineering
- **Slack:** #engineering
- **On-call:** OpenClaw rotation

---

*This document is maintained by the 1Above Engineering team. For updates, please submit a PR to the dev branch.*
