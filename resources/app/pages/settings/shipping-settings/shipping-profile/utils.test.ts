import { describe, expect, it } from 'vitest';

import type { ShippingZone } from '@/pages/settings/shipping-settings/utils';
import { getProfileUsage } from '@/pages/settings/shipping-settings/shipping-profile/utils';

const buildZone = (
  id: string | number,
  profileNames: Array<string | null>,
): ShippingZone => ({
  id,
  title: `Zone ${id}`,
  is_enabled: true,
  regions: [],
  shipping_methods: [
    {
      id: `method-${id}`,
      type: 'flat_rate',
      shipping_rules: profileNames.map((profileName) => ({
        conditions:
          profileName === null
            ? [{ type: 'product_category', operator: 'is', value: 'shoes' }]
            : [
              {
                type: 'shipping_profile',
                operator: 'is',
                value: profileName,
              },
            ],
        action: { type: 'add_amount', value: 5 },
      })),
    },
  ],
});

describe('getProfileUsage', () => {
  it('reports no usage for a profile no rule references', () => {
    const zones = [buildZone(1, ['Fragile'])];

    expect(getProfileUsage('Heavy Weight', zones)).toEqual({
      ruleCount: 0,
      zoneCount: 0,
    });
  });

  it('counts one zone per zone, however many of its rules match', () => {
    const zones = [buildZone(1, ['Heavy Weight', 'Heavy Weight'])];

    expect(getProfileUsage('Heavy Weight', zones)).toEqual({
      ruleCount: 2,
      zoneCount: 1,
    });
  });

  it('counts rules and zones across several zones', () => {
    const zones = [
      buildZone(1, ['Heavy Weight']),
      buildZone(2, ['Heavy Weight']),
      buildZone(3, ['Heavy Weight']),
    ];

    expect(getProfileUsage('Heavy Weight', zones)).toEqual({
      ruleCount: 3,
      zoneCount: 3,
    });
  });

  it('ignores conditions of other types that share the profile name', () => {
    const zones = [buildZone(1, [null])];

    expect(getProfileUsage('shoes', zones)).toEqual({
      ruleCount: 0,
      zoneCount: 0,
    });
  });

  it('matches profiles by name, not by id', () => {
    const zones = [buildZone(1, ['Heavy Weight'])];

    expect(getProfileUsage('7', zones).ruleCount).toBe(0);
    expect(getProfileUsage('Heavy Weight', zones).ruleCount).toBe(1);
  });

  it('handles zones with no methods or rules', () => {
    const zones: ShippingZone[] = [
      { id: 1, title: 'Empty', is_enabled: true, regions: [], shipping_methods: [] },
    ];

    expect(getProfileUsage('Heavy Weight', zones)).toEqual({
      ruleCount: 0,
      zoneCount: 0,
    });
  });
});
