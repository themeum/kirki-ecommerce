import { describe, expect, it } from 'vitest';

import type { GroupedCountryList } from '@/features/settings/tax/lib/helper';
import {
  filterAvailableCountries,
  toggleCountrySelection,
  toggleStateSelection,
} from '@/features/settings/tax/lib/tax-region-selection';
import type { SelectedTaxRegionDraft, TaxRegion } from '@/features/settings/tax/lib/utils';

const buildCountry = (code: string, name: string, states: { id: string; name: string }[] = []) => ({
  code,
  name,
  group: undefined,
  flag: '🏳️',
  states,
});

describe('filterAvailableCountries', () => {
  const countryList = [
    buildCountry('US', 'United States'),
    buildCountry('CA', 'Canada'),
  ] as unknown as GroupedCountryList;

  it('returns every country when there is no search and no existing regions', () => {
    expect(filterAvailableCountries(countryList, '', [])).toEqual(countryList);
  });

  it('excludes a country that already has a tax region', () => {
    const regions: TaxRegion[] = [{ code: 'US', name: 'United States', is_enabled: true, states: [] }];

    const result = filterAvailableCountries(countryList, '', regions);

    expect(result.map((c) => c.code)).toEqual(['CA']);
  });

  it('filters by search text', () => {
    const result = filterAvailableCountries(countryList, 'canada', []);

    expect(result.map((c) => c.code)).toEqual(['CA']);
  });

  it('returns an empty array when the country list has not loaded yet', () => {
    expect(filterAvailableCountries([], '', [])).toEqual([]);
  });
});

describe('toggleCountrySelection', () => {
  it('adds a country and seeds its region draft from its states', () => {
    const country = buildCountry('US', 'United States', [{ id: 'CA', name: 'California' }]);

    const result = toggleCountrySelection([], [], country);

    expect(result.countries).toEqual(['US']);
    expect(result.regions).toEqual([
      {
        id: 'US',
        country: 'United States',
        states: [{ id: 'CA', title: 'California', flag: '' }],
        hasDeselectedState: false,
        flag: '🏳️',
      },
    ]);
  });

  it('removes a country and its region draft when deselected', () => {
    const country = buildCountry('US', 'United States');
    const existingRegion: SelectedTaxRegionDraft = {
      id: 'US',
      country: 'United States',
      states: [],
    };

    const result = toggleCountrySelection(['US'], [existingRegion], country);

    expect(result.countries).toEqual([]);
    expect(result.regions).toEqual([]);
  });
});

describe('toggleStateSelection', () => {
  const allStates = [{ id: 'CA', name: 'California' }, { id: 'NY', name: 'New York' }];
  const region: SelectedTaxRegionDraft = {
    id: 'US',
    country: 'United States',
    states: [{ id: 'CA', title: 'California', flag: '' }],
  };

  it('adds a state and marks the country as partially selected', () => {
    const result = toggleStateSelection(['US'], [region], 'NY', 'US', allStates);

    expect(result?.regions[0]).toMatchObject({
      states: [
        { id: 'CA', title: 'California', flag: '' },
        { id: 'NY', title: 'New York', flag: '' },
      ],
      hasDeselectedState: false,
    });
  });

  it('removes a state and keeps the country marked as partially selected', () => {
    const twoStateRegion: SelectedTaxRegionDraft = {
      ...region,
      states: [{ id: 'CA', title: 'California', flag: '' }, { id: 'NY', title: 'New York', flag: '' }],
    };

    const result = toggleStateSelection(['US'], [twoStateRegion], 'NY', 'US', allStates);

    expect(result?.regions[0].states).toEqual([{ id: 'CA', title: 'California', flag: '' }]);
    expect(result?.regions[0].hasDeselectedState).toBe(true);
  });

  it('drops the country entirely once its last state is removed', () => {
    const result = toggleStateSelection(['US'], [region], 'CA', 'US', allStates);

    expect(result).toEqual({ countries: [], regions: [] });
  });

  it('returns null when the country is not in the draft', () => {
    expect(toggleStateSelection(['US'], [region], 'CA', 'MISSING', allStates)).toBeNull();
  });
});
