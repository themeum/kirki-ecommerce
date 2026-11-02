import { describe, expect, it } from 'vitest';

import { TaxRulesFormSchema } from '@/features/settings/tax/shared/schemas/forms/tax-rules-form';

describe('TaxRulesFormSchema', () => {
  it('reshapes the flat form into the nested relation/conditions/action structure', () => {
    const result = TaxRulesFormSchema.parse({
      conditions: [{ id: '1', condition: 'tax_profile', value: 'Books' }],
      action_type: 'set_product_tax_rate',
      action_value: '7.5',
      selectedCountries: [],
    });

    expect(result).toEqual({
      relation: 'AND',
      conditions: [{ type: 'tax_profile', operator: '=', value: 'Books' }],
      action: { type: 'set_product_tax_rate', value: '7.5' },
    });
  });

  it('carries the selected operator into the payload and defaults to =', () => {
    const result = TaxRulesFormSchema.parse({
      conditions: [
        { id: '1', condition: 'tax_profile', operator: '!=', value: 'Books' },
        { id: '2', condition: 'product_categories', value: 'Food' },
      ],
      action_type: 'set_product_tax_exempt',
      action_value: null,
      selectedCountries: [],
    });

    expect(result.conditions.map((c) => c.operator)).toEqual(['!=', '=']);
  });

  it('carries the != operator for destination conditions', () => {
    const result = TaxRulesFormSchema.parse({
      conditions: [
        { id: '1', condition: 'destination_region', operator: '!=', value: { country: ['US'] } },
      ],
      action_type: 'set_product_tax_exempt',
      action_value: null,
      selectedCountries: [],
    });

    expect(result.conditions[0].operator).toBe('!=');
  });

  it('does not include selectedCountries in the payload', () => {
    const result = TaxRulesFormSchema.parse({
      conditions: [{ id: '1', condition: 'destination_region', value: { country: ['US', 'CA'] } }],
      action_type: 'set_product_tax_rate',
      action_value: '7.5',
      selectedCountries: ['US', 'CA'],
    });
    expect(result).not.toHaveProperty('selectedCountries');
  });

  it('defaults action.value to 0 when the action takes no value', () => {
    const result = TaxRulesFormSchema.parse({
      conditions: [],
      action_type: 'set_product_tax_exempt',
      action_value: null,
      selectedCountries: [],
    });
    expect(result.action.value).toBe(0);
  });

  it('rejects a blank required action_type', () => {
    const result = TaxRulesFormSchema.safeParse({
      conditions: [],
      action_type: '  ',
      action_value: '',
      selectedCountries: [],
    });
    expect(result.success).toBe(false);
  });

  it.each(['set_product_tax_rate', 'set_shipping_tax_rate'])(
    'rejects a blank or non-numeric rate for %s',
    (action_type) => {
      ['', null, 'abc'].forEach((action_value) => {
        const result = TaxRulesFormSchema.safeParse({
          conditions: [],
          action_type,
          action_value,
          selectedCountries: [],
        });
        expect(result.success).toBe(false);
      });
    },
  );

  it('rejects a condition without a value', () => {
    const result = TaxRulesFormSchema.safeParse({
      conditions: [{ id: '1', condition: 'product_categories', value: null }],
      action_type: 'set_product_tax_exempt',
      action_value: '',
      selectedCountries: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a shipping tax rate rule with a non-destination condition', () => {
    const result = TaxRulesFormSchema.safeParse({
      conditions: [
        { id: '1', condition: 'destination_region', value: { country: ['DE'] } },
        { id: '2', condition: 'tax_profile', value: '3' },
      ],
      action_type: 'set_shipping_tax_rate',
      action_value: '5',
      selectedCountries: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a shipping tax rate rule with only destination conditions', () => {
    const result = TaxRulesFormSchema.safeParse({
      conditions: [{ id: '1', condition: 'destination_region', value: { country: ['DE'] } }],
      action_type: 'set_shipping_tax_rate',
      action_value: '5',
      selectedCountries: [],
    });
    expect(result.success).toBe(true);
  });
});
