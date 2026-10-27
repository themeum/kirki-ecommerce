import { describe, expect, it } from 'vitest';

import { OnboardingFormSchema } from '@/features/onboarding/schemas/forms/onboarding-form';
import { getDefaults } from '@/libs/zod';

describe('OnboardingFormSchema', () => {
  const base = {
    ...getDefaults(OnboardingFormSchema),
    store_name: 'Acme',
    country: 'BD',
    currency: 'BDT',
  };

  it('defaults tax collection off and industry to other', () => {
    const result = OnboardingFormSchema.parse(base);

    expect(result).toEqual({
      store_name: 'Acme',
      industry: 'other',
      country: 'BD',
      store_address: {
        address_line_1: null,
        address_line_2: null,
        city: null,
        state: null,
        postal_code: null,
      },
      currency: 'BDT',
      is_tax_collected: false,
      is_tax_inclusive_price: false,
      store_tax_id: null,
    });
  });

  it('produces the exact payload for a fully filled form', () => {
    const result = OnboardingFormSchema.parse({
      ...base,
      store_name: '  Acme  ',
      industry: 'food-and-drink',
      store_address: {
        address_line_1: '12 Road',
        address_line_2: '',
        city: ' Dhaka ',
        state: 'BD-13',
        postal_code: '1207',
      },
      is_tax_collected: true,
      is_tax_inclusive_price: true,
      store_tax_id: ' VAT-123 ',
    });

    expect(result).toEqual({
      store_name: 'Acme',
      industry: 'food-and-drink',
      country: 'BD',
      store_address: {
        address_line_1: '12 Road',
        address_line_2: null,
        city: 'Dhaka',
        state: 'BD-13',
        postal_code: '1207',
      },
      currency: 'BDT',
      is_tax_collected: true,
      is_tax_inclusive_price: true,
      store_tax_id: 'VAT-123',
    });
  });

  it('clears the tax pricing and tax ID when tax is not collected', () => {
    const result = OnboardingFormSchema.parse({
      ...base,
      is_tax_collected: false,
      is_tax_inclusive_price: true,
      store_tax_id: 'VAT-123',
    });

    expect(result.is_tax_inclusive_price).toBe(false);
    expect(result.store_tax_id).toBeNull();
  });

  it.each(['store_name', 'country', 'currency'] as const)('requires %s', (field) => {
    const result = OnboardingFormSchema.safeParse({ ...base, [field]: '  ' });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toContain(field);
  });
});
