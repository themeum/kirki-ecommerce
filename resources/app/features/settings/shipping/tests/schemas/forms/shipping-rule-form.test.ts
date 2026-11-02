import { describe, expect, it } from 'vitest';

import { ShippingRuleFormSchema } from '@/features/settings/shipping/schemas/forms/shipping-rule-form';

describe('ShippingRuleFormSchema', () => {
  it('reshapes the flat form into the nested relation/conditions/action structure', () => {
    const result = ShippingRuleFormSchema.parse({
      condition: 'product_categories',
      operator: '=',
      condition_value: '1',
      action: 'set_shipping_cost',
      action_value: '10',
    });

    expect(result).toEqual({
      relation: 'AND',
      conditions: [{ type: 'product_categories', operator: '=', value: '1' }],
      action: { type: 'set_shipping_cost', value: '10' },
    });
  });

  it('nulls action.value for non-cost actions even when action_value is set', () => {
    const result = ShippingRuleFormSchema.parse({
      condition: 'product_categories',
      operator: '=',
      condition_value: '1',
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

  it('keeps action.value for multiply_shipping_cost', () => {
    const result = ShippingRuleFormSchema.parse({
      condition: 'cart_weight',
      operator: '>',
      condition_value: '5',
      action: 'multiply_shipping_cost',
      action_value: '1.5',
    });
    expect(result.action.value).toBe('1.5');
  });

  it.each(['set_shipping_cost', 'add_shipping_cost', 'multiply_shipping_cost'])(
    'rejects a blank or non-numeric value for %s',
    (action) => {
      ['', null, 'abc'].forEach((action_value) => {
        const result = ShippingRuleFormSchema.safeParse({
          condition: 'cart_weight',
          operator: '>',
          condition_value: '5',
          action,
          action_value,
        });
        expect(result.success).toBe(false);
      });
    },
  );

  it.each(['cart_weight', 'cart_subtotal'])('rejects a non-numeric %s value', (condition) => {
    const result = ShippingRuleFormSchema.safeParse({
      condition,
      operator: '>',
      condition_value: 'abc',
      action: 'set_free_shipping',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a condition without a value', () => {
    const result = ShippingRuleFormSchema.safeParse({
      condition: 'product_categories',
      operator: '=',
      condition_value: null,
      action: 'set_free_shipping',
    });
    expect(result.success).toBe(false);
  });
});
