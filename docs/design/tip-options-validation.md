# Design: Validate tipOptions (#267)

## Summary

Add client-side and server-side validation for `tipPromptOptions` in the sale flow. Currently the input accepts any comma-separated string with no validation, which can result in triPOS API errors or unexpected PIN pad behavior.

## Background

The triPOS sale endpoint accepts a `configuration.tipPromptOptions` array when `enableTipPrompt: true`. The PIN pad displays these options to the cardholder during checkout.

Reference: `https://tripos.vantiv.com/api/help/kb/tipOptions.html`

## triPOS Rules

| Rule | Detail |
|------|--------|
| Max options | 6 (was 4 in older triPOS versions, expanded in v4.6+) |
| Percentage format | Whole numbers without `%` symbol: `"15"`, `"18"`, `"20"` |
| Fixed dollar format | Decimal strings: `"5.00"`, `"10.00"` |
| Special values | `"none"` (no tip), `"other"` (custom entry) |
| Mixing | Do not mix percentages and fixed dollar amounts |
| Minimum | At least 1 option required when tip prompt is enabled |
| Values | Must be non-negative numbers (or special values) |

## Current Behavior

- Sale page (`src/app/transactions/sale/page.tsx` line 64): `tipOptions` state is a comma-separated string, default `"15,18,20,none"`
- Split by comma, trimmed, filtered empty, passed as `tipPromptOptions` array
- No validation — any string accepted
- Templates (`src/lib/payrix/templates.ts` lines 126-138) include examples of both percentage and fixed-dollar tip options

## Design

### Validation function

Create a shared utility `src/lib/payrix/validate-tip-options.ts`:

```typescript
export interface TipOptionsValidation {
  valid: boolean;
  error?: string;
}

const SPECIAL_VALUES = ['none', 'other'];
const MAX_TIP_OPTIONS = 6;

export function validateTipOptions(options: string[]): TipOptionsValidation {
  if (options.length === 0) {
    return { valid: false, error: 'At least one tip option is required.' };
  }

  if (options.length > MAX_TIP_OPTIONS) {
    return { valid: false, error: `Maximum ${MAX_TIP_OPTIONS} tip options allowed (triPOS limit).` };
  }

  const nonSpecial = options.filter(o => !SPECIAL_VALUES.includes(o.toLowerCase()));

  for (const opt of nonSpecial) {
    const num = parseFloat(opt);
    if (isNaN(num) || num < 0) {
      return { valid: false, error: `Invalid tip option: "${opt}". Must be a number, "none", or "other".` };
    }
  }

  // Detect mixing: percentages are whole numbers, fixed amounts have decimals
  const hasPercentage = nonSpecial.some(o => !o.includes('.'));
  const hasFixed = nonSpecial.some(o => o.includes('.'));
  if (hasPercentage && hasFixed) {
    return { valid: false, error: 'Cannot mix percentage and fixed dollar tip options.' };
  }

  return { valid: true };
}
```

### Client-side (sale page)

1. Call `validateTipOptions()` on parsed options in a `useMemo`
2. Display validation error below the tip options input (red text)
3. Disable "Execute Sale" button when tip options are invalid and mode is `pinpad`

### Server-side (action)

1. In `executeSaleAction` (or wherever the sale request is built), validate `configuration.tipPromptOptions` before sending to triPOS
2. Return early with error if invalid: `{ success: false, error: "..." }`

### UI changes

- Error text below tip options input field
- Update helper text to mention the 6-option limit
- Existing default `"15,18,20,none"` is already valid (4 options, all percentages + special)

## Files to modify

- **New:** `src/lib/payrix/validate-tip-options.ts` — validation utility
- **New:** `src/lib/payrix/__tests__/validate-tip-options.unit.test.ts` — unit tests
- `src/app/transactions/sale/page.tsx` — UI validation + error display
- `src/actions/payrix.ts` — server-side validation in sale action

## Test cases

| Input | Expected |
|-------|----------|
| `["15", "18", "20", "none"]` | ✅ valid |
| `["5.00", "10.00", "other"]` | ✅ valid |
| `["15", "18", "20", "25", "30", "none"]` | ✅ valid (6 = max) |
| `["15", "18", "20", "25", "30", "35", "none"]` | ❌ max 6 |
| `["15", "5.00", "none"]` | ❌ mixing |
| `["-5"]` | ❌ negative |
| `["abc"]` | ❌ not a number |
| `[]` | ❌ empty |
| `["none"]` | ✅ valid (special only) |
| `["other"]` | ✅ valid (special only) |
