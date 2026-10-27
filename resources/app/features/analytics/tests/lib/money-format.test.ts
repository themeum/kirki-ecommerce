import { describe, expect, it } from 'vitest';

import { formatCompactNumber } from '@/features/analytics/lib/format';
import { createCompactMinorFormatter } from '@/features/analytics/lib/money-format';

describe('createCompactMinorFormatter', () => {
  const format = createCompactMinorFormatter('USD');

  it('shows values under 1,000 as whole amounts', () => {
    expect(format(0)).toBe('$0');
    expect(format(75000)).toBe('$750');
  });

  it('shortens large values with at most 1 decimal and no trailing zero', () => {
    expect(format(100000)).toBe('$1K');
    expect(format(150000)).toBe('$1.5K');
    expect(format(11000000)).toBe('$110K');
    expect(format(230000000)).toBe('$2.3M');
  });

  it('uses the base currency symbol', () => {
    expect(createCompactMinorFormatter('EUR')(150000)).toBe('€1.5K');
  });

  it('uses the minor unit digits of the currency', () => {
    expect(createCompactMinorFormatter('JPY')(1500)).toBe('¥1.5K');
  });
});

describe('formatCompactNumber', () => {
  it('shortens counts with no symbol', () => {
    expect(formatCompactNumber(500)).toBe('500');
    expect(formatCompactNumber(1200)).toBe('1.2K');
    expect(formatCompactNumber(2000)).toBe('2K');
  });
});
