import { describe, expect, it } from 'vitest';

import { formatTaxRateLabel } from '@/features/settings/tax/shared/lib/rate-label';

describe('formatTaxRateLabel', () => {
  it('returns nothing when there is no rate to show', () => {
    expect(formatTaxRateLabel([])).toBe('');
    expect(formatTaxRateLabel([null, undefined, ''])).toBe('');
  });

  it('shows a single configured rate', () => {
    expect(formatTaxRateLabel([20])).toBe('20%');
  });

  it('shows a configured zero as a rate', () => {
    expect(formatTaxRateLabel([0])).toBe('0%');
  });

  it('collapses identical rates to one value', () => {
    expect(formatTaxRateLabel([20, 20, 20])).toBe('20%');
  });

  it('shows the lowest and highest when rates differ', () => {
    expect(formatTaxRateLabel([20, 5, 12])).toBe('5–20%');
  });

  it('reads rates stored as strings', () => {
    expect(formatTaxRateLabel(['7.5', 20])).toBe('7.5–20%');
  });

  it('ignores entries that are not numbers', () => {
    expect(formatTaxRateLabel(['abc', 20])).toBe('20%');
  });
});
