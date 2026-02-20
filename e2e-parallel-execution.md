# E2E Parallel Test Execution

## Current State: Sequential Execution

Right now, Playwright runs tests sequentially by default:
- **33 tests** × **~3-4s per test** = **~2 minutes total**
- Only one browser instance active at a time
- One test completes before the next starts

## Parallel Execution: How It Works

Playwright has built-in parallelization:

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 5,  // Run 5 tests concurrently
  fullyParallel: true,  // Run all tests in parallel (not just by file)
})
```

**With 5 workers**:
- **33 tests** ÷ **5 workers** = **~7 batches**
- **~3-4s per batch** = **~30-40 seconds total** (vs 2 minutes)
- **3-4x faster** 🚀

## Browserless Capacity

Browserless supports multiple concurrent connections:

```bash
# Default Browserless configuration
podman run -d -p 3000:3000 \
  -e CONCURRENT=10 \          # Max 10 concurrent browsers
  -e MAX_QUEUE_LENGTH=20 \    # Queue up to 20 requests
  -e PREBOOT_CHROME=true \    # Pre-warm browsers
  --shm-size=8gb \            # Shared memory for Chrome
  ghcr.io/browserless/chromium
```

**Capacity**:
- Default: 10 concurrent browsers
- Can be increased with `CONCURRENT` env var
- Limited by host resources (CPU, RAM, shared memory)

## Configuration

### 1. Playwright Config

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Parallelization
  workers: process.env.CI ? 5 : 3,  // More workers in CI
  fullyParallel: true,               // Parallelize within files
  
  // Timeouts (important for parallel)
  timeout: 30000,           // 30s per test
  expect: { timeout: 5000 }, // 5s for assertions
  
  // Retries (careful with parallel)
  retries: process.env.CI ? 2 : 0,  // Retry in CI only
  
  // Browserless connection
  use: {
    connectOverCDP: {
      wsEndpoint: process.env.PLAYWRIGHT_BROWSER_WS_ENDPOINT,
    },
  },
});
```

### 2. Browserless Configuration

```bash
# Increase concurrent capacity for parallel tests
podman run -d -p 3000:3000 --name browserless \
  -e CONCURRENT=10 \              # Support 10 workers
  -e MAX_QUEUE_LENGTH=20 \
  -e PREBOOT_CHROME=true \
  -e CONNECTION_TIMEOUT=60000 \   # 60s timeout
  --shm-size=8gb \                # Important: increase for parallel
  --memory=8g \                   # Memory limit
  --cpus=4 \                      # CPU limit
  --restart always \
  ghcr.io/browserless/chromium
```

## Benefits

### Speed Improvements

| Tests | Sequential | 3 workers | 5 workers | 10 workers |
|-------|-----------|-----------|-----------|------------|
| 10    | 40s       | 15s       | 10s       | 5s         |
| 33    | 2m        | 45s       | 30s       | 20s        |
| 60    | 4m        | 1m30s     | 1m        | 40s        |
| 100   | 7m        | 2m30s     | 1m30s     | 1m         |

**Speedup**: 3-5x faster with 5-10 workers

### Resource Efficiency

- Better CPU utilization (parallel execution)
- Finish faster → free up pipeline sooner
- Less likely to hit IAP token expiration (faster completion)

## Considerations

### 1. Resource Limits

**Host machine**:
- **CPU**: Each worker needs ~1 CPU core
- **Memory**: Each browser needs ~200-500MB RAM
- **Shared memory**: Chrome needs `/dev/shm` (8GB recommended)

**Example**: 5 workers = ~5 cores, ~2-3GB RAM, 8GB /dev/shm

**Check resources**:
```bash
# CPU cores
nproc

# Available memory
free -h

# Shared memory
df -h /dev/shm
```

### 2. Test Isolation

**Important**: Tests must be independent!

**Good** (parallel-safe):
```typescript
// Each test has its own data
test('create user', async ({ page }) => {
  const uniqueId = Date.now();
  await page.goto('/signup');
  await page.fill('[name="email"]', `user${uniqueId}@test.com`);
  // ...
});
```

**Bad** (not parallel-safe):
```typescript
// Tests share global state
let userId: string;

test('create user', async ({ page }) => {
  userId = await createUser();  // ❌ Race condition!
});

test('delete user', async ({ page }) => {
  await deleteUser(userId);  // ❌ Depends on test order!
});
```

### 3. IAP Token Sharing

All workers share the same IAP token (set via env var):
- ✅ Token is passed to all workers via `IAP_ID_TOKEN` env var
- ✅ All workers authenticate with the same token
- ✅ No rate limiting issues (same service account)

### 4. Browserless Connection Pool

Browserless manages connection pooling:
- Workers wait in queue if all browsers busy
- `MAX_QUEUE_LENGTH=20` allows queueing
- `CONNECTION_TIMEOUT=60000` (60s) prevents hangs

### 5. Progress Monitoring

Our current progress parsing still works:
```
Running 33 tests using 5 workers

  [1/33] auth.spec.ts:5:5 › login flow
  [2/33] payment.spec.ts:8:5 › checkout
  [3/33] cover.spec.ts:12:5 › generate
  ✓ [1/33] auth.spec.ts:5:5 › login flow (2.3s)
  [4/33] profile.spec.ts:5:5 › update
  ✓ [3/33] cover.spec.ts:12:5 › generate (3.1s)
  ...
```

