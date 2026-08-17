import { describe, expect, it } from 'vitest';

import { ShippingRuleFormSchema } from '@/features/settings/shipping/schemas/forms/shipping-rule-form';

describe('ShippingRuleFormSchema', () => {
  it('reshapes the flat form into the nested relation/conditions/action structure', () => {
    const result = ShippingRuleFormSchema.parse({
      condition: 'product_category',
      operator: 'is',
      condition_value: 'Shoes',
      action: 'set_shipping_cost',
      action_value: '10',
    });

    expect(result).toEqual({
      relation: 'AND',
      conditions: [{ type: 'product_category', operator: 'is', value: 'Shoes' }],
      action: { type: 'set_shipping_cost', value: '10' },
    });
  });

  it('nulls action.value for non-cost actions even when action_value is set', () => {
    const result = ShippingRuleFormSchema.parse({
      condition: 'product_category',
      operator: 'is',
      condition_value: 'Shoes',
      action: 'hide_method',
      action_value: '10',
    });
    expect(result.action.value).toBeNull();
  });

  it('defaults the operator to = when blank', () => {
    const result = ShippingRuleFormSchema.parse({
      condition: 'cart_weight',
      operator: '',
      condition_value: 5,
      action: 'set_shipping_cost',
      action_value: '10',
    });
    expect(result.conditions[0].operator).toBe('=');
  });

  it('rejects blank required condition or action', () => {
    expect(
      ShippingRuleFormSchema.safeParse({ condition: '', action: 'set_shipping_cost' }).success,
    ).toBe(false);
    expect(
      ShippingRuleFormSchema.safeParse({ condition: 'cart_weight', action: '' }).success,
    ).toBe(false);
  });
});
