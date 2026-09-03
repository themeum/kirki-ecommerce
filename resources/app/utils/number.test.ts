import { describe, expect, it } from 'vitest';

import { clampValue } from '@/utils/number';

describe('clampValue', () => {
  it('raises a value below min up to min', () => {
    expect(clampValue(3, 10, 100)).toBe(10);
  });

  it('lowers a value above max down to max', () => {
    expect(clampValue(150, 0, 100)).toBe(100);
  });

  it('leaves a value within range untouched', () => {
    expect(clampValue(42, 0, 100)).toBe(42);
  });

  it('ignores a null or undefined bound', () => {
    expect(clampValue(-5, null, 100)).toBe(-5);
    expect(clampValue(500, 0, undefined)).toBe(500);
    expect(clampValue(-5)).toBe(-5);
  });
});
