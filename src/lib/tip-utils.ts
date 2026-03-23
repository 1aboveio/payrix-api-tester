/**
 * Parses a comma-separated tip options string into an array of trimmed, non-empty values.
 */
export function parseTipOptions(input: string): string[] {
  return input.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Validates tipPromptOptions per triPOS rules:
 * - Max 6 options (triPOS limit)
 * - Valid values: percentages (15, 18), fixed amounts (5.00, 10.00), or special (none, other)
 * - No mixing percentages with fixed amounts
 * - Values must be positive
 * - At least 1 option required when tip prompt is enabled
 */
export function validateTipOptions(options: string[]): { valid: boolean; error?: string } {
  const specialValues = ['none', 'other'];
  const nonSpecial = options.filter((o) => !specialValues.includes(o.toLowerCase()));

  if (options.length === 0) {
    return { valid: false, error: 'At least one tip option is required when tip prompt is enabled.' };
  }
  if (options.length > 6) {
    return { valid: false, error: 'Maximum 6 tip options allowed.' };
  }

  for (const opt of nonSpecial) {
    const num = parseFloat(opt);
    if (isNaN(num) || num < 0) {
      return { valid: false, error: `Invalid tip option: "${opt}". Must be a positive number, "none", or "other".` };
    }
  }

  // Detect mixing: percentages are whole numbers, fixed amounts have decimals
  const hasPercentage = nonSpecial.some((o) => !o.includes('.'));
  const hasFixed = nonSpecial.some((o) => o.includes('.'));
  if (hasPercentage && hasFixed) {
    return { valid: false, error: 'Cannot mix percentage and fixed dollar tip options.' };
  }

  return { valid: true };
}
