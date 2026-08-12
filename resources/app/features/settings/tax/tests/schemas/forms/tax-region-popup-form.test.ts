import { describe, expect, it } from 'vitest';

import { TaxRegionPopupFormSchema } from '@/features/settings/tax/schemas/forms/tax-region-popup-form';

describe('TaxRegionPopupFormSchema', () => {
  it('produces the exact payload', () => {
    const result = TaxRegionPopupFormSchema.parse({
      selectedCountries: ['US'],
      selectedRegion: [{ country: 'US' }],
    });
    expect(result).toEqual({ selectedCountries: ['US'], selectedRegion: [{ country: 'US' }] });
  });

  it('rejects an empty country selection', () => {
    expect(
      TaxRegionPopupFormSchema.safeParse({ selectedCountries: [], selectedRegion: [] }).success,
    ).toBe(false);
  });
});
