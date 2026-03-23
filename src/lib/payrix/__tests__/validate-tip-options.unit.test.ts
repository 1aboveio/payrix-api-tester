import { describe, expect, it } from 'vitest';
import { parseTipOptions, validateTipOptions } from '../validate-tip-options';

describe('parseTipOptions', () => {
  it('parses comma-separated values', () => {
    expect(parseTipOptions('15,18,20,none')).toEqual(['15', '18', '20', 'none']);
  });

  it('trims whitespace', () => {
    expect(parseTipOptions(' 15 , 18 , 20 , none ')).toEqual(['15', '18', '20', 'none']);
  });

  it('filters empty strings', () => {
    expect(parseTipOptions('15,,18,,none')).toEqual(['15', '18', 'none']);
  });

  it('returns empty array for empty input', () => {
    expect(parseTipOptions('')).toEqual([]);
  });

  it('handles fixed amounts', () => {
    expect(parseTipOptions('5.00,10.00,other')).toEqual(['5.00', '10.00', 'other']);
  });
});

describe('validateTipOptions', () => {
  it('accepts valid percentages', () => {
    expect(validateTipOptions(['15', '18', '20', 'none'])).toEqual({ valid: true });
  });

  it('accepts valid fixed amounts', () => {
    expect(validateTipOptions(['5.00', '10.00', 'other'])).toEqual({ valid: true });
  });

  it('accepts special values case-insensitively', () => {
    expect(validateTipOptions(['15', 'NONE', 'OTHER'])).toEqual({ valid: true });
  });

  it('accepts single option', () => {
    expect(validateTipOptions(['20'])).toEqual({ valid: true });
  });

  it('rejects empty array', () => {
    const result = validateTipOptions([]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least one');
  });

  it('rejects more than 6 options', () => {
    const result = validateTipOptions(['1', '2', '3', '4', '5', '6', '7']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('6');
  });

  it('rejects mixing percentages with fixed amounts', () => {
    const result = validateTipOptions(['15', '10.00', 'none']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('mix');
  });

  it('rejects negative numbers', () => {
    const result = validateTipOptions(['-5', '18', 'none']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('"-5"');
  });

  it('rejects non-numeric non-special values', () => {
    const result = validateTipOptions(['abc', '18', 'none']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('"abc"');
  });

  it('accepts max 6 valid options', () => {
    expect(validateTipOptions(['1', '2', '3', '4', '5', '6'])).toEqual({ valid: true });
  });

  it('accepts only special values', () => {
    expect(validateTipOptions(['none', 'other'])).toEqual({ valid: true });
  });
});
