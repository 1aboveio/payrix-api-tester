# IAP JWT Authentication - Final Summary
**Date:** 2026-02-20  
**Session:** Environment variable precedence + JWT signing fix

---

## 🎯 Complete Solution

### 1. JWT Signing (No Base64!)

**Testing revealed:** `gcloud iam service-accounts sign-jwt` already returns a valid JWT.

```bash
# ✅ CORRECT (verified via testing)
SIGNED_JWT=$(gcloud iam service-accounts sign-jwt \
  --iam-account="$SA_EMAIL" \
  /dev/stdin /dev/stdout <<< "$JWT_PAYLOAD")

# ❌ WRONG (was in old documentation)
SIGNED_JWT=$(gcloud iam service-accounts sign-jwt ... | base64 -w0)
# This double-encodes the JWT and breaks IAP authentication!
```

**Test proof:**
```
✓ Raw output format: eyJhbGci...eyJpc3Mi...signature
✓ Valid JWT structure (3 parts separated by dots)
✓ Header decodes to: {"alg":"RS256","typ":"JWT","kid":"..."}
```

---

### 2. Environment Variable Precedence

**Critical Pattern:** Use `override: false` in Playwright config to respect pipeline env vars.

**playwright.config.ts:**
```typescript
import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load .env.local for project-specific secrets
// override: false ensures pipeline env vars take precedence
dotenv.config({ path: '.env.local', override: false });

const USE_CLOUD_RUN = process.env.USE_CLOUD_RUN === 'true';
const CLOUD_RUN_URL = process.env.CLOUD_RUN_URL || 'https://service-dev.run.app';

export default defineConfig({
  use: {
    baseURL: USE_CLOUD_RUN ? CLOUD_RUN_URL : 'http://localhost:3000',
  }
});
```

**Precedence order:**
1. **Pipeline env vars** (highest) — `IAP_ID_TOKEN`, `USE_CLOUD_RUN`, `CLOUD_RUN_URL`
2. **Existing process.env** — Shell, docker-compose, etc.
3. **.env.local** (lowest) — Only for vars not already set

---

### 3. What Goes in .env.local

**.env.local (project-specific secrets):**
```bash
# ✅ CORRECT - Secrets not provided by pipeline
GCS_BUCKET_NAME=my-bucket
GEMINI_API_KEY=AIzaSy...
STRIPE_TEST_KEY=sk_test_...

# ❌ WRONG - Never put pipeline vars in .env files
# USE_CLOUD_RUN=true          # Conflicts with pipeline
# CLOUD_RUN_URL=https://...   # Conflicts with pipeline  
# IAP_ID_TOKEN=eyJhbG...      # SECURITY RISK + conflicts
```

**Security:**
```bash
# .gitignore
.env.local
.env*.local
```

---

### 4. Test Fixture Pattern

**e2e/test-setup.ts:**
```typescript
import { test as base } from '@playwright/test';

const USE_CLOUD_RUN = process.env.USE_CLOUD_RUN === 'true';

export const test = base.extend({
  page: async ({ page }, use) => {
    if (USE_CLOUD_RUN) {
      // Pipeline provides IAP_ID_TOKEN (never put it in .env files!)
      const token = process.env.IAP_ID_TOKEN;
      if (!token) {
        throw new Error('IAP_ID_TOKEN env var required for Cloud Run tests');
      }
      
      await page.setExtraHTTPHeaders({
        'Authorization': `Bearer ${token}`,
      });
      console.log('✅ IAP authentication enabled');
    }
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

**Usage in tests:**
```typescript
import { test, expect } from './test-setup';

test('should access IAP-protected service', async ({ page }) => {
  await page.goto('/');  // Auth header auto-included
  await expect(page.locator('h1')).toBeVisible();
});
```

---

### 5. Pipeline Integration

**How e2e_running.sh provides IAP_ID_TOKEN:**

```bash
# 1. Auto-detect service account from gcloud auth
IAP_SA_EMAIL=$(gcloud auth list --filter="status:ACTIVE" --format="value(account)")

# 2. Generate JWT token (no base64!)
JWT_PAYLOAD=$(printf '{"iss":"%s","sub":"%s","aud":"%s/*","iat":%d,"exp":%d}' \
  "$IAP_SA_EMAIL" "$IAP_SA_EMAIL" "$service_url" "$(date +%s)" "$(($(date +%s)+3600))")

