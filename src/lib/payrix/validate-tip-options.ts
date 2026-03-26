/**
 * Parses a comma-separated tip selections string into an array of trimmed, non-empty values.
 */
export function parseTipSelections(input: string): string[] {
  return input.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Validates tipSelections per triPOS rules:
 * - Max 6 selections (triPOS limit)
 * - Valid values: percentages (15, 18), fixed amounts (5.00, 10.00)
 * - No mixing percentages with fixed amounts
 * - Values must be positive
 * - At least 1 selection required when tip prompt is enabled
 * 
 * @param selections - Comma-separated tip selections string
 * @param type - 'Amount', 'Percentage', or 'Prompt'
 */
export function validateTipSelections(
  selections: string,
  type: 'Amount' | 'Percentage' | 'Prompt'
): { valid: boolean; error?: string } {
  const options = parseTipSelections(selections);

  if (type === 'Prompt') {
    // Prompt mode doesn't use selections, but we still validate format
    return { valid: true };
  }

  if (options.length === 0) {
    return { valid: false, error: 'At least one tip selection is required.' };
  }
  if (options.length > 6) {
    return { valid: false, error: 'Maximum 6 tip selections allowed.' };
  }

  for (const opt of options) {
    const num = parseFloat(opt);
    if (isNaN(num) || num < 0) {
      return { valid: false, error: `Invalid tip selection: "${opt}". Must be a positive number.` };
    }
  }

  // Detect mixing: percentages are whole numbers, fixed amounts have decimals
  const hasPercentage = options.some((o) => !o.includes('.'));
  const hasFixed = options.some((o) => o.includes('.'));
  if (hasPercentage && hasFixed) {
    return { valid: false, error: 'Cannot mix percentage and fixed dollar tip selections.' };
  }

  // Validate type consistency
  if (type === 'Amount' && !hasFixed && hasPercentage) {
    return { valid: false, error: 'Amount type should use decimal values (e.g., 3.00, 5.00).' };
  }
  if (type === 'Percentage' && !hasPercentage && hasFixed) {
    return { valid: false, error: 'Percentage type should use whole numbers (e.g., 15, 20).' };
  }

  return { valid: true };
}

// Legacy exports for backward compatibility
/**
 * @deprecated Use parseTipSelections instead
 */
export function parseTipOptions(input: string): string[] {
  return parseTipSelections(input);
}

/**
 * @deprecated Use validateTipSelections instead
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
