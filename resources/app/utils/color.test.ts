import { describe, expect, it } from 'vitest';

import { isValidHex, normalizeHex } from '@/utils/color';

describe('normalizeHex', () => {
  it('lowercases and trims', () => {
    expect(normalizeHex('  #007BA7 ')).toBe('#007ba7');
  });

  it('prefixes a missing hash', () => {
    expect(normalizeHex('007ba7')).toBe('#007ba7');
  });

  it('returns an empty string for blank input', () => {
    expect(normalizeHex('   ')).toBe('');
  });
});

describe('isValidHex', () => {
  it('accepts shorthand and full hex', () => {
    expect(isValidHex('#fff')).toBe(true);
    expect(isValidHex('#007ba7')).toBe(true);
    expect(isValidHex('#007BA7')).toBe(true);
  });

  it('rejects partial and non-hex input', () => {
    expect(isValidHex('#00')).toBe(false);
    expect(isValidHex('zzz')).toBe(false);
    expect(isValidHex('')).toBe(false);
    expect(isValidHex('#0000')).toBe(false);
  });

  it('accepts alpha hex only when alpha is enabled', () => {
    expect(isValidHex('#007ba7ff')).toBe(false);
    expect(isValidHex('#007ba7ff', { alpha: true })).toBe(true);
    expect(isValidHex('#fffa', { alpha: true })).toBe(true);
  });
});