Output shows multiple tests in-flight, but our parsing still captures:
- Current/total: `[N/33]`
- Passed: `✓` count
- Failed: `✘` count

## Recommended Configuration

### For cover-gen (33 tests)

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 5,              // 5 concurrent workers
  fullyParallel: true,     // Parallelize everything
  timeout: 30000,          // 30s per test
  retries: 0,              // No retries (we have E2E_TIMEOUT_RETRY)
  
  use: {
    connectOverCDP: {
      wsEndpoint: process.env.PLAYWRIGHT_BROWSER_WS_ENDPOINT,
    },
    baseURL: process.env.PLAYWRIGHT_BASE_URL,
    extraHTTPHeaders: process.env.IAP_ID_TOKEN ? {
      'Authorization': `Bearer ${process.env.IAP_ID_TOKEN}`,
    } : {},
  },
});
```

**Expected improvement**: 2 minutes → 30-40 seconds (3-4x faster)

### For larger suites (60+ tests)

```typescript
workers: 10,  // 10 concurrent workers
```

**Expected improvement**: 4 minutes → 40-60 seconds (4-6x faster)

## Potential Issues

### 1. Shared Resource Conflicts

**Problem**: Tests modify shared data (database, file system)

**Solution**: 
- Use test isolation (unique IDs per test)
- Clean up after each test
- Use transaction rollback if possible

### 2. Browserless Overload

**Problem**: Too many workers, Browserless can't keep up

**Symptoms**:
```
Error: browserType.launch: Timeout 30000ms exceeded
```

**Solution**:
- Reduce `workers` in playwright.config.ts
- Increase `CONCURRENT` in Browserless
- Increase Browserless memory/CPU limits

### 3. Flaky Tests in Parallel

**Problem**: Tests pass sequentially but fail in parallel

**Cause**: Race conditions, shared state, timing dependencies

**Solution**:
- Fix test isolation issues
- Add proper waits (not arbitrary sleeps)
- Use Playwright's auto-waiting features

### 4. Progress Monitoring Confusion

**Problem**: Progress jumps around (tests complete out of order)

**Example**:
```
[1/33] test A
[2/33] test B
✓ [2/33] test B (1s)  # Finished first
[3/33] test C
✓ [1/33] test A (2s)  # Finished second
```

**Solution**: Our progress monitoring still works (counts total ✓ and ✘)

## Implementation Steps

### 1. Update playwright.config.ts

```bash
cd ~/cover-gen
nano playwright.config.ts
```

Add:
```typescript
workers: 5,
fullyParallel: true,
```

### 2. Update Browserless (if needed)

```bash
# Check current Browserless config
podman inspect browserless | jq '.[0].Config.Env'

# Restart with increased capacity (if needed)
podman stop browserless
podman rm browserless
podman run -d -p 3000:3000 --name browserless \
  -e CONCURRENT=10 \
  -e PREBOOT_CHROME=true \
  --shm-size=8gb \
  --restart always \
  ghcr.io/browserless/chromium
```

### 3. Test Locally

```bash
cd ~/cover-gen
npm run test:e2e
```

Watch for:
- Multiple tests running concurrently
- Faster completion time
- No connection errors

### 4. Monitor in Pipeline

Pipeline scripts don't need changes:
- IAP token shared via env var (works with parallel)
- Progress parsing still captures counts
- Tmux monitoring still works

## Recommendation

**For cover-gen (33 tests)**:
- ✅ Start with `workers: 5`
- ✅ Enable `fullyParallel: true`
- ✅ Keep current Browserless config (CONCURRENT=10 is enough)
- ✅ Expected speedup: 2 min → 30-40s (3-4x faster)

**For larger projects (60+ tests)**:
- ✅ Use `workers: 10`
- ✅ Increase Browserless `CONCURRENT=15`
- ✅ Monitor resource usage
- ✅ Expected speedup: 4-6x faster

**Benefits for pipeline**:
- ✅ Faster feedback (tests complete sooner)
- ✅ Less chance of IAP token expiration
- ✅ Better resource utilization
- ✅ No pipeline script changes needed

## Risks

**Low risk**:
- Configuration is per-project (playwright.config.ts)
- Can be rolled back easily (set workers: 1)
- Pipeline scripts already handle parallel output
- Browserless already supports concurrent connections

**Medium risk**:
- Tests might have hidden dependencies (fix test isolation)
- Browserless might need more resources (monitor and adjust)

**Mitigation**:
- Test locally first
- Start with fewer workers (3-5)
- Monitor resource usage
- Gradually increase workers if stable

## Next Steps

1. **Review cover-gen tests** for parallel-safety
2. **Update playwright.config.ts** with `workers: 5`
3. **Test locally** to verify speedup
4. **Monitor pipeline** execution (should work as-is)
5. **Adjust workers** based on results

Would you like me to:
- Check cover-gen tests for parallel-safety?
- Update playwright.config.ts for parallel execution?
- Add documentation to the skill?
