import { describe, expect, it } from 'vitest';

import { TaxRulesFormSchema } from '@/schemas/forms/tax-rules-form';

describe('TaxRulesFormSchema', () => {
  it('reshapes the flat form into the nested relation/conditions/action structure', () => {
    const result = TaxRulesFormSchema.parse({
      conditions: [{ id: '1', condition: 'tax_profile', value: 'Books' }],
      action_type: 'set_tax_rate',
      action_value: '7.5',
      selectedCountries: [],
    });

    expect(result).toEqual({
      relation: 'AND',
      conditions: [{ type: 'tax_profile', operator: '=', value: 'Books' }],
      action: { type: 'set_tax_rate', value: '7.5' },
    });
  });

  it('does not include selectedCountries in the payload', () => {
    const result = TaxRulesFormSchema.parse({
      conditions: [{ id: '1', condition: 'destination_region', value: null }],
      action_type: 'set_tax_rate',
      action_value: '7.5',
      selectedCountries: ['US', 'CA'],
    });
    expect(result).not.toHaveProperty('selectedCountries');
  });

  it('defaults action.value to 0 when action_value is blank', () => {
    const result = TaxRulesFormSchema.parse({
      conditions: [],
      action_type: 'set_tax_rate',
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
});