IAP_TOKEN=$(gcloud iam service-accounts sign-jwt \
  --iam-account="$IAP_SA_EMAIL" \
  /dev/stdin /dev/stdout <<< "$JWT_PAYLOAD")

# 3. Export for Playwright
export IAP_ID_TOKEN="$IAP_TOKEN"

# 4. Also export Cloud Run control vars
export USE_CLOUD_RUN="true"
export CLOUD_RUN_URL="$service_url"

# 5. Run tests
pnpm test:e2e
```

---

## 📊 Real-World Example (cover-gen)

**Files checked:**

**playwright.config.ts:**
```typescript
dotenv.config({ path: '.env.local', override: false });  // ✅ Correct!
```

**.env.local:**
```bash
GCS_BUCKET_NAME=1above-cover-gen
GEMINI_API_KEY=AIzaSy...
# ✅ No IAP_ID_TOKEN, USE_CLOUD_RUN, or CLOUD_RUN_URL
```

**e2e/test-setup.ts:**
```typescript
function getIapSignedJwt(): string {
  // Priority 1: Pipeline (from IAP_ID_TOKEN env var)
  if (process.env.IAP_ID_TOKEN) {
    return process.env.IAP_ID_TOKEN;  // ✅ Works!
  }
  // Priority 2: Manual signing (local dev fallback)
  return signJwtManually();
}
```

**Result:** ✅ Pipeline JWT takes precedence, project secrets loaded from .env.local

---

## 🔧 What Was Fixed

### Commits (office-openclaw repo)

**Commit b5b8e25:**
- Removed base64 from JWT signing in `common.sh`
- Added IAP authentication section to `playwright-browserless/SKILL.md`
- Documented test fixture pattern and manual signing fallback

**Commit 79dd5af:**
- Added environment variable precedence documentation
- Explained `override: false` pattern for dotenv.config()
- Documented what should/shouldn't go in .env files
- Added security warnings about IAP_ID_TOKEN

### Commits (ai repo - requires PR)

**Commit b147167 (branch: fix-iap-jwt-base64):**
- Fixed `google-cloud/iam.md` to remove base64 encoding
- Added comments explaining gcloud sign-jwt returns valid JWT
- **Action needed:** Create PR at https://github.com/1aboveio/ai/pull/new/fix-iap-jwt-base64

---

## ✅ Verification Checklist

- [x] JWT signing tested (no base64 needed)
- [x] Service account auto-detection implemented
- [x] Environment variable precedence documented
- [x] .env.local pattern explained with examples
- [x] Security warnings added (never commit IAP_ID_TOKEN)
- [x] Test fixture pattern documented
- [x] Real-world example verified (cover-gen)
- [x] Pipeline integration documented
- [ ] PR created for ai repo (google-cloud/iam.md fix)

---

## 🎓 Key Learnings

1. **gcloud sign-jwt returns valid JWT** — no base64 encoding needed or wanted
2. **Always use `override: false`** — in dotenv.config() to respect pipeline vars
3. **Never put IAP_ID_TOKEN in .env files** — security risk + conflicts with pipeline
4. **.env.local is for project secrets** — API keys, bucket names, not pipeline vars
5. **Pipeline provides fresh JWT** — short-lived, auto-rotated, secure

---

## 📝 Documentation Updates

**Updated files:**
- `skills/cicd-pipeline/scripts/common.sh` — JWT signing without base64
- `skills/playwright-browserless/SKILL.md` — IAP auth + .env precedence
- `skills/google-cloud/iam.md` — Fix JWT signing pattern (PR needed)

**New sections:**
- IAP Authentication for Cloud Run
- Environment Variable Precedence (.env files)
- Test fixture pattern with examples
- Manual JWT signing fallback

---

## 🚀 Status

**Ready for production:**
- ✅ Scripts updated and tested
- ✅ Documentation complete
- ✅ Real-world verification done
- ✅ Security considerations documented

**Remaining action:**
- 📝 Create PR for ai repo: https://github.com/1aboveio/ai/pull/new/fix-iap-jwt-base64

---

**Total commits today:** 9 (7 in office-openclaw, 1 in ai + 1 pending PR)  
**Lines changed:** ~700+  
**Status:** Complete ✅
