import { describe, expect, it } from 'vitest';

import {
  buildRuleDefaultValues,
  type ConditionDataMap,
  getConditionValueOptions,
  getOperatorOptions,
  mergeRuleIntoMethodRules,
  resolveDestinationSelection,
} from '@/features/settings/shipping/lib/shipping-rules/rule-form';
import type { ShippingRuleFormPayload } from '@/features/settings/shipping/schemas/forms/shipping-rule-form';
import type { ShippingRegion, ShippingRule } from '@/features/settings/shipping/types';

describe('buildRuleDefaultValues', () => {
  it('falls back to schema defaults when there is no initial rule', () => {
    const result = buildRuleDefaultValues();

    expect(result.condition).toBe('');
    expect(result.action).toBe('');
  });

  it('hydrates a product_category condition as-is', () => {
    const rule: ShippingRule = {
      conditions: [{ type: 'product_category', operator: 'is', value: 'Shoes' }],
      action: { type: 'set_shipping_cost', value: 10 },
    };

    const result = buildRuleDefaultValues(rule);

    expect(result).toMatchObject({
      condition: 'product_category',
      operator: 'is',
      condition_value: 'Shoes',
      action: 'set_shipping_cost',
      action_value: 10,
      selected_country: null,
    });
  });

  it('unpacks a destination_region condition into country and states', () => {
    const rule: ShippingRule = {
      conditions: [{
        type: 'destination_region',
        operator: 'is',
        value: { country: 'US', states: ['CA', 'NY'] },
      }],
      action: { type: 'disable_shipping_method', value: '' },
    };

    const result = buildRuleDefaultValues(rule);

    expect(result.condition_value).toEqual({ country: 'US', states: ['CA', 'NY'] });
    expect(result.selected_country).toBe('US');
  });

  it('defaults a cart_weight condition\'s operator and action from the rule', () => {
    const rule: ShippingRule = {
      conditions: [{ type: 'cart_weight', operator: '>', value: 5 }],
      action: { type: 'add_shipping_cost', value: 3 },
    };

    const result = buildRuleDefaultValues(rule);

    expect(result.operator).toBe('>');
    expect(result.action).toBe('add_shipping_cost');
  });
});

describe('mergeRuleIntoMethodRules', () => {
  const rule: ShippingRuleFormPayload = {
    relation: 'AND',
    conditions: [{ type: 'set_free_shipping', operator: 'is', value: null }],
    action: { type: 'set_free_shipping', value: null },
  };

  it('appends a new rule when ruleIndex is -1', () => {
    const existing: ShippingRule[] = [{ conditions: [], action: { type: 'set_shipping_cost', value: 5 } }];

    expect(mergeRuleIntoMethodRules(existing, rule, -1)).toEqual([...existing, rule]);
  });

  it('replaces the rule at ruleIndex when editing', () => {
    const existing: ShippingRule[] = [
      { conditions: [], action: { type: 'set_shipping_cost', value: 5 } },
      { conditions: [], action: { type: 'add_shipping_cost', value: 2 } },
    ];

    expect(mergeRuleIntoMethodRules(existing, rule, 1)).toEqual([existing[0], rule]);
  });

  it('treats a missing rules list as empty', () => {
    expect(mergeRuleIntoMethodRules(undefined, rule, -1)).toEqual([rule]);
  });
});

describe('getConditionValueOptions', () => {
  const conditionData: ConditionDataMap = {
    product_category: [{ id: 1, name: 'Shoes' }, { id: 2, name: 'Hats' }],
    shipping_profile: [{ id: 'p1', name: 'Standard' }],
  };

  it('maps product_category options by name', () => {
    expect(getConditionValueOptions('product_category', conditionData)).toEqual([
      { label: 'Shoes', value: 'Shoes' },
      { label: 'Hats', value: 'Hats' },
    ]);
  });

  it('maps shipping_profile options by name', () => {
    expect(getConditionValueOptions('shipping_profile', conditionData)).toEqual([
      { label: 'Standard', value: 'Standard' },
    ]);
  });

  it('returns no options for destination_region', () => {
    expect(getConditionValueOptions('destination_region', conditionData)).toEqual([]);
  });

  it('returns no options for cart_weight', () => {
    expect(getConditionValueOptions('cart_weight', conditionData)).toEqual([]);
  });

  it('returns an empty array when the condition has no data loaded yet', () => {
    expect(getConditionValueOptions('product_category', {})).toEqual([]);
  });
});

describe('getOperatorOptions', () => {
  it('offers the three comparison operators for cart_weight', () => {
    expect(getOperatorOptions('cart_weight')).toEqual([
      { label: '> (Greater than)', value: '>' },
      { label: '= (Equal to)', value: '=' },
      { label: '< (Less than)', value: '<' },
    ]);
  });

  it.each(['product_category', 'shipping_profile', 'destination_region', undefined])(
    'offers only "is" for %s',
    (condition) => {
      expect(getOperatorOptions(condition)).toEqual([{ label: 'is', value: 'is' }]);
    },
  );
});

describe('resolveDestinationSelection', () => {
  const regions: ShippingRegion[] = [
    { country: 'US', states: ['CA', 'NY'] },
    { country: 'CA', states: [] },
  ];

  it('keeps the explicitly selected country and its states', () => {
    expect(resolveDestinationSelection('CA', regions, 'add')).toEqual({
      selectedCountry: 'CA',
      conditionValue: { country: 'CA', states: [] },
    });
  });

  it('falls back to the first region when no country is selected', () => {
    expect(resolveDestinationSelection(null, regions, 'add')).toEqual({
      selectedCountry: 'US',
      conditionValue: { country: 'US', states: ['CA', 'NY'] },
    });
  });

  it('resolves the country but leaves condition_value untouched in edit mode', () => {
    expect(resolveDestinationSelection('CA', regions, 'edit')).toEqual({
      selectedCountry: 'CA',
      conditionValue: null,
    });
  });

  it('resolves to an empty country when there are no regions on record', () => {
    expect(resolveDestinationSelection(null, [], 'add')).toEqual({
      selectedCountry: '',
      conditionValue: null,
    });
  });
});
