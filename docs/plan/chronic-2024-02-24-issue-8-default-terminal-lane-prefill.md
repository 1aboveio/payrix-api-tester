# chronic-2024-02-24-issue-8-default-terminal-lane-prefill.md

**Issue:** [#8](https://github.com/1aboveio/payrix-api-tester/issues/8)  
**Title:** Default terminal and lane pre-fill  
**Created:** 2024-02-24  
**Author:** @exoulster  

---

## Problem Statement

When default `terminalId` and `laneId` are set in Settings, they should be pre-filled in all transaction, reversal, and utility forms. Currently, forms start empty even when defaults are configured.

**Expected Behavior:** All forms should pre-populate with the default values from settings when they exist.

---

## Implementation Plan

### Phase 1: Update Settings Storage (30 min) ✅ COMPLETE

#### Tasks:
1. **Update `PayrixConfig` type** to include `defaultTerminalId` ✅
   - File: `src/lib/payrix/types.ts`
   - Add `defaultTerminalId?: string` to config interface

2. **Update Settings Page** ✅
   - File: `src/app/settings/page.tsx`
   - Add input field for `defaultTerminalId`
   - Update localStorage persistence

3. **Update `usePayrixConfig` hook** ✅
   - File: `src/hooks/use-payrix-config.ts`
   - Load `defaultTerminalId` from localStorage
   - Include in context provider value

---

### Phase 2: Update Transaction Forms (45 min) ✅ COMPLETE

| Form | Fields to Pre-fill | File | Status |
|------|-------------------|------|--------|
| `/transactions/sale` | `laneId` | `src/app/transactions/sale/page.tsx` | ✅ |
| `/transactions/authorization` | `laneId` | `src/app/transactions/authorization/page.tsx` | ✅ |
| `/transactions/bin-query` | `laneId` | `src/app/transactions/bin-query/page.tsx` | ✅ |
| `/transactions/force` | `laneId` | `src/app/transactions/force/page.tsx` | ✅ |
| `/transactions/refund` | `laneId` | `src/app/transactions/refund/page.tsx` | ✅ |
| `/transactions/query` | `terminalId` | `src/app/transactions/query/page.tsx` | ✅ |

Note: `completion` form uses transactionId from URL params, not laneId.

**Implementation Pattern:**
```typescript
const { config } = usePayrixConfig();
const [laneId, setLaneId] = useState(config.defaultLaneId ?? '');
const [terminalId, setTerminalId] = useState(config.defaultTerminalId ?? '');
```

---

### Phase 3: Update Reversal Forms (30 min) ✅ COMPLETE

| Form | Fields to Pre-fill | File | Status |
|------|-------------------|------|--------|
| `/reversals/cancel` | `laneId` | `src/app/reversals/cancel/page.tsx` | ✅ |
| `/reversals/credit` | `laneId` | `src/app/reversals/credit/page.tsx` | ✅ |

Note: `void`, `return`, `reversal` forms use transactionId from URL params, not laneId.

---

### Phase 4: Update Utility Forms (30 min) ✅ COMPLETE

| Form | Fields to Pre-fill | File | Status |
|------|-------------------|------|--------|
| `/utility/input` | `laneId` | `src/app/utility/input/page.tsx` | ✅ |
| `/utility/selection` | `laneId` | `src/app/utility/selection/page.tsx` | ✅ |
| `/utility/signature` | `laneId` | `src/app/utility/signature/page.tsx` | ✅ |
| `/utility/display` | `laneId` | `src/app/utility/display/page.tsx` | ✅ |
| `/utility/idle` | `laneId` | `src/app/utility/idle/page.tsx` | ✅ |

---

### Phase 5: E2E Test Specification (45 min) ✅ COMPLETE

Created comprehensive E2E tests to verify default pre-fill behavior:

#### Test File: `e2e/default-prefill.spec.ts` ✅

- Transaction Forms (6 tests)
- Reversal Forms (2 tests)  
- Utility Forms (5 tests)
- Reset Button Behavior (1 test)
- No Defaults Set scenario (1 test)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Default Terminal and Lane Pre-fill', () => {
  const TEST_LANE_ID = '12345';
  const TEST_TERMINAL_ID = 'TERM-001';

  test.beforeEach(async ({ page }) => {
    // Navigate to settings and set defaults
    await page.goto('/settings');
    await page.getByLabel(/Default Lane ID/i).fill(TEST_LANE_ID);
    await page.getByLabel(/Default Terminal ID/i).fill(TEST_TERMINAL_ID);
    await page.getByRole('button', { name: /Save/i }).click();
  });

  test.describe('Transaction Forms', () => {
    test('Sale form pre-fills laneId and terminalId', async ({ page }) => {
      await page.goto('/transactions/sale');
      await expect(page.getByLabel(/Lane ID/i)).toHaveValue(TEST_LANE_ID);
      await expect(page.getByLabel(/Terminal ID/i)).toHaveValue(TEST_TERMINAL_ID);
    });

    test('Authorization form pre-fills laneId and terminalId', async ({ page }) => {
      await page.goto('/transactions/authorization');
      await expect(page.getByLabel(/Lane ID/i)).toHaveValue(TEST_LANE_ID);
      await expect(page.getByLabel(/Terminal ID/i)).toHaveValue(TEST_TERMINAL_ID);
    });

    test('Completion form pre-fills laneId', async ({ page }) => {
      await page.goto('/transactions/completion');
      await expect(page.getByLabel(/Lane ID/i)).toHaveValue(TEST_LANE_ID);
    });

    test('Query form pre-fills terminalId', async ({ page }) => {
      await page.goto('/transactions/query');
      await expect(page.getByLabel(/Terminal ID/i)).toHaveValue(TEST_TERMINAL_ID);
    });
  });

  test.describe('Reversal Forms', () => {
    test('Void form pre-fills laneId', async ({ page }) => {
      await page.goto('/reversals/void');
      await expect(page.getByLabel(/Lane ID/i)).toHaveValue(TEST_LANE_ID);
    });

    test('Return form pre-fills laneId', async ({ page }) => {
      await page.goto('/reversals/return');
      await expect(page.getByLabel(/Lane ID/i)).toHaveValue(TEST_LANE_ID);
    });

    test('Cancel form pre-fills laneId', async ({ page }) => {
      await page.goto('/reversals/cancel');
      await expect(page.getByLabel(/Lane ID/i)).toHaveValue(TEST_LANE_ID);
    });
  });

  test.describe('Utility Forms', () => {
    test('Input status form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/input');
      await expect(page.getByLabel(/Lane ID/i)).toHaveValue(TEST_LANE_ID);
    });

    test('Selection status form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/selection');
      await expect(page.getByLabel(/Lane ID/i)).toHaveValue(TEST_LANE_ID);
    });

    test('Signature status form pre-fills laneId', async ({ page }) => {
      await page.goto('/utility/signature');
      await expect(page.getByLabel(/Lane ID/i)).toHaveValue(TEST_LANE_ID);
    });
  });

  test.describe('Reset Button Behavior', () => {
    test('Reset button clears to defaults, not empty', async ({ page }) => {
      await page.goto('/transactions/sale');
      
      // Change values
      await page.getByLabel(/Lane ID/i).fill('99999');
      await page.getByLabel(/Terminal ID/i).fill('OTHER');
      
      // Click reset
      await page.getByRole('button', { name: /Reset/i }).click();
      
      // Should revert to defaults
      await expect(page.getByLabel(/Lane ID/i)).toHaveValue(TEST_LANE_ID);
      await expect(page.getByLabel(/Terminal ID/i)).toHaveValue(TEST_TERMINAL_ID);
    });
  });

  test.describe('No Defaults Set', () => {
    test.beforeEach(async ({ page }) => {
      // Clear defaults
      await page.goto('/settings');
      await page.getByLabel(/Default Lane ID/i).clear();
      await page.getByLabel(/Default Terminal ID/i).clear();
      await page.getByRole('button', { name: /Save/i }).click();
    });

    test('Forms start empty when no defaults set', async ({ page }) => {
      await page.goto('/transactions/sale');
      await expect(page.getByLabel(/Lane ID/i)).toHaveValue('');
      await expect(page.getByLabel(/Terminal ID/i)).toHaveValue('');
    });
  });
});
```

---

### Phase 6: Manual Testing Checklist (15 min)

- [ ] Open Settings, set default Lane ID and Terminal ID
- [ ] Navigate to each transaction form, verify pre-fill
- [ ] Navigate to each reversal form, verify pre-fill  
- [ ] Navigate to each utility form, verify pre-fill
- [ ] Test Reset button reverts to defaults
- [ ] Clear defaults in Settings, verify forms start empty
- [ ] Verify manual override still works

---

## Files to Modify

### Core Changes
1. `src/lib/payrix/types.ts` - Add `defaultTerminalId` to config
2. `src/hooks/use-payrix-config.ts` - Load/save terminalId
3. `src/app/settings/page.tsx` - Add terminalId input

### Form Updates (18 files)
**Transactions:**
- `src/app/transactions/sale/page.tsx`
- `src/app/transactions/authorization/page.tsx`
- `src/app/transactions/completion/page.tsx`
- `src/app/transactions/refund/page.tsx`
- `src/app/transactions/force/page.tsx`
- `src/app/transactions/bin-query/page.tsx`
- `src/app/transactions/query/page.tsx`

**Reversals:**
- `src/app/reversals/void/page.tsx`
- `src/app/reversals/return/page.tsx`
- `src/app/reversals/reversal/page.tsx`
- `src/app/reversals/cancel/page.tsx`
- `src/app/reversals/credit/page.tsx`

**Utilities:**
- `src/app/utility/input/page.tsx`
- `src/app/utility/selection/page.tsx`
- `src/app/utility/signature/page.tsx`
- `src/app/utility/display/page.tsx`
- `src/app/utility/idle/page.tsx`

### E2E Tests
- `e2e/default-prefill.spec.ts` (new file)

---

## Estimated Timeline

| Phase | Estimated Time |
|-------|---------------|
| Phase 1: Settings Storage | 30 min |
| Phase 2: Transaction Forms | 45 min |
| Phase 3: Reversal Forms | 30 min |
| Phase 4: Utility Forms | 30 min |
| Phase 5: E2E Tests | 45 min |
| Phase 6: Manual Testing | 15 min |
| **Total** | **~3.5 hours** |

---

## Acceptance Criteria

- [ ] All 18 forms pre-fill with defaults when configured
- [ ] E2E tests pass for all form categories
- [ ] Reset button behavior is consistent (reverts to defaults)
- [ ] Manual override still works on all forms
- [ ] Build passes with no TypeScript errors

---

## Related

- Issue: #8
- Service: payrix-api-tester-dev
