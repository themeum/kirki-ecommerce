import { describe, expect, it } from 'vitest';

import { shouldShowSimpleVariantSections } from '@/features/products/lib/variant-sections';

describe('shouldShowSimpleVariantSections', () => {
  it('shows the simple sections when the product has no variants', () => {
    expect(shouldShowSimpleVariantSections(false, [1, 2])).toBe(true);
  });

  it('shows the simple sections when attribute values are not yet defined', () => {
    expect(shouldShowSimpleVariantSections(true, undefined)).toBe(true);
  });

  it('shows the simple sections when attribute values are empty', () => {
    expect(shouldShowSimpleVariantSections(true, [])).toBe(true);
  });

  it('hides the simple sections once variants carry attribute values', () => {
    expect(shouldShowSimpleVariantSections(true, [1, 2])).toBe(false);
  });

  it('treats a truthy non-array attribute value as already resolved, matching current behavior', () => {
    const nonArrayValue = {} as unknown as number[];

    expect(shouldShowSimpleVariantSections(true, nonArrayValue)).toBe(false);
  });
});
