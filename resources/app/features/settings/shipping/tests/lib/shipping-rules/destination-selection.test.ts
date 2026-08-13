import { describe, expect, it } from 'vitest';

import {
  applyDestinationToRule,
  filterStates,
  getCountryOptions,
  resolveOpenSelection,
  resolveStatesForCountry,
  toggleState,
  updateRegionStates,
} from '@/features/settings/shipping/lib/shipping-rules/destination-selection';
import type { CountryWithStates, ShippingRegion, ShippingRule } from '@/features/settings/shipping/types';

const country = (code: string, name: string, states: { id: string; name: string }[] = []): CountryWithStates => ({
  code,
  name,
  states,
});

describe('getCountryOptions', () => {
  it('keeps only countries present in the selected regions', () => {
    const countryList = [country('US', 'United States'), country('CA', 'Canada')];
    const selectedRegion: ShippingRegion[] = [{ country: 'US', states: [] }];

    expect(getCountryOptions(countryList, selectedRegion)).toEqual([
      { label: 'United States', value: 'US' },
    ]);
  });

  it('returns an empty array when the country list is not loaded yet', () => {
    expect(getCountryOptions(null, [])).toEqual([]);
  });
});

describe('resolveOpenSelection', () => {
  const selectedRegion: ShippingRegion[] = [{ country: 'US', states: ['CA', 'NY'] }];

  it('uses the stored condition value when it matches the selected country', () => {
    const result = resolveOpenSelection('US', { country: 'US', states: ['TX'] }, selectedRegion);

    expect(result).toEqual({ country: 'US', states: ['TX'] });
  });

  it('falls back to the region\'s own states when the condition value is for a different country', () => {
    const result = resolveOpenSelection('US', { country: 'CA', states: ['ON'] }, selectedRegion);

    expect(result).toEqual({ country: 'US', states: ['CA', 'NY'] });
  });

  it('resolves an empty country and no states when nothing is selected', () => {
    expect(resolveOpenSelection(null, null, [])).toEqual({ country: '', states: [] });
  });
});

describe('resolveStatesForCountry', () => {
  const countryList = [country('US', 'United States', [{ id: 'CA', name: 'California' }, { id: 'NY', name: 'New York' }])];
  const selectedRegion: ShippingRegion[] = [{ country: 'US', states: ['NY'] }];

  it('lists the country\'s states and preselects the region\'s recorded states', () => {
    const result = resolveStatesForCountry('US', null, selectedRegion, countryList);

    expect(result.stateList).toEqual([{ id: 'CA', name: 'California' }, { id: 'NY', name: 'New York' }]);
    expect(result.states).toEqual(['NY']);
  });

  it('prefers the stored condition value for the same country over the region\'s states', () => {
    const result = resolveStatesForCountry('US', { country: 'US', states: ['CA'] }, selectedRegion, countryList);

    expect(result.states).toEqual(['CA']);
  });

  it('returns an empty state list for an unknown country code', () => {
    const result = resolveStatesForCountry('FR', null, selectedRegion, countryList);

    expect(result).toEqual({ stateList: [], states: [] });
  });
});

describe('filterStates', () => {
  const stateList = [{ id: 'CA', name: 'California' }, { id: 'NY', name: 'New York' }];

  it('returns every state when the search is blank', () => {
    expect(filterStates(stateList, '  ')).toEqual(stateList);
  });

  it('filters case-insensitively by name', () => {
    expect(filterStates(stateList, 'new')).toEqual([{ id: 'NY', name: 'New York' }]);
  });
});

describe('toggleState', () => {
  it('adds a state that is not yet selected', () => {
    expect(toggleState(['CA'], 'NY')).toEqual(['CA', 'NY']);
  });

  it('removes a state that is already selected', () => {
    expect(toggleState(['CA', 'NY'], 'CA')).toEqual(['NY']);
  });
});

describe('updateRegionStates', () => {
  it('replaces the states for the matching region only', () => {
    const regions: ShippingRegion[] = [
      { country: 'US', states: ['NY'] },
      { country: 'CA', states: ['ON'] },
    ];

    const result = updateRegionStates(regions, { country: 'US', states: ['CA', 'TX'] });

    expect(result).toEqual([
      { country: 'US', states: ['CA', 'TX'] },
      { country: 'CA', states: ['ON'] },
    ]);
  });
});

describe('applyDestinationToRule', () => {
  it('merges the new states into the existing condition value for the same country', () => {
    const rules: ShippingRule[] = [
      {
        conditions: [{ type: 'destination_region', operator: 'is', value: { country: 'US', states: ['NY'] } }],
        action: { type: 'set_shipping_cost', value: 5 },
      },
    ];

    const result = applyDestinationToRule(rules, 0, { country: 'US', states: ['CA'] });

    expect(result[0].conditions[0].value).toEqual({ country: 'US', states: ['CA'] });
  });

  it('replaces the condition value outright when the country changes', () => {
    const rules: ShippingRule[] = [
      {
        conditions: [{ type: 'destination_region', operator: 'is', value: { country: 'US', states: ['NY'] } }],
        action: { type: 'set_shipping_cost', value: 5 },
      },
    ];

    const result = applyDestinationToRule(rules, 0, { country: 'CA', states: ['ON'] });

    expect(result[0].conditions[0].value).toEqual({ country: 'CA', states: ['ON'] });
  });

  it('leaves a rule at a different index untouched', () => {
    const rules: ShippingRule[] = [
      { conditions: [{ type: 'product_category', operator: 'is', value: 'Shoes' }], action: { type: 'set_shipping_cost', value: 5 } },
      { conditions: [{ type: 'destination_region', operator: 'is', value: { country: 'US', states: [] } }], action: { type: 'set_shipping_cost', value: 5 } },
    ];

    const result = applyDestinationToRule(rules, 1, { country: 'CA', states: ['ON'] });

    expect(result[0]).toEqual(rules[0]);
  });

  it('leaves a non-destination condition untouched even at the target index', () => {
    const rules: ShippingRule[] = [
      { conditions: [{ type: 'product_category', operator: 'is', value: 'Shoes' }], action: { type: 'set_shipping_cost', value: 5 } },
    ];

    const result = applyDestinationToRule(rules, 0, { country: 'US', states: ['NY'] });

    expect(result[0]).toEqual(rules[0]);
  });
});
